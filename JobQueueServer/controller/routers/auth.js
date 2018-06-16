var router = require("express").Router();
//		/dashboard/auth/*

var AccountPermission = require("../AccountPermission.js");
var JobManager = require("../JobManager.js");

router.get("/add/:jobSlug", (req, res, next) => {
	var jobSlug = req.params.jobSlug;
	JobManager.GetJob(jobSlug, function(err, job){
		job.getAuthInfos(req, function(err, callbackUrl, authInfos){
			callbackUrl = (callbackUrl) ? callbackUrl : "/dashboard";
			if(err || !authInfos) return done(callbackUrl);
			if (authInfos.authentications && authInfos.authenticationID)
				authInfos.authentications.id = authInfos.authenticationID;
			else if(!authInfos.authentications && authInfos.authenticationID)
				authInfos.authentications = { id: authInfos.authenticationID }

			AccountPermission.Add({
				jobSlug: jobSlug,
				userID: req.user.ID,
				authentications: authInfos.authentications,
				basicInfos: {
					name: authInfos.name,
					identity: authInfos.indentity
				}
			}, function(err, account){
				return done(callbackUrl);
			});
		});
	});
	function done(callbackUrl){
		// res.redirect(callbackUrl);
		res.send("<script>window.close();</script>");
	}
})

module.exports = router;