var DB = require('./DB.js');
var Model = null;
class AccountPermission {
	static GetModel(){
		if (Model != null)
			return Model;
		// (jobSlug + userID + authentications.id) không có cặp trùng nhau
		var schema = DB.mongoose.Schema({
			jobSlug: String,
			userID: String,
			authentications: {},	// Phải bao gồm {id} để định danh với các chứng thực khác nhau.
			basicInfos: { name: String, identity: String },
			moreInfos: {},	// Các thông tin bổ sung nếu cần thiết
			publicDate: { type: Date, default: Date.now }
		});
		Model = DB.mongoose.model('account_permission', schema);
		return Model;
	}

	/*
	*	Thêm mới Account Permission 
	*	data = {
	*		jobSlug
	*		userID
	*		authentications
	*		basicInfos
	*		moreInfos
	*	}
	*	done(err, null) Nếu lỗi
	*	done(null, account) Nếu thành công
	*	done(null, null): Nếu không thành công (trong trường hợp bộ ba (jobSlug + userID + authentications.id) có cặp trùng nhau)
	*/
	static Add(accountInfos, done=null){
		AccountPermission.GetModel();
		AccountPermission.VerifyForeignKeyExists(
			accountInfos.jobSlug,
			accountInfos.userID,
			accountInfos.authentications, 
			function(err, idAP){
				if (err && done) return done(err, null);
				if (err) return;

				if (idAP){
					var dataInfos = {};
					if (accountInfos.jobSlug) dataInfos.jobSlug = accountInfos.jobSlug;
					if (accountInfos.userID) dataInfos.userID = accountInfos.userID;
					if (accountInfos.authentications) dataInfos.authentications = accountInfos.authentications;
					if (accountInfos.basicInfos) dataInfos.basicInfos = accountInfos.basicInfos;
					if (accountInfos.moreInfos) dataInfos.moreInfos = accountInfos.moreInfos;
					AccountPermission.Update(idAP, dataInfos, function(err, success){
						if (err && done) return done(err, null);
						if (err) return;
						return done(err, idAP);
					})
					return;
				}

				var model = new Model({
					jobSlug: accountInfos.jobSlug,
					userID: accountInfos.userID,
					authentications: accountInfos.authentications,
					basicInfos: accountInfos.basicInfos,
					moreInfos: accountInfos.moreInfos,
				});
				model.save(function(err, data){
					if (err && done) return done(err, null);
					if (err) return;

					if(done) return done(null, data);
				});

			}
		)
	}

	// Lấy thông tin Account Permission dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có account
	// done(null, account): nếu tìm thấy account
	static Get(ID, done, userIDVerify=null){
		AccountPermission.GetModel();
		var query = { _id: ID };
		if (userIDVerify) query.userID = userIDVerify;
		Model.findOne(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	// Lấy toàn bộ Account Permission
	// done(err, null): Lỗi
	// done(null, accounts): nếu thành công
	//		accounts: danh sách các account permission
	static GetAll(done, userIDVerify=null){
		AccountPermission.GetModel();
		var query = { };
		if (userIDVerify) query.userID = userIDVerify;
		Model.find(query).sort({publicDate:-1}).exec(function(err, data){
			if (err) return data(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}

	// Lấy toàn bộ Account Permission dựa vào công việc (jobSlug) và người sở hữu (userID)
	// done(err, null): Lỗi
	// done(null, accounts): nếu thành công
	//		accounts: danh sách các account permission
	static GetByJobAndUser(jobSlug, userID, done){
		AccountPermission.GetModel();
		Model.find({jobSlug:jobSlug,userID:userID}, function(err, data){
			if (err) return data(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}

	static Update(id, updateInfos, done=null, userIDVerify=null){
		AccountPermission.GetModel();
		var query = {_id:id};
		if (userIDVerify) query.userID = userIDVerify;
		Model.update(query, updateInfos,{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	// Kiểm tra bộ ba cặp (jobSlug + userID + authentications.id) tồn tại không
	// done(err, false): Nếu lỗi
	// done(null, false): Nếu không tồn tại
	// done(null,id): Nếu tồn tại
	static VerifyForeignKeyExists(jobSlug, userID, authentications, done, userIDVerify=null){
		AccountPermission.GetModel();
		Model.findOne({
			jobSlug: jobSlug,
			userID: userID,
			'authentications.id': authentications.id
		}, function(err, data){
			if (err) return done(err, false);
			if (data) return done(null, data._id);
			return done(null, false);
		});
	}

	// query { limit, skip, search, jobSlugs: [String] }
	// userID,
	// done(err, dataAccountPermission)
	static FilterByJobsAndSearch(query, userID, done){
		var search = query.search ? query.search : "";
		var jobSlugs = query.jobSlugs ? query.jobSlugs : [];
		var skip = query.skip ? query.skip : 0;
		var limit = query.limit ? query.limit : 0;

		AccountPermission.GetModel();
		var find = {
			"basicInfos.name": new RegExp(search, "i"),
			userID: userID,
			jobSlug: {$in: jobSlugs}
		};
		Model.find(find).sort({publicDate:-1}).skip(skip).limit(limit).exec(function(err, data){
			if (err) return done(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}

	// done (err, success)
	static UpdateName(name, accountID, done, userIDVerify=null){
		AccountPermission.GetModel();
		var query = { _id:accountID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.update(query,{
			'basicInfos.name': name
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	// done (err, success)
	static Remove(accountID, done, userIDVerify=null){
		AccountPermission.GetModel();
		var query = { _id:accountID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.findOneAndRemove(query).exec(function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
}

module.exports = AccountPermission;