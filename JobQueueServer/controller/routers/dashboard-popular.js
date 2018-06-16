var router = require("express").Router();
var JobManager = require("../JobManager.js");
var JobChainShared = require("../JobChainShared.js");
var JobChain = require("../JobChain.js");
var User = require("../User.js");
var async = require("async");
var JobChainNode = require("../JobChainNode.js");

router.get("/", (req, res, next) => {
	res.locals.filter = { jobs: [] };
	JobManager.JobsFilter({
		sortBy: "popular"
	}, function(err, jobs){
		Object.keys(jobs).forEach(function(key){
			res.locals.filter.jobs.push({
				name: jobs[key].name,
				value: key
			})
		})
		res.render("dashboard/popular");
	})
})

// {success, viewmore, data: [{ID, icons: [String], name, description, quatityUsed, authorName}]}
router.get("/json", (req, res, next) => {
	var skip = parseInt(req.query.skip);
	var limit = parseInt(req.query.limit);
	var sortBy = req.query.sortBy ? req.query.sortBy : "popular";
	var search = req.query.search ? req.query.search : null;
	var job = req.query.job ? req.query.job : null;

	var query = {
		skip: skip,
		limit: limit+1,
		sortBy: sortBy
	}
	if (search) query.search = search;
	if (job) query.job = job;

	res.setHeader('Content-Type', 'application/json');
	JobChainShared.Filter(query, function(err, jobChainShareds){
		if (err) return res.send(JSON.stringify({success: 0, data: [], viewmore: 1}));

		var viewmore = (jobChainShareds.length > limit) ? 1 : 0;
		jobChainShareds = jobChainShareds.slice(0, limit);

		function getJobChainShareInfo(jobChainShared, callback){
			var ID = jobChainShared.ID;
			var name = jobChainShared.name;
			var quatityUsed = jobChainShared.quantity_used;
			var description = jobChainShared.description;
			User.Get(jobChainShared.userID, function(err, user){
				if (err || !user) return callback(null, null);
				var authorName = user.basicInfo.fullname;
				// Get Jobs Name
				getParallel(jobChainShared.jobs, function(jobSlug, callback){
					JobManager.GetJob(jobSlug, function(err, job){
						if (err || !job) return callback(err, null);
						return callback(null, job.getIconUrl());
					})
				}, function(err, results){
					if (err || !results) return callback(null, null);
					var icons = results;
					return callback(null, {
						ID: ID,
						icons: icons,
						name: name,
						description: description,
						quatityUsed: quatityUsed,
						authorName: authorName,
					})
				})
			})
		}

		getParallel(jobChainShareds, getJobChainShareInfo, function(err, results){
			if (err) return res.send(JSON.stringify({success: 0, data: [], viewmore: 1}));
			return res.send(JSON.stringify({success: 1, data: results, viewmore: viewmore}));
		})
	})
});


router.post("/apply", (req, res, next) => {
	var ID = req.body.ID;
	var userID = req.user.ID;
	if (!ID) return fail();
	JobChainShared.Get(ID, function(err, jobChainShared){
		if (err || !jobChainShared) return fail();
		createJobChain(function(err, jobChainID){
			JobChainShared.IncreaseQuantityUsed(ID, function(){});
			if (err || !jobChainID) return fail();
			createJobChainNode(jobChainID, jobChainShared.JobChain, function(err, jobChainNodeID){
				if (err || !jobChainNodeID) return fail();
				JobChain.UpdateName(jobChainID, jobChainShared.name, function(err, success){
					if (err || !success) return fail();
					JobChain.UpdateNode(jobChainID, jobChainNodeID, function(err, success){
						if (err || !success) return fail();
						return fsuccess("/dashboard/jobchain/editor/"+jobChainID);
					}, userID)
				}, userID);
			})
		});
	})

	function createJobChainNode(jobChainID, jobChainNodeShared, done){
		fCreateJobChainNode(jobChainNodeShared, function(err, jobChainNodeID){
			return done(err, jobChainNodeID);
		})
		// done(err, jobChainNodeID);
		function fCreateJobChainNode(jobChainNodeShared, done){
			if (!jobChainNodeShared) return done(null, null);
			var fParallel = {};
			if (jobChainNodeShared.nexts){
				Object.keys(jobChainNodeShared.nexts).forEach(function(key){
					var next = jobChainNodeShared.nexts[key];
					fParallel[key] = (function(next, callback){
						fCreateJobChainNode(next, function(err, jobChainNodeID){
							callback(err, jobChainNodeID);
						})
					}).bind(null, next);
				})
			}
			async.parallel(fParallel, function(err, nexts){
				JobChainNode.Add({
					jobSlug: jobChainNodeShared.jobSlug,
					jobChainID: jobChainID,
					inputs: jobChainNodeShared.inputs,
					outputs: jobChainNodeShared.outputs,
					nexts: nexts
				}, function(err, jobChainNode){
					if (err || !jobChainNode) return done(null, null);
					return done(null, jobChainNode.ID);
				})
			});
		}
	}
	// create JobChain
	function createJobChain(done){
		JobChain.CreateBasic(req.user.ID, function(err, jobChainID){
			return done(err, jobChainID);
		});
	}

	function fsuccess (redirect){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1, redirect: redirect}));
	}
	function fail (){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 0, redirect: ""}));
	}
})

// doAction(item, callback(err, data))
function getParallel (items, doAction, done){
	var length = items.length;
	var parallelFunctions = {};
	items.forEach(function(item, index){
		parallelFunctions[index] = doAction.bind(null, item);
	})
	async.parallel(parallelFunctions, function(err, results){
		var data = [];
		if (err) return done(err, null);
		if (!results) return done(null, []);
		for(var i = 0; i < length; i++){
			if (results[i])
				data.push(results[i]);
		}
		done(null, data);
	})
}

router.get("/shared", (req, res, next) => {
	res.render("dashboard/popular-shared");
})

// {success, viewmore, data: [{ID, icons: [String], name, description, quatityUsed, authorName}]}
router.get("/shared/json", (req, res, next) => {
	var skip = parseInt(req.query.skip);
	var limit = parseInt(req.query.limit);
	var search = req.query.search ? req.query.search : null;
	var userID = req.user.ID;

	var query = {
		skip: skip,
		limit: limit+1,
		userID: userID,
		sortBy: 'latest'
	}
	if (search) query.search = search;

	res.setHeader('Content-Type', 'application/json');
	JobChainShared.Filter(query, function(err, jobChainShareds){
		if (err) return res.send(JSON.stringify({success: 0, data: [], viewmore: 1}));

		var viewmore = (jobChainShareds.length > limit) ? 1 : 0;
		jobChainShareds = jobChainShareds.slice(0, limit);

		function getJobChainShareInfo(jobChainShared, callback){
			var ID = jobChainShared.ID;
			var name = jobChainShared.name;
			var quatityUsed = jobChainShared.quantity_used;
			var description = jobChainShared.description;
			User.Get(jobChainShared.userID, function(err, user){
				if (err || !user) return callback(null, null);
				var authorName = user.basicInfo.fullname;
				// Get Jobs Name
				getParallel(jobChainShared.jobs, function(jobSlug, callback){
					JobManager.GetJob(jobSlug, function(err, job){
						if (err || !job) return callback(err, null);
						return callback(null, job.getIconUrl());
					})
				}, function(err, results){
					if (err || !results) return callback(null, null);
					var icons = results;
					return callback(null, {
						ID: ID,
						icons: icons,
						name: name,
						description: description,
						quatityUsed: quatityUsed,
						authorName: authorName,
					})
				})
			})
		}

		getParallel(jobChainShareds, getJobChainShareInfo, function(err, results){
			if (err) return res.send(JSON.stringify({success: 0, data: [], viewmore: 1}));
			return res.send(JSON.stringify({success: 1, data: results, viewmore: viewmore}));
		})
	})
});

router.delete("/:jobChainSharedID", (req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	var jobChainSharedID = req.params.jobChainSharedID;
	var userID = req.user.ID;
	JobChainShared.Remove(jobChainSharedID, function(err, success){
		success = !err && success ? 1 : 0;
		return res.send(JSON.stringify({success: success}));
	}, userID);
})

router.get("/:jobChainSharedID", (req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	var jobChainSharedID = req.params.jobChainSharedID;
	var userID = req.user.ID;
	JobChainShared.Get(jobChainSharedID, function(err, jobChainShared){
		if (err || !jobChainShared) return res.send(JSON.stringify({success: 0}));
		var name = jobChainShared.name;
		var description = jobChainShared.description;
		return res.send(JSON.stringify({success: 1, data: {name: name, description: description}}));
	})
})

router.post("/:jobChainSharedID", (req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	var jobChainSharedID = req.params.jobChainSharedID;
	var userID = req.user.ID;
	var name = req.body.name;
	var description = req.body.description;

	JobChainShared.Update(jobChainSharedID, {
		name: name,
		description: description
	}, function(err, success){
		success = !err && success ? 1 : 0;
		return res.send(JSON.stringify({success: success}));
	}, userID);
})

router.get("*", (req, res, next) => {
	res.redirect("/dashboard/popular");
})
module.exports = router;