var router = require("express").Router();

router.get("/", resHeader, (req, res, next) => {
	res.render("dashboard/index");
})

var dashboard_jobchain = require("./dashboard-jobchain.js");
router.use("/jobchain", resHeader, dashboard_jobchain)

var dashboard_popular = require("./dashboard-popular.js");
router.use("/popular", resHeader, dashboard_popular)

var dashboard_myaccounts = require("./dashboard-myaccounts.js");
router.use("/my-accounts", resHeader, dashboard_myaccounts)

var dashboard_jobblock = require("./dashboard-jobblock.js");
router.use("/job-block", resHeader, dashboard_jobblock)

var dashboard_joblog = require("./dashboard-joblog.js");
router.use("/job-log", resHeader, dashboard_joblog);

var dashboard_user = require("./dashboard-user.js");
router.use("/user", resHeader, dashboard_user);

function resHeader(req, res, next) {
	var user = req.user;
	res.locals.header = res.locals.header ? res.locals.header : {};
	res.locals.header.user = res.locals.header.user ? res.locals.header.user : {};
	var fullname = user.basicInfo.fullname;
	res.locals.header.user.fullname = user.basicInfo.fullname;
	res.locals.header.user.hasChangePassword = user.loginInfo.loginType == "localLogin";
	next();
}

router.get("*", (req, res, next) => {
	res.redirect("/dashboard")
})
module.exports = router;