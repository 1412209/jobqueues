var DB = require('./DB.js');
var async = require("async")
var passwordHash = require('password-hash');
var Model = null;
class User {
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			basicInfo: {
				email: String,
				fullname: String,
				dateOfBirth: Date,
				gender: Number,	// 0: Female | 1: Male | -1: Other
				address: String,
				phone: String,
				avatar: {type: String, default: "/images/default-avatar.png"}
			},
			loginInfo: {
				loginType: String, // socialLogin || localLogin
				socialLogin: { socialType: String, accountID: String },	// socialType: facebook || google
				localLogin: { username: String, password: String }
			},
			publicDate: { type: Date, default: Date.now }
		});
		Model = DB.mongoose.model('user', schema);
		return Model;
	}

	/*
	*	Thêm mới
	*	data = {
	*		basicInfo 
	*		loginInfo
	*	}
	*	done(err, null) Nếu lỗi
	*	done(null, user) Nếu thành công
	*	done(null, null) Nếu tên user đã trùng => không thành công
	*/
	static Add(data, done=null){
		User.GetModel();
		if (data.loginInfo.loginType == "localLogin"){
			data.loginInfo.localLogin.password = passwordHash.generate(data.loginInfo.localLogin.password);
		}
		User.VerifyAdded(data, function(err, success){
			if (err) return fail(err);
			if (!success) return fail(null);
			var model = new Model({
				basicInfo: data.basicInfo,
				loginInfo: data.loginInfo
			});
			model.save(function(err, data){
				if (err) return fail(err);
				if (!data) return fail(null);
				return fsuccess(data);
			});
		})
		function fsuccess(data){
			if (done) return done(null, data);
		}
		function fail(err){
			if (done) return done(err, null);
		}
	}

	// done(err, success)
	static ChangePass(userID, password, done){
		User.GetModel();
		password = passwordHash.generate(password);
		Model.update({
			_id: userID,
		},{
			'loginInfo.localLogin.password': password
		},{
			upsert: false
		}, function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}

	// Lấy thông tin người dùng dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có user
	// done(null, user): nếu tìm thấy user
	static Get(ID, done){
		User.GetModel();
		Model.findOne({ _id: ID }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	// Lấy thông tin người dùng dựa vào username
	// done(err, null): lỗi
	// done(null, null): không có user
	// done(null, user): nếu tìm thấy user
	static GetByUsername(username, done){
		User.GetModel();
		Model.findOne({ 'loginInfo.localLogin.username': username, "loginInfo.loginType": "localLogin" }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
	static GetBySocialLogin(socialLogin, done){
		User.GetModel();
		Model.findOne({
			'loginInfo.socialLogin.socialType': socialLogin.socialType,
			'loginInfo.socialLogin.accountID': socialLogin.accountID,
			"loginInfo.loginType": "socialLogin"
		}, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}


	// done(err, success)
	static UpdateBasicInfo(userID, basicInfo, done){
		User.GetModel();
		var update = {basicInfo: {}}
		if (basicInfo.fullname) update.basicInfo.fullname = basicInfo.fullname;
		if (basicInfo.email) update.basicInfo.email = basicInfo.email;
		if (basicInfo.phone) update.basicInfo.phone = basicInfo.phone;
		if (basicInfo.dateOfBirth) update.basicInfo.dateOfBirth = basicInfo.dateOfBirth;
		if (basicInfo.gender) update.basicInfo.gender = basicInfo.gender;
		if (basicInfo.address) update.basicInfo.address = basicInfo.address;

		Model.update({
			_id: userID,
		},update,{
			upsert: false
		}, function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}

	// Kiểm tra đăng nhập
	// done(err, null): Nếu đăng nhập lỗi
	// done(null, null): Nếu đăng nhập thất bại
	// done(null, user): Nếu đăng nhập thành công
	static VerifyLogin(username, password, done){
		User.GetModel();
		User.GetByUsername(username, function(err, user){
			if (err) return done(err, null);
			if (!user) return done(null, null);
			if (checkCoincidePassword(password, user.loginInfo.localLogin.password))
				return done(null, user);
			return done(null, null);
		});
		function checkCoincidePassword(pass, passCompare){	// passCompare là pass từ db
			return passwordHash.verify(pass, passCompare);
		}
	}

	// data (Schema User)
	// done(err, success)
	static VerifyAdded(data, done){
		if (!data || !data.loginInfo || !data.loginInfo.loginType)
			return done(null, false);
		if (data.loginInfo.loginType == "localLogin")
			async.parallel({
				verifyEmailExists: function(callback){
					User.VerifyEmailExists(data.basicInfo.email, callback);
				},
				verifyUsernameExists: function(callback){
					User.VerifyUsernameExists(data.basicInfo.username, callback)
				}
			}, function(err, results){
				if (err) return done(err, false);
				if (!results.verifyUsernameExists || !results.verifyEmailExists)
					return done(null, false);
				return done(null, true);
			})
		else if (data.loginInfo.loginType == "socialLogin")
			User.VerifySocialLoginExists(data.loginInfo.socialLogin, function(err, success){
				if (err) return done(err, false);
				return done(null, success);
			})
		else return done(null, false);
	}

	// done(err, success)
	static VerifyEmailExists(email, done){
		User.GetModel();
		Model.findOne({ 'basicInfo.email': email, "loginInfo.loginType": "localLogin" }, function(err, data){
			if (err) return done(err, false);
			if (data) return done(null, false);
			return done(null, true);
		});
	}
	// done(err, success)
	static VerifyUsernameExists(username, done){
		User.GetModel();
		Model.findOne({ 'loginInfo.localLogin.username': username, "loginInfo.loginType": "localLogin" }, function(err, data){
			if (err) return done(err, false);
			if (data) return done(null, false);
			return done(null, true);
		});
	}

	// socialLogin( socialType, accountID )
	// done(err, success)
	static VerifySocialLoginExists(socialLogin, done){
		if (!socialLogin.socialType || !socialLogin.accountID)
			return done(null, false);
		User.GetBySocialLogin(socialLogin, function(err, data){
			if (err) return done(err, false);
			if (!data) return done(null, true);
			return done(null, false);
		})
	}
}
module.exports = User;