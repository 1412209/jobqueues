var DB = require('./DB.js');
var DBJobTmp = require("./JobTmp.js");
var Model = null;
class JobChainNode {
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			options: {
				prefix : {type: String, default: ''},	// Tiền tố cho output do người dùng định nghĩa
				name: String,
				nexts: Object,
				intervalSeconds: {type: Number, default: 10},
				schedule: Object,
				dataFields: Object,
				jobKey: String
			},
			jobSlug: String,
			jobChainID: String,
			accountID: String,
			inputs: {},
			// outputs: {},
			nexts: {}	// Các node tiếp theo VD: { next: jobChainNodeID }
		});
		Model = DB.mongoose.model('job_chain_node', schema);
		return Model;
	}

	/*
	*	Thêm mới JobChainNode
	*	data = {
	*		jobSlug
	*		jobChainID
	*		accountID
	*		inputs
	*		outputs
	*		nexts
	*	}
	*	done(err, null) Nếu lỗi
	*	done(null, jobChainNode) Nếu thành công
	*/
	static Add(data, done=null){
		JobChainNode.GetModel();
		var model = new Model({
			options: data.options,
			jobSlug: data.jobSlug,
			jobChainID: data.jobChainID,
			accountID: data.accountID,
			inputs: data.inputs,
			// outputs: data.outputs,
			nexts: data.nexts
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}
	
	// Lấy thông tin chuỗi công việc dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có jobChainNode
	// done(null, jobChainNode): nếu tìm thấy jobChainNode
	static Get(ID, done){
		JobChainNode.GetModel();
		var query = { _id: ID };
		Model.findOne(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
	static UpdateNext(jobChainNodeID, field, nextNodeID, done){
		nextNodeID = (nextNodeID) ? nextNodeID.toString() : nextNodeID;
		JobChainNode.GetModel();
		var query = { _id:jobChainNodeID }
		var update = {};
		update["nexts."+field] = nextNodeID;
		Model.update(query,update,{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}
	// done (err, success)
	static Remove(jobChainNodeID, done){
		JobChainNode.GetModel();
		remove(jobChainNodeID).then(function(success){
			done(null, success);
		});
		
		async function remove(jobChainNodeID){
			if (!jobChainNodeID) return true;
			var dataRemoved = await removePromise(jobChainNodeID);
			if (!dataRemoved) return false;
			var nexts = dataRemoved.nexts;
			var result = true;
			if (nexts){
				var keys = Object.keys(nexts);
				for (var i = 0; i < keys.length; i++){
					var key = keys[i];
					var next = nexts[key];
					result = result && await remove(next);
				}
			}
			return result;
		}
		function removePromise(jobChainNodeID){
			return new Promise(function(resolve, reject){
				Model.findOneAndRemove({_id:jobChainNodeID}).exec(function(err, data){
					if (err || !data) return resolve(false);
					DBJobTmp.Delete(jobChainNodeID);
					return resolve(data);
				})
			})
		}
	}
	static RemoveTmp(jobChainNodeID, done = null){
		JobChainNode.GetModel();
		removeTmp(jobChainNodeID).then(function(success){
			if (done) done(null, success);
		});
		
		async function removeTmp(jobChainNodeID){
			if (!jobChainNodeID) return true;
			DBJobTmp.Delete(jobChainNodeID);
			var dataRemoved = await getPromise(jobChainNodeID);
			if (!dataRemoved) return false;
			var nexts = dataRemoved.nexts;
			var result = true;
			if (nexts){
				var keys = Object.keys(nexts);
				for (var i = 0; i < keys.length; i++){
					var key = keys[i];
					var next = nexts[key];
					result = result && await removeTmp(next);
				}
			}
			return result;
		}
		function getPromise(jobChainNodeID){
			return new Promise(function(resolve, reject){
				JobChainNode.Get(jobChainNodeID, function(err,data){
					if (err || !data) return resolve(false);
					return resolve(data);
				})
			})
		}
	}

	// done (err, dataJobChainNode)
	static FindNodeParent(jobChainNodeRootID, jobChainNodeID, done) {
		JobChainNode.GetModel();
		find(jobChainNodeRootID, jobChainNodeID).then(function(nodeParent){
			return done(null, nodeParent);
		})
		

		async function find(jobChainNodeRootID, jobChainNodeID){
			var jobChainNode = await findPromise(jobChainNodeRootID, jobChainNodeID);
			if (!jobChainNode || !jobChainNode.nexts) return null;
			var key = findInObject(jobChainNode.nexts, jobChainNodeID);
			if (key)
				return jobChainNode;
			var nexts = jobChainNode.nexts;
			var keys = Object.keys(nexts);
			for(var i =0; i < keys.length; i++){
				var key = keys[i];
				var next = nexts[key];
				var jobChainNode = await find(next, jobChainNodeID);
				if (jobChainNode) return jobChainNode;
			}
			return null;
		}
		function findPromise(jobChainNodeRootID, jobChainNodeID){
			return new Promise(function(resolve, reject){
				JobChainNode.Get(jobChainNodeRootID, function(err, jobChainNode){
					if (err || !jobChainNode) return resolve(null);
					return resolve(jobChainNode);
				})
			})
		}
		// key
		function findInObject(object, value){
			var result = null;
			Object.keys(object).forEach(function(key){
				if (object[key] == value)
					result = key;
			});
			return result;
		}
	}

	// done (err, seccess)
	static UpdateAccountID(jobChainNodeRootID, accountID, done){
		JobChainNode.GetModel();
		Model.update({
			_id: jobChainNodeRootID
		},{
			accountID: accountID
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	// done (err, seccess)
	static UpdateInputs(jobChainNodeRootID, inputs, done){
		JobChainNode.GetModel();
		Model.update({
			_id: jobChainNodeRootID
		},{
			inputs: inputs
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	// done(err, success)
	static MergeOptions(jobChainNodeID, options, done){
		JobChainNode.GetModel();
		var update = {};
		Object.keys(options).forEach(function(key){
			update['options.'+key] = options[key];
		})
		Model.update({
			_id: jobChainNodeID
		},
		update,
		{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}
}

module.exports = JobChainNode;