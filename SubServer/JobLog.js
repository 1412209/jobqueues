var DBJobLog = require("./models/JobLog.js");

class JobLog{
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.userID = infos.userID;
		this.type = infos.type;
		this.date = infos.date;
		this.cat = infos.cat;
		this.name = infos.name;
		this.jobChainID = infos.jobChainID;
		this.info = infos.info;
	}
	static Add(data, done=null){
		DBJobLog.Add(data, function(err, dataJobLog){
			if (!done) return;
			if (err) return done(err, null);
			if (!dataJobLog) return done(null, null);
			return done(null, new JobMeta({
				data: dataJobLog,
				ID: dataJobLog._id,
				userID: dataJobLog.userID,
				type: dataJobLog.type,
				date: dataJobLog.date,
				cat: dataJobLog.cat,
				name: dataJobLog.name,
				jobChainID: dataJobLog.jobChainID,
				info: dataJobLog.info
			}));
		})
	}

	static Get(ID, userID, done){
		DBJobLog.Get(ID, userID, function(err, dataJobLog){
			if (err) return done(err, null);
			if (!dataJobLog) return done(null, null);
			return done(null, new JobMeta({
				data: dataJobLog,
				ID: dataJobLog._id,
				userID: dataJobLog.userID,
				type: dataJobLog.type,
				date: dataJobLog.date,
				cat: dataJobLog.cat,
				name: dataJobLog.name,
				jobChainID: dataJobLog.jobChainID,
				info: dataJobLog.info
			}));
		})
	}

	static GetAll(userID, done){
		DBJobLog.GetAll(userID, function(err, dataJobLogs){
			if (err) return done(err, null);
			if (!dataJobLog) return done(null, null);
			var results = [];
			dataJobLogs.forEach(function(jobLog){
				results.push(new JobMeta({
					data: dataJobLog,
					ID: dataJobLog._id,
					userID: dataJobLog.userID,
					type: dataJobLog.type,
					date: dataJobLog.date,
					cat: dataJobLog.cat,
					name: dataJobLog.name,
					jobChainID: dataJobLog.jobChainID,
					info: dataJobLog.info
				}));
			});
			return done(null, results);
		});
	}

	static Remove(ID, userID, done=null){
		DBJobLog.Remove(ID, userID, function(err, success){
			if (!done) return;
			if (err) return done(err, null);
			return done(null, success);
		});
	}

	static RemoveAll(userID, done=null){
		DBJobLog.RemoveAll(userID, function(err, success){
			if (!done) return;
			if (err) return done(err, null);
			return done(null, success);
		});
	}
}

module.exports = JobLog;