var DBUser = require('../models/User.js');
class User {
	constructor(infos){
		this.data = infos.data;
		this.basicInfo = infos.basicInfo;
		this.loginInfo = infos.loginInfo;
		this.ID = infos.ID;
	}

	// Đăng nhập
	// done(err, null) nếu lỗi
	// done(null, null) nếu đăng nhập không thành công
	// done(null, user) nếu đăng nhập thành công
	static Login(username, password, done){
		DBUser.VerifyLogin(username, password, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		});
	}

	// done(err, success)
	static ChangePass(userID, password, done){
		DBUser.ChangePass(userID, password, done);
	}

	// Trả về User nếu có hoặc null nếu không có
	static Get(ID, done){
		DBUser.Get(ID, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		})
	}

	// Trả về User nếu có hoặc null nếu không có
	static GetByUsername(username, done){
		DBUser.GetByUsername(username, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		});
	}
	// Kiểm tra đăng nhập
	static RequiredLogin (req, res, next) {
		if (req.isAuthenticated())
			next();
		else
			res.redirect('/login?redirect_uri='+req.originalUrl);
	}

	// done(err, user)
	static GetBySocialLogin(socialLogin, done){
		DBUser.GetBySocialLogin(socialLogin, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		})
	}
	// Thêm mới user
	// data { username, password, fullname, email, phone, dateOfBirth, gender, address }
	// done(err, null) nếu lỗi
	// done(null, null) nếu thêm không thành công
	// done(null, user) nếu thêm thành công
	static Add(data, done){
		var dataInfo = {
			basicInfo: {
				email: data.email,
				fullname: data.fullname,
				phone: data.phone,
				dateOfBirth: data.dateOfBirth,
				gender: data.gender,
				address: data.address
			},
			loginInfo: {
				loginType: "localLogin",
				localLogin: {
					username: data.username,
					password: data.password
				}
			}
		}
		DBUser.Add(dataInfo, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		})
	}
	// Thêm mới user
	// data { socialType, accountID, fullname, email }
	// done(err, null) nếu lỗi
	// done(null, null) nếu thêm không thành công
	// done(null, user) nếu thêm thành công
	static AddSocail(data, done){
		var dataInfo = {
			basicInfo: {
				email: data.email,
				fullname: data.fullname,
				phone: data.phone,
				dateOfBirth: data.dateOfBirth,
				gender: data.gender,
				address: data.address
			},
			loginInfo: {
				loginType: "socialLogin",
				socialLogin: {
					socialType: data.socialType,
					accountID: data.accountID
				}
			}
		}
		if (data.avatar) dataInfo.basicInfo.avatar = data.avatar;


		DBUser.Add(dataInfo, function(err, dataUser){
			if (err) return done(err, null);
			if (!dataUser) return done(null, null);
			return done(null, new User({
				data: dataUser,
				ID: dataUser._id,
				basicInfo: dataUser.basicInfo,
				loginInfo: dataUser.loginInfo
			}));
		})
	}
	// done(err, success)
	static UpdateBasicInfo(userID, basicInfo, done){
		DBUser.UpdateBasicInfo(userID, basicInfo, done);
	}

	// done(err, success)
	static VerifyEmailExists(email, done){
		DBUser.VerifyEmailExists(email, done);
	}
	// done(err, success)
	static VerifyUsernameExists(username, done){
		DBUser.VerifyUsernameExists(username, done);
	}
	// socialLogin( socialType, accountID )
	// done(err, success)
	static VerifySocialLoginExists(socialLogin, done){
		DBUser.VerifySocialLoginExists(socialLogin, done);
	}
}

module.exports = User;