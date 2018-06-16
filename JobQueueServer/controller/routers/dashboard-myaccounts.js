var router = require("express").Router();
var JobManager = require("../JobManager.js");
var Category = require("../Category.js");
var AccountPermission = require("../AccountPermission.js")
var async = require("async");

router.get("/", (req, res, next) => {
	res.locals.filter = res.locals.filter ? res.locals.filter : {};
	Category.GetAll(function(err, categories){
		if (!err && categories){
			var categoriesRender = [];
			categories.forEach(function(category){
				categoriesRender.push({
					slug: category.slug,
					name: category.name
				})
			})
			res.locals.filter.categories = categoriesRender;
		}
		res.render("dashboard/my-accounts");
	});
});
router.get("/jobs", (req, res, next) => {
	var categorySlug = req.query.categorySlug ? req.query.categorySlug : null;
	JobManager.GetJobHasAccount(function(err, jobs){
		if (err || !jobs) return fail;
		var result = {};
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			if (!categorySlug || (job.categoriesSlug && job.categoriesSlug.indexOf(categorySlug) != -1))
				result[key] = job.name;
		})
		success(result);
	})
	function success(data){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1, data: data}));
	}
	function fail(){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 0}));
	}
})
router.get("/accounts", (req, res, next) => {
	var categorySlug = req.query.categorySlug ? req.query.categorySlug : null;
	var jobSlug = req.query.jobSlug ? req.query.jobSlug : null;
	var search = req.query.search ? req.query.search : "";
	var skip = req.query.skip ? parseInt(req.query.skip) : 0;
	var limit = req.query.limit ? parseInt(req.query.limit) : 0;
	var jobSlugs = [];

	if (jobSlug == null){
		JobManager.GetJobHasAccount(function(err, jobs){
			if (err || !jobs) return fail;
			Object.keys(jobs).forEach(function(key){
				var job = jobs[key];
				if (!categorySlug || (job.categoriesSlug && job.categoriesSlug.indexOf(categorySlug) != -1))
					jobSlugs.push(key)
			})
			getAccounts();
		})
	} else {
		jobSlugs = [jobSlug];
		getAccounts();
	}
	function getAccounts() {
		AccountPermission.FilterByJobsAndSearch({
			search: search,
			jobSlugs: jobSlugs,
			skip: skip,
			limit: limit
		}, req.user.ID, function(err, accounts){
			var fGetAccountsInfo = [];
			accounts.forEach(function(account){
				fGetAccountsInfo.push((function(account, callback){
					var publicDate = account.publicDate;
					publicDate = ("00" + publicDate.getDate()).slice(-2) + "/" + ("00" + (1+publicDate.getMonth())).slice(-2) + "/" + ("0000" + (1900+publicDate.getYear())).slice(-4)
					var accountInfos = {
						ID: account.ID,
						name: account.basicInfos.name,
						identity: account.basicInfos.identity,
						publicDate: publicDate
					}
					JobManager.GetJob(account.jobSlug, function(err, job){
						if (err || !job) return callback(null, null);
						accountInfos.icon = job.getIconUrl();
						callback(null, accountInfos);
					})
				}).bind(this, account));
			})
			async.parallel(fGetAccountsInfo, function(err, accountsInfos){
				while(accountsInfos.indexOf(null) != -1){
					accountsInfos.splice(accountsInfos.indexOf(null), 1);
				}
				success(accountsInfos);
			})
		})
	}
	function success(data){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1, data: data}));
	}
	function fail(){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 0}));
	}
})

router.put("/account/name", (req, res, next) => {
	var accountID = req.body.accountID;
	var name = req.body.name;
	AccountPermission.UpdateName(name, accountID, function(err, success){
		var success = (!err && success) ? 1 : 0;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: success}));
	}, req.user.ID)
});

router.delete("/account", (req, res, next) => {
	var accountID = req.body.accountID;
	AccountPermission.Remove(accountID, function(err, success){
		var success = (!err && success) ? 1 : 0;
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: success}));
	}, req.user.ID)
});

router.get("/jobs-of-add-acount", (req, res, next) => {
	var categorySlug = req.query.categorySlug ? req.query.categorySlug : null;
	JobManager.GetJobHasAccount(function(err, jobs){
		if (err || !jobs) return fail;
		var result = [];
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			if (!categorySlug || (job.categoriesSlug && job.categoriesSlug.indexOf(categorySlug) != -1)){
				result.push({
					name: job.name,
					icon: job.getIconUrl(),
					authUrl: job.getAuthUrl("https://jobqueues.info/dashboard/my-accounts")
				});

			}
		})
		success(result);
	})
	function success(data){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1, data: data}));
	}
	function fail(){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 0}));
	}
})


router.get("*", (req, res, next) => {
	res.redirect("/dashboard/my-account")
})
module.exports = router;