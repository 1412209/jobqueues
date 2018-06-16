var DBJobChain = require('../models/JobChain.js');
var JobManager = require("./JobManager.js");
var KafkaController = require("./KafkaController.js")
var JobChainNode = require("./JobChainNode.js");
var async = require("async");
const minIntervalTime = 10000;
const IntervalExec = require("./IntervalExec.js");
var JobLog = require("./JobLog.js");

class JobChain {
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.jobChainNode = infos.jobChainNode;
		this.name = infos.name;
		this.userID = infos.userID;
		this.status = (infos.status) ? infos.status : 0;
		this.publicDate = infos.publicDate;
	}
	start(done=null){
		var thisObj = this;
		JobChain.UpdateStatus(this.ID, 1, function(err, success){
			if (err && done) return done(err, false);
			if (err) return;
			if (!success && done) return done(null, false);
			if (!success) return;

			if (thisObj.jobChainNode && thisObj.jobChainNode.job){
				var jobChainNode = thisObj.jobChainNode;
				var job = jobChainNode.job;


				// Lấy giá trị intervalTime
				var intervalTime = 0;
				if (job.slug == "Schedule")
					intervalTime = 1 * 60 * 60 * 1000;
				if (jobChainNode.options && jobChainNode.options.intervalSeconds)
					intervalTime = Math.max(jobChainNode.options.intervalSeconds * 1000, intervalTime);
				intervalTime = Math.max(minIntervalTime, intervalTime);
				if (job.minIntervalTime)
					intervalTime = Math.max(job.minIntervalTime, intervalTime);

				var schedule = {
					type: "repeat_seconds",
					"repeat_seconds": { seconds: intervalTime / 1000 }
				};
				
				if (jobChainNode.options && jobChainNode.options.schedule)
					schedule = jobChainNode.options.schedule;

				if (schedule.type == "repeat_hours"){
					var hours = parseFloat(schedule.repeat_hours.hours);
					intervalTime = Math.max(hours * 60 * 60 * 1000, intervalTime);
					schedule = {
						type: "repeat_seconds",
						"repeat_seconds": { seconds: intervalTime / 1000 }
					};
				}
				
				if (schedule.repeat_seconds && schedule.repeat_seconds.seconds){
					schedule.repeat_seconds.seconds = parseInt(schedule.repeat_seconds.seconds) * 1000;
					schedule.repeat_seconds.seconds = Math.max(schedule.repeat_seconds.seconds, minIntervalTime)
					if (job.minIntervalTime)
						schedule.repeat_seconds.seconds = Math.max(schedule.repeat_seconds.seconds, job.minIntervalTime)
				}
				else {
					schedule.repeat_seconds = { seconds: Math.max(minIntervalTime, job.minIntervalTime) }
				}
				schedule.repeat_seconds.seconds = schedule.repeat_seconds.seconds / 1000;

				thisObj.beforeStart();
				IntervalExec.Add(thisObj, schedule);
				console.log("Start JobChain: " + thisObj.ID);
				if(done)done(null, true);
			}
			else if(done)done(null, false);
		}, this.userID);
	}
	stop(done=null){
		var thisObj = this;
		var jobChainNode = thisObj.jobChainNode;
		JobChain.GetStatus(thisObj.ID, function(err, status){
			if (status == 0)
				return done(null, true);
			JobChain.UpdateStatus(thisObj.ID, 0, function(err, success){
				if (err && done) return done(err, false);
				if (err) return;
				if (!success && done) return done(null, false);
				if (!success) return;

				console.log("Stop JobChain: " + thisObj.ID);
				IntervalExec.Remove(thisObj.ID);
				if (jobChainNode && jobChainNode.ID)
					JobChainNode.RemoveTmp(jobChainNode.ID);
				if(done)done(null, true);
			}, thisObj.userID);
		})		
	}
	// done(err, success)
	exec(done=null){
		var thisObj = this;
		if (!this.jobChainNode)
			if (done) return done(null, false);
			else return;
		var infos = this.getJobChainNodeInfo(this.jobChainNode);
		KafkaController.SendSubServerExec(infos, function(err, success){
			if (success) console.log("Requested Execute JobChain: " + thisObj.ID);
			if (done) done(err, success);
		})
	}
	beforeStart(done=null){
		var thisObj = this;
		if (!this.jobChainNode)
			if (done) return done(null, false);
			else return;
		var infos = this.getJobChainNodeInfo(this.jobChainNode, false);
		KafkaController.SendSubServerInit(infos, function(err, success){
			if (done) done(err, success);
		})
	}
	getJobChainNodeInfo(jobChainNode, isFilter=true){
		var thisObj = this;
		var slug = jobChainNode.job.slug;
		var authentications = (jobChainNode.account) ? jobChainNode.account.authentications : null;
		var hasAccount = jobChainNode.job && jobChainNode.job.hasAccount;
		var inputs = jobChainNode.inputs;
		var prefix = (jobChainNode.options && jobChainNode.options.prefix) ? jobChainNode.options.prefix : "";
		var dataFields = (jobChainNode.options && jobChainNode.options.dataFields) ? jobChainNode.options.dataFields : [];
		var tmp = [];
		dataFields.forEach(function(field){ tmp.push(field.field_name); });
		dataFields = tmp;
		var nexts = {};
		var jobChainNodeID = jobChainNode.ID;
		if (jobChainNode.nexts)
			Object.keys(jobChainNode.nexts).forEach(function(key){
				var next = jobChainNode.nexts[key];
				if (!next) return;
				var nextInfo = thisObj.getJobChainNodeInfo(next, isFilter);
				if (nextInfo) nexts[key] = nextInfo;
			})

		if (isFilter && (!slug || (hasAccount && !authentications)))
			return null;
		return {
			slug: slug,
			prefix: prefix,
			dataFields: dataFields,
			authentications: authentications,
			inputs: inputs,
			jobChainNodeID: jobChainNodeID,
			nexts: nexts,
			userID: thisObj.userID,
			jobChainID: thisObj.ID
		}
	}
	// Lấy chuỗi các node tới node cần tìm.
	// Trả về [{node, key}, {node, key},...]
	getChainNode(jobChainNodeID){
		return getChainNodeLoop(this.jobChainNode, jobChainNodeID);
		function getChainNodeLoop(jobChainNodeRoot, jobChainNodeID){
			if (!jobChainNodeRoot) return null;
			var result = [jobChainNodeRoot];
			if (jobChainNodeRoot.ID == jobChainNodeID) return [{node: jobChainNodeRoot, key: null}];
			var nexts = jobChainNodeRoot.nexts;
			if (!nexts) return null;
			var child = null;
			var nodeKey = null;
			Object.keys(nexts).forEach(function(key){
				var next = nexts[key];
				var tmp = getChainNodeLoop(next, jobChainNodeID);
				if (tmp){
					child = tmp;
					nodeKey = key; 
				}
			});
			if (!child) return null;
			return [{node: jobChainNodeRoot, key: nodeKey}].concat(child);
		}
	}
	// done(err, newJobChainID)
	clone(done){
		var thisObj = this;
		cloneJobChainNode(this.jobChainNode,function(err, jobChainNodeID){
			if (err) return done(err, null);
			var name = thisObj.name;
			var userID = thisObj.userID;
			var status = 0;
			JobChain.CreateBasic(userID, function(err, jobChainID){
				if (err) return done(err, null);
				JobChain.UpdateNode(jobChainID, jobChainNodeID, function(err, success){
					if (err || !success) return done(err, success);
					JobChain.UpdateName(jobChainID, name, function(err, success){
						if (err || !success) return done(err, success);
						return done(null, jobChainID);
					})
				})
				
			})
		});
		function cloneJobChainNode(jobChainNode, done){
			if (!jobChainNode) return done(null, null);
			jobChainNode.clone(done);
		}
	}
	// Tạo JobChain Cơ bản
	// done(err, null) Nếu lỗi
	// done(null, null) Nếu không thành công
	// done(null, id) Nếu thành công
	static CreateBasic(userID, done){
		DBJobChain.Add({ userID: userID }, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			JobLog.Add({
				userID: userID,
				type: "info",
				cat: "Job Chain",
				name: "Job Chain",
				jobChainID: data._id,
				info: "Created JobChain: " + data._id
			});
			return done(null, data._id);
		})
	}
	// done(err, success)
	static UpdateName(jobChainID, name, done, userIDVerify=null){
		DBJobChain.UpdateName(jobChainID, name, done, userIDVerify);
	}
	// done(err, success)
	static UpdateNode(jobChainID, nodeID, done, userIDVerify=null){
		DBJobChain.UpdateNode(jobChainID, nodeID, done, userIDVerify);
	}
	// done(err, success)
	static UpdateStatus(jobChainID, status, done, userIDVerify=null){
		JobChain.GetStatus(jobChainID, function(err, dbstatus){
			if (err) return done(err, null);
			if (status != dbstatus && status == 1)
				JobLog.Add({
					userID: userIDVerify,
					type: "info",
					cat: "Job Chain",
					name: "Job Chain",
					jobChainID: jobChainID,
					info: "Started JobChain: " + jobChainID
				});
			else if (status != dbstatus && status == 0)
				JobLog.Add({
					userID: userIDVerify,
					type: "info",
					cat: "Job Chain",
					name: "Job Chain",
					jobChainID: jobChainID,
					info: "Stopped JobChain: " + jobChainID
				});
			return (null, true);
		}, userIDVerify);
		DBJobChain.UpdateStatus(jobChainID, status, done, userIDVerify);
	}
	// done(err, status) // status (0 | 1)
	static GetStatus(jobChainID, done, userIDVerify=null){
		DBJobChain.GetStatus(jobChainID, done, userIDVerify);
	}
	static GetData(jobChainID, done, userIDVerify=null){
		DBJobChain.Get(jobChainID, function(err, data){
			done(err, data);
		}, userIDVerify);
	}
	// done(err, jobChains)
	static GetAllData(done, userIDVerify=null){
		DBJobChain.GetAll(done, userIDVerify);
	}
	static GetDataJobChains(query, done, userIDVerify=null){
		DBJobChain.GetJobChains(query, function(err, dataJobChains){
			if(err) return done(err, null);
			if(!dataJobChains) return done(null, null);
			return done(null, dataJobChains);
		}, userIDVerify);
	}
	// done(err, jobChain)
	static Get(jobChainID, done, userIDVerify=null){
		DBJobChain.Get(jobChainID, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			if (data.jobChainNodeID)
				return JobChainNode.Get(data.jobChainNodeID, function(err, jobChainNode){
					if (err) return done(err, null);
					if (!jobChainNode) return done(null, null);
					return done(null, new JobChain({
						data: data,
						ID: data._id,
						jobChainNode: jobChainNode,
						name: data.name,
						userID: data.userID,
						status: data.status,
						publicDate: data.publicDate
					}));
				});
			return done(null, new JobChain({
				data: data,
				ID: data._id,
				name: data.name,
				userID: data.userID,
				status: data.status,
				publicDate: data.publicDate
			}));

		}, userIDVerify)
	}
	static HasJobChain(jobChainID, done, userIDVerify=null){
		DBJobChain.Get(jobChainID, function(err, data){
			if (err) return done(err, false);
			if (!data) return done(null, false);
			return done(null, true);
		}, userIDVerify);
	}
	// done(err, success);
	static RemoveJobChainNode(jobChainID, jobChainNodeID, done, userIDVerify=null){
		DBJobChain.Get(jobChainID, function(err, dataJobChain){
			if (err) return done(err, null);
			if (!dataJobChain) return done(null, false);
			// Xóa jobChainNode
			JobChainNode.Remove(jobChainNodeID, function(err, success){
				if (err) return done(err, null);
				if (!success) return done(null, false);
				// Xóa ở các parent
				if (jobChainNodeID == dataJobChain.jobChainNodeID)
					return DBJobChain.UpdateNode(jobChainID, null, function(err, success){
						return done(null, success)
					}, userIDVerify);
				// Tìm kiếm JobParent
				JobChainNode.FindNodeParent(dataJobChain.jobChainNodeID, jobChainNodeID, function(err, dataJobChainNode){
					if (err) return done(err, null);
					if (!dataJobChainNode) return done(null, false);

					var nexts = dataJobChainNode.nexts;
					var fieldName = null;
					Object.keys(nexts).forEach(function(key){
						if (nexts[key] == jobChainNodeID)
							fieldName = key;
					});
					JobChainNode.UpdateNext(dataJobChainNode._id, fieldName, undefined, function(err, success){
						return done(err, success);
					})
				});
			});
			// if (dataJobChain.jobChainNodeID == jobChainNodeID)
		}, userIDVerify);

	}

	static StartJobChainsActive(done=null, userIDVerify=null){
		DBJobChain.GetJobsActive(function(err, dataJobChains){
			if (err && done) return done(err, true);
			if (err) return;
			for (var i = 0; i < dataJobChains.length; i++){
				var jobChainID = dataJobChains[i]._id;
				JobChain.Get(jobChainID, function(err, jobChain){
					jobChain.start(function(err, success){});
				}, userIDVerify);
			}
			if (done) done(null, true);
		}, userIDVerify);
	}

	// done(err, success)
	static Remove(jobChainID, done, userIDVerify=null){
		IntervalExec.Remove(jobChainID)
		console.log("Deleted JobChain: " + jobChainID);
		DBJobChain.Remove(jobChainID, function(err, data){
			if (err || !data) return done(err, !!data);
			if (data.jobChainNodeID)
				JobChainNode.Remove(data.jobChainNodeID, function(err, success){})

			JobLog.Add({
				userID: userIDVerify,
				type: "info",
				cat: "Job Chain",
				name: "Job Chain",
				jobChainID: jobChainID,
				info: "Deleted JobChain: " + jobChainID
			});

			return done(null, true);
		}, userIDVerify);
	}
}	
module.exports = JobChain;