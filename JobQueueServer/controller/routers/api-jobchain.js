var router = require("express").Router();
var JobManager = require("../JobManager.js");
var JobChain = require("../JobChain.js");
var JobChainNode = require("../JobChainNode.js")
var AccountPermission = require("../AccountPermission.js");
var JobLog = require("../JobLog.js");
var async = require("async");
var JobChainShared = require("../JobChainShared.js");

router.get("/jobs", (req, res, next) => {
	var results = [];
	var type = req.query.type;
	var category = req.query.category;
	var data = {};
	if (type) data['type'] = type;
	if (category) data['categorySlug'] = category;
	data["sortBy"] = "popular";
	JobManager.JobsFilter(data, function(err, jobs){
		if (err || !jobs) return;
		Object.keys(jobs).forEach(function(key){
			var job = jobs[key];
			var jobInfo = {
				slug: job.slug,
				name: job.name,
				icon: job.getIconUrl()
			}
			results.push(jobInfo);
		})
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	});
})

router.post("/node/add", (req, res, next) => {
	var jobSlug = req.body.jobSlug;
	var jobChainID = req.body.jobChainID;
	var jobChainNodeParentID = req.body.jobChainNodeParentID;
	var nextField = req.body.nextField;
	var isRoot = parseInt(req.body.isRoot);
	JobManager.GetJob(jobSlug, function(err, job){
		if (err || !job){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({success:false, message: "Error"}));
			return;
		}
		if (isRoot && job.type != "trigger"){
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({success:false, message: "Error: '" +job.name+ "'' is not a Job Trigger."}));
			return;
		}
		JobChainNode.Add({
			jobSlug: jobSlug,
			jobChainID: jobChainID
		}, function(err, jobChainNode){
			if (!isRoot)
				return JobChainNode.UpdateNext(jobChainNodeParentID, nextField, jobChainNode.ID, function(err, success){
					success = !err && success;
					var message = "Success";
					if (err || !success)
						message = "Error"

					if (!err && success)
					job.increaseQuantityUsed();

					res.setHeader('Content-Type', 'application/json');
					res.send(JSON.stringify({success:success, message: message}));
				});
			JobChain.UpdateNode(jobChainID, jobChainNode.ID, function(err, success){
				success = !err && success;
				var message = "Success";
				if (err || !success)
					message = "Error";

				if (!err && success)
					job.increaseQuantityUsed();

				res.setHeader('Content-Type', 'application/json');
				res.send(JSON.stringify({success:success, message: message}));
			}, req.user.ID);
		})
	})
	
})

router.delete("/node", (req, res, next) => {
	var jobChainID = req.body.jobChainID;
	var jobChainNodeID = req.body.jobChainNodeID;
	JobChain.RemoveJobChainNode(jobChainID, jobChainNodeID, function(err, success){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success:success}));
	}, req.user.ID);
})

router.get("/nodes", (req, res, next) => {
	var jobChainID = req.query.jobChainID;
	res.setHeader('Content-Type', 'application/json');
	JobChain.Get(jobChainID, function(err, jobChain){
		var results = {};
		if (!err && jobChain) {
			var jobChainNode = jobChain.jobChainNode;
			results = getJobChainNodeInfo(jobChainNode);
		}

		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));

	}, req.user.ID);

	function getJobChainNodeInfo (jobChainNode, nextName=null, nextField=null){
		if (!jobChainNode){
			return returnDefault();
		}
		var childs = [];
		if (!jobChainNode.job || !jobChainNode.job.nextsAttributes) return returnDefault();
		jobChainNode.job.nextsAttributes.forEach(function(nextsAttribute){
			if (!jobChainNode.options || !jobChainNode.options.nexts || jobChainNode.options.nexts[nextsAttribute.field_name] != 0)
				childs.push(getJobChainNodeInfo(jobChainNode.nexts[nextsAttribute.field_name], nextsAttribute.name, nextsAttribute.field_name));
		})
		return {
			image: jobChainNode.job.getIconUrl(),
			type: "editor",
			nextName: nextName,
			nextField: nextField,
			childs: childs,
			jobSlug: jobChainNode.job.slug,
			jobChainID: jobChainID,
			jobChainNodeID: jobChainNode.ID
		}
		function returnDefault(){
			return {
				type: "add",
				nextName: nextName,
				nextField: nextField,
				jobChainID: jobChainID
			}
		}
	}
})

router.get("/node", (req, res, next) => {
	var jobChainID = req.query.jobChainID;
	var jobChainNodeID = req.query.jobChainNodeID;
	JobChain.Get(jobChainID, function(err, jobChain){
		var chainNode = jobChain.getChainNode(jobChainNodeID); // [{node, key}, {node, key},...]
		if (!chainNode) return send({success: false});
		async.parallel({
			account: function(callback){
				loadAccount(chainNode[chainNode.length-1].node, callback);
			},
			template: function(callback){
				loadTemplate(chainNode, callback);
			},
			config: function(callback){
				loadConfig(chainNode[chainNode.length-1].node, callback);
			},
			options: function(callback){
				loadOptions(chainNode[chainNode.length-1].node, callback);
			}
		}, function(err, results){
			var job = chainNode[chainNode.length-1].node.job;
			var jobInfo = {
				name: job.name,
				nextsAttributes: job.nextsAttributes
			}
			return send({
				success: true,
				jobInfo: jobInfo,
				options: results.options,
				account:results.account,
				template: results.template,
				config: results.config
			});
		});
	}, req.user.ID);

	function loadAccount(jobChainNode, done){
		var job = jobChainNode.job;
		if (!job.hasAccount) return done(null, null);
		var currentAccount = jobChainNode.account;
		AccountPermission.GetByJobAndUser(job.slug, req.user.ID, function(err, accounts){
			if (err) return done(err, null);
			if (!accounts) return done(null, []);
			var accountsInfo = [];
			accounts.forEach(function(account){
				var tmp = {
					ID: account.ID,
					name: account.basicInfos.name,
					identity: account.basicInfos.identity,
					checked: currentAccount && currentAccount.ID.toString() == account.ID.toString()
				}
				accountsInfo.push(tmp);
			})
			done(null, {
				accounts: accountsInfo,
				authUrl: job.getAuthUrl("https://jobqueues.info/dashboard/jobchain/editor/" + jobChainID)
			})
		})
	}
	function loadTemplate(chainNode, done){
		var results = [];
		for(var i = 0; i < chainNode.length-1; i++){
			var node = chainNode[i].node;
			var prefix = (node.options && node.options.prefix) ? node.options.prefix : "";
			var nextkey = chainNode[i].key;
			node.job.outputAttributes = node.job.outputAttributes ? node.job.outputAttributes : {};
			var outputAttributes = node.job.outputAttributes[nextkey];
			outputAttributes = (outputAttributes) ? outputAttributes : [];
			for(var j = 0; j < outputAttributes.length; j++ ){
				outputAttributes[j]['jobSlug'] = node.job.slug;
				outputAttributes[j]['field_name'] = prefix + "_" +outputAttributes[j]['field_name']
			}
			if (node.options && node.options.dataFields){
				node.options.dataFields.forEach(function(field){
					outputAttributes.push({
						field_name: prefix + "_" +field.field_name,
						name: field.name,
						jobSlug: node.job.slug
					})
				})
			}
			results = results.concat(outputAttributes);
		}
		done(null, results);
	}
	function loadConfig(jobChainNode, done){
		var job = jobChainNode.job;
		var inputs = jobChainNode.inputs;	// Giá trị inputs
		var inputAttributes = job.inputAttributes;
		if (!inputAttributes || inputAttributes.length <= 0) return done(null, []);
		if (inputs)
			for(var i=0; i < inputAttributes.length; i++){
				var value = inputs[inputAttributes[i].field_name]
				if (value) inputAttributes[i]['value'] = value;
			}
		return done(null, inputAttributes);

	}
	function loadOptions(jobChainNode, done){
		var job = jobChainNode.job;
		var options = jobChainNode.options;
		var optionsAttributes = job.optionsAttributes
		if (!optionsAttributes || optionsAttributes.length <= 0) return done(null, []);
		if (options)
			for(var i=0; i < optionsAttributes.length; i++){
				var value = options[optionsAttributes[i].field_name]
				if (value) optionsAttributes[i]['value'] = value;
			}
		return done(null, optionsAttributes);
	}
	function send(results){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	}
})

router.put("/node", (req, res, next) => {
	var options = (req.body.options) ? req.body.options : {};
	var accountID = req.body.accountID;
	var config = req.body.config;
	var jobChainNodeID = req.body.jobChainNodeID;
	if (!jobChainNodeID) return send({success: false, message: "Đã có lỗi khi cập nhật"});
	async.parallel({
		accountIDSuccess: function(callback){
			JobChainNode.UpdateAccountID(jobChainNodeID, accountID, function(err, success){
				callback(err, success);
			})
		},
		inputsSuccess: function(callback){
			JobChainNode.UpdateInputs(jobChainNodeID, config, function(err, success){
				callback(err, success);
			})
		},
		optionsSuccess: function(callback){
			JobChainNode.MergeOptions(jobChainNodeID, options, function(err, success){
				callback(err, success);
			})
		}
	}, function(err, results){
		if (err) return send({success: false, message: "Error update"});
		var message = "";
		if (!results.optionsSuccess) message+="Error update options<br>";
		if (!results.accountIDSuccess) message+="Error update Account<br>";
		if (!results.inputsSuccess) message+="Error update Configure<br>";
		if (message != "") return send({success: false, message: message});
		return send({success: true, message: "Updated"})
	})
	function send(results){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	}
})

router.post("/status", (req, res, next) => {
	var jobChainID = req.body.jobChainID
	var turnOn = req.body.turnOn == 1 || req.body.turnOn == '1';
	JobChain.Get(jobChainID, function(err, jobChain){
		if (err || !jobChain) return send({success: false}); 
		if (turnOn) jobChain.start(function(err, success){
			return send({success: success});
		});
		else jobChain.stop(function(err, success){
			return send({success: success});
		});
	}, req.user.ID);

	function send(results){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	}
})

router.put("/name", (req, res, next) => {
	var jobChainID = req.body.jobChainID;
	var jobChainName = req.body.jobChainName;
	JobChain.UpdateName(jobChainID, jobChainName, function(err, success){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success:success}));
	}, req.user.ID);
})

router.get("/", (req, res, next) => {
	var skip = (req.query.skip) ? parseInt(req.query.skip) : 0;
	skip = (skip < 0) ? 0 : skip;
	var count = req.query.count ? parseInt(req.query.count) : 10;
	count = (count < 1) ? 1 : count;
	var search = (req.query.search) ? req.query.search : "";
	var query = {
		skip: skip,
		count: count,
		search: search
	}
	JobChain.GetDataJobChains(query, function(err, dataJobChains){
		if (!dataJobChains || err)  return send({success: false, jobChainsInfo: []});
		var tasks = [];
		dataJobChains.forEach(function(dataJobChain){
			tasks.push(getJobChainInfo.bind(null, dataJobChain));
		})
		// results [{jobChainID, name, status, iconUrl}]
		async.parallel(tasks, function(err, results){
			return send({success: true, jobChainsInfo: results});
		})
	}, req.user.ID);
	function getJobChainInfo(dataJobChain, done){
		var name = (dataJobChain.name) ? dataJobChain.name : "";
		var status = dataJobChain.status == 1;
		var publicDate = dataJobChain.publicDate;
		publicDate = ("00" + publicDate.getDate()).slice(-2) + "/" + ("00" + (1+publicDate.getMonth())).slice(-2) + "/" + ("0000" + (1900+publicDate.getYear())).slice(-4)
		var result = {
			jobChainID: dataJobChain._id,
			name: name,
			status: status,
			publicDate: publicDate,
			iconUrl: "/images/logo.png",

		}
		if (!dataJobChain.jobChainNodeID)
			return done(null, result);
		JobChainNode.GetData(dataJobChain.jobChainNodeID, function(err, dataJobChainNode){
			if (err ||!dataJobChainNode) return done(null, result);
			var jobSlug = dataJobChainNode.jobSlug;
			if (!jobSlug) return done(null, result);
			var iconUrl = JobManager.GetIconUrl(jobSlug);
			if (iconUrl) result['iconUrl'] = iconUrl;
			return done(null, result);
		})
	}
	function send(results){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	}
})

router.delete("/", (req, res, next) => {
	var jobChainID = req.body.jobChainID;
	JobChain.Remove(jobChainID, function(err, success){
		return send ({success: success});
	}, req.user.ID);
	function send(results){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify(results));
	}
})

router.post("/share", (req, res, next) => {
	var name = req.body.name;
	var description = req.body.description;
	var jobChainID = req.body.jobChainID;
	var userID = req.user.ID;
	var quantity_used = 0;
	var jobChainNodeShared = {};
	var jobs = [];
	JobChain.Get(jobChainID, function(err, jobChain){
		if (!jobChain || err) return fail();
		jobChainNodeShared = jobChain2JobChainShared(jobChain);
		JobChainShared.Add({
			name: name,
			description: description,
			jobs: jobs,
			userID: userID,
			quantity_used: quantity_used,
			JobChain: jobChainNodeShared,
		}, function(err, jobChainShared){
			if (err || !jobChainShared) return fail();
			return success();
		})
	}, userID);

	function success (){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 1}));
	}
	function fail (){
		res.setHeader('Content-Type', 'application/json');
		res.send(JSON.stringify({success: 0}));
	}
	function jobChain2JobChainShared(jobChain){
		return getJobChainNodeSharedInfo(jobChain.jobChainNode);
		function getJobChainNodeSharedInfo(jobChainNode){
			if (!jobChainNode) return null;
			jobs.push(jobChainNode.job.slug);
			var jobChainNodeShared = {
				options: jobChainNode.options,
				inputs: jobChainNode.inputs,
				jobSlug: jobChainNode.job.slug,
				nexts: {}
			}
			var nexts = jobChainNode.nexts;
			Object.keys(nexts).forEach(function(key){
				var next = nexts[key];
				nextShared = getJobChainNodeSharedInfo(next);
				if (nextShared) jobChainNodeShared.nexts[key] = nextShared;
			});
			return jobChainNodeShared;
		}
	}
})

router.post("/exec/:jobChainID", (req, res, next) => {
	var jobChainID = req.params.jobChainID;
	var jobKey = req.body.job_key;
	res.setHeader('Content-Type', 'application/json');
	if (!jobKey) return res.status(401).send(JSON.stringify({success: 0, message: "Bad request"}));
	JobChain.Get(jobChainID, function(err, jobChain){
		if (err) return res.status(500).send(JSON.stringify({success: 0, message: "Not Implemented"}));
		if (!jobChain || jobChain.status != 1
			|| !jobChain.jobChainNode || !jobChain.jobChainNode.job || jobChain.jobChainNode.job.slug != "WebHooks"
			|| !jobChain.jobChainNode.options || !jobChain.jobChainNode.options.jobKey || jobChain.jobChainNode.options.jobKey != jobKey)
			return res.status(401).send(JSON.stringify({success: 0, message: "Bad request"}));
		jobChain.jobChainNode.inputs = jobChain.jobChainNode.inputs ? jobChain.jobChainNode.inputs : {};
		jobChain.jobChainNode.inputs["body"] = req.body;
		jobChain.exec();
		return res.status(200).send(JSON.stringify({success: 1, message: "Success"}));
	});
})

router.post("/clone", (req, res, next) => {
	var jobChainID = req.body.jobChainID;
	res.setHeader('Content-Type', 'application/json');
	JobChain.Get(jobChainID, function(err, jobChain){
		if (err || !jobChain) return res.status(500).send(JSON.stringify({success: 0}));
		jobChain.clone(function(err, newJobChainID){
			if (err || !newJobChainID) return res.status(500).send(JSON.stringify({success: 0}));
			res.status(200).send(JSON.stringify({success:1}));
		});
	});
})

module.exports = router;