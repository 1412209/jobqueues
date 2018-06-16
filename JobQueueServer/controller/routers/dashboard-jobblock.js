var router = require("express").Router();
var Category = require("../Category.js");
var JobManager = require("../JobManager.js");
var JobMeta = require("../JobMeta.js");
var AccountPermission = require("../AccountPermission.js");
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
		res.render("dashboard/job-block");
	});
});

// output = [{jobSlug, name, icon, accountLink, strCategories, quantityAccount, excerpts, moreinfo, featured: 0|1}]
router.get("/jobs-featured", (req, res, next) => {
	var categorySlug = req.query.categorySlug ? req.query.categorySlug : null;
	var type = req.query.type ? req.query.type : null;
	var search = req.query.search ? req.query.search : "";
	JobManager.JobsFilter({
		categorySlug: categorySlug,
		type: type,
		search: search,
		featured: req.user.ID,
		sortBy: "popular"
	}, function(err, jobs){
		if (err || !jobs){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify([]));
			return;
		}
		getInfosJobsBlock(jobs, req.user.ID, function(err, result){
			if (err || !result){
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify([]));
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(result));
			}
		})
	})
});

router.get("/jobs", (req, res, next) => {
	var categorySlug = req.query.categorySlug ? req.query.categorySlug : null;
	var type = req.query.type ? req.query.type : null;
	var search = req.query.search ? req.query.search : "";

	JobManager.JobsFilter({
		categorySlug: categorySlug,
		type: type,
		search: search,
		sortBy: "popular"
	}, function(err, jobs){
		if (err || !jobs){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify([]));
			return;
		}
		getInfosJobsBlock(jobs, req.user.ID, function(err, result){
			if (err || !result){
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify([]));
			} else {
				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify(result));
			}
		})
		
	})
});

function getInfosJobsBlock(jobs, userID, done){
	var categoriesFunction = {};
	var quantityAccountFunction = {};
	var featuredFunction = {};
	Object.keys(jobs).forEach(function(key){
		var job = jobs[key];
		categoriesFunction[key] = (function(job, callback){
			Category.GetAll(function(err, categories){
				if (err || !categories) return callback(null, []);
				var result = [];
				job.categoriesSlug = job.categoriesSlug ? job.categoriesSlug : [];
				job.categoriesSlug.forEach(function(categorySlug){
					var category = categories.find(function(category){
						return category.slug == categorySlug;
					});
					if (category) result.push(category);
				})
				return callback(null, result);
			})
		}).bind(null,job);

		quantityAccountFunction[key] = (function(job, callback){
			AccountPermission.GetByJobAndUser(job.slug, userID, function(err, accounts){
				if (err || !accounts) return callback(null, 0);
				return callback(null, accounts.length);
			})
		}).bind(null, job);

		featuredFunction[key] = (function(job, callback){
			JobMeta.GetOne({
				slug: job.slug,
				key: "featured",
				value: userID
			}, function(err, jobMeta){
				if (err || !jobMeta) return callback(null, 0);
				return callback(null, 1);
			})
		}).bind(null, job)
	});

	async.parallel({
		categories: function(callback){
			async.parallel(categoriesFunction, function(err, results){
				return callback(null, results);
			})
		},
		quantityAccounts: function(callback){
			async.parallel(quantityAccountFunction, function(err, results){
				return callback(null, results);
			})
		},
		featureds: function(callback){
			async.parallel(featuredFunction, function(err, results){
				return callback(null, results);
			})
		}
	}, function(err, results){
		if (err || !results) return done(err, [])
		var categories = results.categories;
		var quantityAccounts = results.quantityAccounts;
		var featureds = results.featureds;
		var result = [];
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			var jobSlug = job.slug;
			var name = job.name;
			var icon = job.getIconUrl();
			var accountLink = "https://jobqueues.info/dashboard/my-accounts?jobSlug=" + jobSlug;
			var strCategories = "";
			var i = 0;
			categories[key].forEach(function(category){
				if (++i == categories[key].length)
					strCategories += category.name;
				else strCategories += category.name + ", ";
			});
			var quantityAccount = quantityAccounts[key];
			var excerpts = (job.excerpts) ? job.excerpts : "";
			var featured = featureds[key];
			result.push({
				jobSlug: jobSlug,
				name: name,
				icon: icon,
				accountLink: accountLink,
				strCategories: strCategories,
				quantityAccount: quantityAccount,
				excerpts: excerpts,
				featured: featured
			})
		});
		return done(null, result);
	})
}

router.post("/featured", (req, res, next) => {
	var jobSlug = req.body.jobSlug;
	var featured = req.body.featured;
	if (featured == 0){
		JobMeta.Delete({
			slug: jobSlug,
			key: "featured",
			value: req.user.ID
		}, function(err, success){
			var success = !err && success ? 1 : 0;
			send(success);
		});
	} else {
		JobMeta.GetOne({
			slug: jobSlug,
			key: "featured",
			value: req.user.ID
		}, function(err, jobMeta){
			if (err) {
				send(0);
			} else if (jobMeta){
				send(1);
			} else {
				JobMeta.Insert(jobSlug, "featured", req.user.ID, function(err, jobMeta){
					if (err || !jobMeta) return send(0);
					return send(1)
				});
			}
		})
	}
	function send(success){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: success}));
	}
})

module.exports = router;