var DBAccountPermission = require("../models/AccountPermission.js");

class AccountPermission {
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.jobSlug = infos.jobSlug;
		this.authentications = infos.authentications; // { id, cấu hình trong getAuthInfos của job }
		this.basicInfos = infos.basicInfos;
		this.moreInfos = infos.moreInfos;
		this.publicDate = infos.publicDate;
	}

	// Lấy thông tin Account Permission dựa vào ID
	// done(err, null): lỗi
	// done(null, null): không có account
	// done(null, account): nếu tìm thấy account
	static Get(ID, done, userIDVerify=null){
		DBAccountPermission.Get(ID, function(err, dataAccount){
			if (err) return done(err, null);
			if (!dataAccount) return done(null, null);
			return done(null, new AccountPermission({
				data: dataAccount,
				ID: dataAccount._id,
				jobSlug: dataAccount.jobSlug,
				authentications: dataAccount.authentications,
				basicInfos: dataAccount.basicInfos,
				moreInfos: dataAccount.moreInfos,
				publicDate: dataAccount.publicDate
			}));
		}, userIDVerify)
	}

	// Tạo mới một AccountPermission
	static Add(infos, done=null){
		DBAccountPermission.Add({
			jobSlug: infos.jobSlug,
			userID: infos.userID,
			authentications: infos.authentications,
			basicInfos: infos.basicInfos
		}, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return done(null, new AccountPermission({
				data: data,
				authentications: data.authentications,
				basicInfos: data.basicInfos
			}));
		})
	}

	static GetByJobAndUser(jobSlug, userID, done){
		DBAccountPermission.GetByJobAndUser(jobSlug, userID, function(err, dataAccounts){
			if (err) return done(err, null);
			if (!dataAccounts) return done(null, null);
			var accounts = [];
			dataAccounts.forEach(function(dataAccount){
				var account = new AccountPermission({
					data: dataAccount,
					ID: dataAccount._id,
					jobSlug: dataAccount.jobSlug,
					authentications: dataAccount.authentications,
					basicInfos: dataAccount.basicInfos,
					moreInfos: dataAccount.moreInfos,
					publicDate: dataAccount.publicDate
				});
				accounts.push(account);
			});
			return done(null, accounts);
		});
	}

	// query { limit, skip, search, jobSlugs: [String] }
	// done(err, accountPermistions)
	static FilterByJobsAndSearch(query, userID, done){
		DBAccountPermission.FilterByJobsAndSearch(query, userID, function(err, dataAccounts){
			if (err) return done(err, null);
			if (!dataAccounts) return done(null, null);
			var accounts = [];
			dataAccounts.forEach(function(dataAccount){
				var account = new AccountPermission({
					data: dataAccount,
					jobSlug: dataAccount.jobSlug,
					ID: dataAccount._id,
					authentications: dataAccount.authentications,
					basicInfos: dataAccount.basicInfos,
					moreInfos: dataAccount.moreInfos,
					publicDate: dataAccount.publicDate
				});
				accounts.push(account);
			});
			return done(null, accounts);
		});
	}
	// done (err, success)
	static UpdateName(name, accountID, done, userIDVerify=null){
		DBAccountPermission.UpdateName(name, accountID, done, userIDVerify);
	}
	// done (err, success)
	static Remove(accountID, done, userIDVerify=null){
		DBAccountPermission.Remove(accountID, done, userIDVerify);
	}
}

module.exports = AccountPermission;