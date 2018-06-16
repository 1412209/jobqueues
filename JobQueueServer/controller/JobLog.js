var DBJobLog = require("../models/JobLog.js");

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
			return done(null, new JobLog({
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
			return done(null, new JobLog({
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
			if (!dataJobLogs) return done(null, null);
			var results = [];
			dataJobLogs.forEach(function(dataJobLog){
				results.push(new JobLog({
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

	static Remove(ids, userID, done=null){
		DBJobLog.Remove(ids, userID, function(err, success){
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

	// query { userID, jobChainID, type, datestart, dateend, skip, limit  }
	static Filter(query, done){
		if (query.datestart) query.datestart = parseDate(query.datestart);
		if (query.dateend) query.dateend = parseDate(query.dateend);

		DBJobLog.Filter(query, function(err, dataJobLogs){
			if (err) return done(err, null);
			if (!dataJobLogs) return done(null, null);
			var results = [];
			dataJobLogs.forEach(function(dataJobLog){
				results.push(new JobLog({
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

		function parseDate(date){
			var year = ("0000"+date.year).slice(-4);
			var month = ("00"+date.month).slice(-2);
			var day = ("00"+date.day).slice(-2);
			var hour = ("00"+date.hour).slice(-2);
			var minute = ("00"+date.minute).slice(-2);
			return new Date(year + "-" + month + "-" + day + "T" + hour + ":" + minute);
		}
	}

	// query { jobChainID, type, userID }
	// done (err, count)
	static GetCount(query, done){
		DBJobLog.GetCount(query, done);
	}
}

module.exports = JobLog;