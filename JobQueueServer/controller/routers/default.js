var router = require("express").Router();

// Router các hình ảnh trong job chain
router.get("/job/icon/:jobSlug", (req, res, next) => {
	var JobModulesManager = require("../JobManager.js");
	var fs = require('fs');

	var jobSlug = req.params.jobSlug;
	JobModulesManager.GetJob(jobSlug, function(err, job){
		if (!job) return res.status(404);
		var icon = job.getIconPath();
		var buf = fs.readFileSync(icon);
		res.writeHead(200, {'Content-Type': 'image/png'});
		res.write(buf);
		res.end();
	});
})

router.get('/', (req, res, next) => {
	res.redirect("/dashboard")
});

router.get('/404', (req, res, next) => {
	res.status(404);
	res.send('Error page');
});
router.get('*', (req, res, next) => {
	res.status(404);
	res.send('Error page');
});

module.exports = router;