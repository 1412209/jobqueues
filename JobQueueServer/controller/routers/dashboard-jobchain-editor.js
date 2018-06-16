var router = require("express").Router();
var JobManager = require("../JobManager.js");
var Category = require("../Category.js");
var JobChain = require("../JobChain.js");
var JobLog = require("../JobLog.js");

router.get("/", (req, res, next) => {
	JobChain.CreateBasic(req.user.ID, function(err, jobChainID){
		if (err || !jobChainID) return res.send("Error");
		return res.redirect("/dashboard/jobchain/editor/"+jobChainID);
	})
});

router.get("/:jobChainID", (req, res, next) => {
	var jobChainID = req.params.jobChainID;
	
	JobChain.HasJobChain(jobChainID, function(err, hasJobChain){
		if (err || !hasJobChain) return res.redirect("/dashboard/jobchain");
		res.locals.content = (res.locals.content) ? res.locals.content : {};
		res.locals.content.jobChainID = jobChainID;
		res.locals.content.categories = [];
		JobChain.GetData(jobChainID, function(err, data){
			var status = data.status;
			var name = data.name;
			res.locals.content.status = status == 1;
			res.locals.content.name = (name) ? name : "";
			Category.GetAll(function(err, categories){
				if (!err && categories){
					categories.forEach(function(category){
						res.locals.content.categories.push({
							slug: category.slug,
							name: category.name
						})
					})
				}
				JobLog.GetCount({
					userID: req.user.ID,
					jobChainID: jobChainID,
					type: "error"
				}, function(err, countErrors){
					if (err) countErrors = 0;
					JobLog.GetCount({
						userID: req.user.ID,
						jobChainID: jobChainID,
						type: "info"
					}, function(err, countInfos){
						if (err) countInfos = 0;
						res.locals.content.countErrors = countErrors;
						res.locals.content.countInfos = countInfos;
						res.render("dashboard/jobchain-editor");
					})
				})
			})
		}, req.user.ID);
	}, req.user.ID);
});


module.exports = router;