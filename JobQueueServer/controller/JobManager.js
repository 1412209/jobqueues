var fs = require("fs");
var jobsPath = "./controller/jobs";
var jobs = {};
var JobMeta = require("./JobMeta.js");
class JobModulesManager{
	// Load tất cả jobs vào biến jobs
	// done(err, null): nếu lỗi
	// done(null, jobs): Trả về jobs nếu thành công
	static LoadJobs(done=null){
		fs.readdir(jobsPath, (err, files) => {
			if (err) return done(err, null);
			var jobsTmp = {};
			var sortName = [];
			files.forEach(function(jobClassName){
				var JobClass = require('./jobs/' + jobClassName + '/index.js');
				var job = new JobClass({});
				job.setSlug(jobClassName);
				job.loadBasicInfos();
				sortName.push(jobClassName);
				jobsTmp[jobClassName] = job;
			});
			for(var i = 0; i < sortName.length-1; i++)
				for(var j = i+1; j < sortName.length; j++)
					if (change_alias(jobsTmp[sortName[i]].name) > change_alias(jobsTmp[sortName[j]].name)){
						var tmp = sortName[i];
						sortName[i] = sortName[j];
						sortName[j] = tmp;
					}
			sortName.forEach(function(name){
				jobs[name] = jobsTmp[name];
			})
			done (null, jobs);
		});
		function change_alias(alias) {
			var str = alias;
			str = str.toLowerCase();
			str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
			str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
			str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
			str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
			str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
			str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
			str = str.replace(/đ/g,"d");
			str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
			str = str.replace(/ + /g," ");
			str = str.trim(); 
			return str;
		}
	}
	static GetJob(slug, done){
		var job = (jobs[slug]) ? jobs[slug].clone() : null;
		done(null, job);
	}
	// Lấy job theo filters
	// filters { type, categorySlug, search, featured: userID, sortBy: popular | name }
	// done (err, data)
	static JobsFilter(filters, done){
		var jobsFilterBisic = {};
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			if ((!filters.type || filters.type == job.type)
				&& (!filters.categorySlug || (job.categoriesSlug && job.categoriesSlug.includes(filters.categorySlug)))
				&& (!filters.search || (job.name && job.name.toLowerCase().includes(filters.search.toLowerCase()))))
				jobsFilterBisic[key] = job.clone();
		})

		if (!filters.featured){
			return sortJobs(jobsFilterBisic);
		}

		JobMeta.Get({
			key: "featured",
			value: filters.featured
		}, function(err, jobMetas){
			if (err) return done(err, null);
			var jobsTmp = {};
			if (jobMetas)
				jobMetas.forEach(function(jobMeta){
					if (jobsFilterBisic[jobMeta.slug])
						jobsTmp[jobMeta.slug] = jobsFilterBisic[jobMeta.slug];
				})
			return sortJobs(jobsTmp);
		});

		function sortJobs(jobs){
			if (!filters.sortBy || filters.sortBy == "name")
				sortJobsByName(jobs);
			else sortJobsByPopular(jobs);
		}

		function sortJobsByName(jobs){
			var results = {};

			var sortable = [];
			for (var vehicle in jobs) {
				sortable.push([vehicle, jobs[vehicle]]);
			}

			sortable.sort(function(a, b) {
				return change_alias(a[1].name) > change_alias(b[1].name);
			});

			sortable.forEach(function(item){
				results[item[0]] = item[1];
			});

			return done(null, results);


			function change_alias(alias) {
				var str = alias;
				str = str.toLowerCase();
				str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g,"a"); 
				str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g,"e"); 
				str = str.replace(/ì|í|ị|ỉ|ĩ/g,"i"); 
				str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g,"o"); 
				str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g,"u"); 
				str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g,"y"); 
				str = str.replace(/đ/g,"d");
				str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g," ");
				str = str.replace(/ + /g," ");
				str = str.trim(); 
				return str;
			}
		}

		function sortJobsByPopular(jobs){
			var results = {};
			JobMeta.Get({
				$query: {
					key: "quantity_used"
				},
				$orderby: {
					value: -1
				}
			}, function(err, metaJobs){
				if(err) return done(err, null);
				if (!metaJobs) metaJobs = [];
				metaJobs.forEach(function(metaJob){
					if (jobs[metaJob.slug])
						results[metaJob.slug] = jobs[metaJob.slug];
				});
				Object.keys(jobs).forEach(function(key){
					if (!results[key])
						results[key] = jobs[key];
				})
				return done(null, results);
			});
		}
		
	}
	static GetIconUrl(slug){
		if (jobs[slug])
			return jobs[slug].getIconUrl();
		else return null;
	}
	static GetJobHasAccount(done){
		var result = {};
		Object.keys(jobs).forEach(function(key){
			if (jobs[key].hasAccount)
				result[key] = jobs[key];
		});
		done(null,result);
	}
}
module.exports = JobModulesManager;