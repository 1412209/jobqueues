var router = require("express").Router();
var JobChain = require("../JobChain.js");
var JobChainNode = require("../JobChainNode.js")
var JobManager = require("../JobManager.js")
var async = require("async");

router.get("/", (req, res, next) => {
	res.render("dashboard/jobchain");
})

var dashboard_jobchain_editor = require("./dashboard-jobchain-editor.js");
router.use("/editor", dashboard_jobchain_editor)

router.get("*", (req, res, next) => {
	res.redirect("/dashboard/jobchain")
})
module.exports = router;