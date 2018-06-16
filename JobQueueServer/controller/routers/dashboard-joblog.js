var router = require("express").Router();
var JobLog = require("../JobLog.js");

router.get("/", (req, res, next) => {
	var jobChainID = req.query.jobChainID;
	var type = req.query.type ? req.query.type : "*";
	if (jobChainID) res.locals.title = "Job Log : " + jobChainID;
	else res.locals.title = "Job Log";
	res.locals.jobChainID = jobChainID;
	res.locals.type = type;
	res.render("dashboard/joblog");
})

router.get("/json", (req, res, next) => {
	var type = req.query.type ? req.query.type : null;
	var dateend = req.query.dateend ? req.query.dateend : null;
	var datestart = req.query.datestart ? req.query.datestart : null;
	var userID = req.user.ID;
	var jobChainID = req.query.jobChainID ? req.query.jobChainID : null;
	var skip = req.query.skip ? parseInt(req.query.skip) : null;
	var limit = req.query.limit ? parseInt(req.query.limit) : null;

	JobLog.Filter({
		type: type,
		dateend: dateend,
		datestart: datestart,
		userID: userID,
		jobChainID: jobChainID,
		skip: skip,
		limit: limit+1,
		
	}, function(err, jobLogs){
		if (err || !jobLogs){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({success: 0, data: [], continue: 1}));
		}
		var results = [];
		var length = Math.min(jobLogs.length, limit);
		for(var i = 0; i < length; i++){
			var jobLog = jobLogs[i];
			var date = jobLog.date;
			date = ("00" + date.getDate()).slice(-2) + "/" + ("00" + (1+date.getMonth())).slice(-2) + "/" + ("0000" + (1900+date.getYear())).slice(-4)
			results.push({
				ID: jobLog.ID,
				name: jobLog.name,
				info: jobLog.info,
				type: jobLog.type,
				date: date
			});
		}
		var isContinue = jobLogs.length > limit;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1, data: results, continue: isContinue}));
	})
})

router.delete("/json", (req, res, next) => {
	var ids = req.body.ids;
	JobLog.Remove(ids, req.user.ID, function(err, success){
		var success = (!err && success) ? 1 : 0;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: success}));
	})
})


router.get("*", (req, res, next) => {
	res.redirect("/dashboard/job-log");
})
module.exports = router;