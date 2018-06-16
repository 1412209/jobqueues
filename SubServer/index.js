const KafakMananager = require("./KafkaManager.js")
const JobManager = require("./JobManager.js");
const async = require("async");
const format = require("string-template");
const DB = require("./models/DB.js");

DB.Init(function(){
	JobManager.LoadJobs(function(err, data){
		if (err || !data) return;
		KafakMananager.Init(function(){
			// jobInfo (jobChainNodeID, jobChainID, userID, slug, authentications, inputs, nexts)
			KafakMananager.ListenExec(function(err, jobInfo){
				if (!jobInfo || !jobInfo.slug) return;
				console.log("<-- Listened JobChain: " + jobInfo.jobChainID);
				try{
					execJob(jobInfo);
				} catch(err){
					console.log("XXX Error execute: " + err);
				}

				function execJob(jobInfo, oldOutput={}, level=0){
					var jobChainNodeID = jobInfo.jobChainNodeID;
					var slug = jobInfo.slug;
					var prefix = jobInfo.prefix;
					var dataFields = jobInfo.dataFields;
					var authentications = jobInfo.authentications;
					var inputs = jobInfo.inputs;
					var userID = jobInfo.userID;
					var nexts = jobInfo.nexts;
					JobManager.GetJob(slug, function(err, job){
						if (err || !job) return; 
						job.update({
							jobChainNodeID: jobChainNodeID,
							authentications: authentications,
							inputs: inputs,
							prefix: prefix,
							dataFields: dataFields,
							userID: userID,
							level: level
						});
						// Outputs { next: {}, prev: {} }
						job.execAfterHook(function(err, outputs){
							console.log("--> Executed Job ("+jobInfo.slug+") in node ("+jobInfo.jobChainNodeID+")");
							if (!outputs) return;
							Object.keys(nexts).forEach(function(key){
								if (!nexts[key]) return;
								var next = nexts[key];
								var output = outputs[key];
								if (!output) return;
								var newOutput = mergeObject(output, oldOutput);
								if (next.inputs)
									next.inputs = formatTemplate(next.inputs, newOutput);
								try{
									execJob(next, newOutput, ++level);
								} catch(err){
									require("./JobLog.js").Add({
										type: "error",
										name: next.slug,
										jobChainNodeID: jobChainNodeID,
										info: jobChainNodeID + " - " + "Error execute",
										userID: userID,
										cat: "Exec Log"
									})
									console.log("XXX Error init: " + err);
								}
							});
						})
					})
				}
			});
			KafakMananager.ListenInit(function(err, jobInfo){
				if (!jobInfo || !jobInfo.slug) return;
				console.log("<-- Init JobChain: " + jobInfo.jobChainID);
				try{
					initJob(jobInfo)
				} catch(err){
					console.log("XXX Error init: " + err);
				}

				function initJob(jobInfo, oldOutput={}){
					var jobChainNodeID = jobInfo.jobChainNodeID;
					var slug = jobInfo.slug;
					var prefix = jobInfo.prefix;
					var dataFields = jobInfo.dataFields;
					var authentications = jobInfo.authentications;
					var inputs = jobInfo.inputs;
					var nexts = jobInfo.nexts;
					JobManager.GetJob(slug, function(err, job){
						if (err || !job) return; 
						job.update({
							jobChainNodeID: jobChainNodeID,
							dataFields: dataFields,
							authentications: authentications,
							inputs: inputs,
							prefix: prefix
						});
						// Outputs { next: {}, prev: {} }
						job.init(function(err, outputs){
							console.log("--> Init Job ("+jobInfo.slug+") in node ("+jobInfo.jobChainNodeID+")");
							Object.keys(nexts).forEach(function(key){
								if (!nexts[key]) return;
								var next = nexts[key];
								var output = (outputs && outputs[key]) ? outputs[key] : {};
								// if (!output) return;
								var newOutput = mergeObject(output, oldOutput);
								if (next.inputs)
									next.inputs = formatTemplate(next.inputs, newOutput);
								try{
									initJob(next, newOutput);
								} catch(err){
									console.log("XXX Error init: " + err);
								}
							});
						})
					})
				}
			});
		});
	})
});


// Bổ sung các thuộc tính objectMerger nếu không trùng
function mergeObject(objectSource, objectMerger){
	var newObject = {};
	Object.keys(objectMerger).forEach(function(key){
		newObject[key] = objectMerger[key];
	})
	Object.keys(objectSource).forEach(function(key){
		newObject[key] = objectSource[key];
	})
	return newObject;
}
function formatTemplate(object, formatMask){
	if (typeof object == 'string') return format(object,formatMask);

	var isObject = function(a) {
		return (!!a) && (a.constructor === Object);
	};
	var isArray = function(a) {
		return (!!a) && (a.constructor === Array);
	};

	if (isArray(object)){
		var newArray = [];
		object.forEach(function(item){
			newArray.push(formatTemplate(item, formatMask));
		})
		return newArray;
	}
	else if (isObject(object)){
		var newObject = {};
		Object.keys(object).forEach(function(key){
			newObject[key] = formatTemplate(object[key], formatMask);
		})
		return newObject;
	}
	else return object;
}