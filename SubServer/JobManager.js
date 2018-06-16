var fs = require("fs");
var jobsPath = "./jobs";
var jobs = {};

class JobManager{
	// Load tất cả jobs vào biến jobs
	// done(err, null): nếu lỗi
	// done(null, jobs): Trả về jobs nếu thành công
	static LoadJobs(done=null){
		fs.readdir(jobsPath, (err, files) => {
			if (err) return done(err, null);
			files.forEach(function(jobClassName){
				var JobClass = require('./jobs/' + jobClassName + '/index.js');
				var job = new JobClass({});
				job.update({slug: jobClassName});
				job.createTmpPath();
				console.log("Loaded job: " + jobClassName);
				jobs[jobClassName] = job;
			});
			done (null, jobs);
		});
	}
	static GetJob(slug, done){
		var job = (jobs[slug]) ? jobs[slug].clone() : null;
		done(null, job);
	}
	// Lấy job theo filters
	// filters { type, category }
	// done (err, data)
	static JobsFilter(filters, done){
		var results = {}
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			if ((!filters.type || filters.type==job.type) && (!filters.category || job.categoriesSlug.indexOf(filters.category) != -1))
				results[key] = job.clone();
		});
		done(null, results);
	}
}
module.exports = JobManager;