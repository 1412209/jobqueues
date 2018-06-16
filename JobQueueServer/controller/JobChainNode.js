var DBJobChainNode = require("../models/JobChainNode.js")
var JobManager = require("./JobManager.js")
var AccountPermission = require("./AccountPermission.js")
var async = require("async");

class JobChainNode {
	constructor(infos){
		this.data = infos.data;
		this.options = infos.options;
		this.ID = infos.ID;
		this.job = infos.job;
		this.account = infos.account;
		this.inputs = infos.inputs;		// Cấu hình đầu vào (theo InputAttribute)
		// this.outputs = infos.outputs;	// Template của đối tượng tiếp theo
		this.nexts = infos.nexts;
	}

	// done(err, jobChainNodeID)
	clone (done){
		var options = this.data.options;
		var jobSlug = this.data.jobSlug;
		var jobChainID = this.data.jobChainID;
		var accountID = this.data.accountID;
		var inputs = this.data.inputs;

		var nextsObj = this.nexts;
		var parallelFunction = {};
		Object.keys(nextsObj).forEach(function(key){
			var nextObj = nextsObj[key];
			parallelFunction[key] = (function(nextObj, jobChainID, callback){
				if (!nextObj) return callback(null, null);
				nextObj.clone(function(err, jobChainNodeID){
					callback(err, jobChainNodeID);
				})
			}).bind(null, nextObj, jobChainID);
		});
		async.parallel(parallelFunction, function(err, nexts){
			if (err) return done(err, null);
			JobChainNode.Add({
				options: options,
				jobSlug: jobSlug,
				jobChainID: jobChainID,
				accountID: accountID,
				inputs: inputs,
				nexts: nexts
			}, function(err, data){
				if (err || !data) return (err, null);
				return done(null, data.ID);
			})
		})
	}

	static RemoveTmp(jobChainNodeID, done = null){
		DBJobChainNode.RemoveTmp(jobChainNodeID, done);
	}

	// Thêm mới job chain node
	// done (null, null) nếu không thêm thành công
	// done (err, null) nếu lỗi
	// done (null, jobChainNode)
	static Add(data, done){
		DBJobChainNode.Add(data, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return JobChainNode.Get(data._id, done);
		});
	}

	static Get(JobChainNodeID, done){
		var jobChainNode = get(JobChainNodeID).then(function(jobChainNode){
			return done(null, jobChainNode);
		});

		async function get(JobChainNodeID){
			var dataJobChainNode = await getNode(JobChainNodeID);
			if (!dataJobChainNode) return null;
			var dataNexts = dataJobChainNode.nexts;
			var nexts = {};
			if (dataNexts){
				var keys = Object.keys(dataNexts);
				for(var i = 0; i < keys.length; i++){
					var key = keys[i];
					var dataNext = dataNexts[key];
					nexts[key] = await get(dataNext);
				}
			}
			var job = await getJob(dataJobChainNode.jobSlug);
			var account = await getAccount(dataJobChainNode.accountID)
			return new JobChainNode({
				data: dataJobChainNode,
				options: dataJobChainNode.options,
				ID: dataJobChainNode._id,
				job: job,
				account: account,
				inputs: dataJobChainNode.inputs,
				outputs: dataJobChainNode.outputs,
				nexts: nexts,
			})
			
		}

		function getAccount(accountID){
			return new Promise(function(resolve, reject){
				AccountPermission.Get(accountID, function(err, account){
					return resolve(account);
				})
			})
		}
		function getJob(jobSlug){
			return new Promise(function(resolve, reject){
				JobManager.GetJob(jobSlug, function(err, job){
					return resolve(job);
				})
			})
		}

		function getNode(JobChainNodeID){
			return new Promise(function(resolve, reject){
				DBJobChainNode.Get(JobChainNodeID, function(err, data){
					if (err) return resolve(null);
					return resolve(data);
				});
			})
		}
	}

	// Lấy data JobChainNode
	static GetData(JobChainNodeID, done){
		DBJobChainNode.Get(JobChainNodeID, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return done(null, data);
		});
	}

	static UpdateNext(jobChainNodeID, field, nextNodeID, done){
		DBJobChainNode.UpdateNext(jobChainNodeID, field, nextNodeID, function(err, success){
			done(err, success);
		})
	}

	// done (err, success)
	static Remove(jobChainNodeID, done){
		DBJobChainNode.Remove(jobChainNodeID, done);
	}

	// done (err, dataJobChainNode)
	static FindNodeParent(jobChainNodeRootID, jobChainNodeID, done) {
		DBJobChainNode.FindNodeParent(jobChainNodeRootID, jobChainNodeID, done);
	}

	// done (err, seccess)
	static UpdateAccountID(jobChainNodeRootID, accountID, done){
		DBJobChainNode.UpdateAccountID(jobChainNodeRootID, accountID, done);
	}

	// done (err, seccess)
	static UpdateInputs(jobChainNodeRootID, inputs, done){
		DBJobChainNode.UpdateInputs(jobChainNodeRootID, inputs, done);
	}

	// done(err, success)
	static MergeOptions(jobChainNodeID, options, done){
		JobChainNode.Get(jobChainNodeID, function(err, jobChainNode){
			if (err || !jobChainNode) return done(err, null);
			var minIntervalSecondsDefault = (jobChainNode.job && jobChainNode.job.minIntervalTime) ? Math.floor(jobChainNode.job.minIntervalTime / 1000) : 10;
			var intervalSeconds = (options.intervalSeconds && options.intervalSeconds != "") ? parseInt(options.intervalSeconds) : 0;
			options.intervalSeconds = (intervalSeconds < minIntervalSecondsDefault) ? minIntervalSecondsDefault : intervalSeconds;
			DBJobChainNode.MergeOptions(jobChainNodeID, options, done);
		})
		
	}
}
module.exports = JobChainNode;