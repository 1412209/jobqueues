const JobTmp = require("./JobTmp.js");
var clone = require('clone');

class Job {
	constructor(infos){
		this.jobChainNodeID = infos.jobChainNodeID; // { id, thông tin bổ sung }
		this.authentications = infos.authentications;
		this.inputs = infos.inputs;
		this.slug = infos.slug;
		this.level = infos.level;
		this.prefix = infos.prefix ? infos.prefix : "";
		this.JobLog = require("./JobLog.js");
	}
	getTmpPath() { return "./jobs/" + this.slug + "/tmp" }
	update(infos){
		var thisObject = this;
		Object.keys(infos).forEach(function(key){
			thisObject[key] = infos[key];
		});
	}
	clone(){
		var obj = clone(this);
		return obj;
	}
	exec(done){ }

	execAfterHook(done){
		var thisObject = this;
		this.exec(function(err, outputs){
			if (err || !outputs) return done(err, outputs);	// outputs { nextkey: data }
			Object.keys(outputs).forEach(function(key){
				outputs[key] = thisObject.insertPrefix(outputs[key]);
			})
			return done(err, outputs);
		})
	}
	createTmpPath() {
		var fs = require("fs");
		var tmpPath = this.getTmpPath();
		try {
			if (!fs.existsSync(tmpPath))
				fs.mkdirSync(tmpPath);
		} catch(e) {
			console.log(e)
		}
	}

	addTmp(data, done=null){
		JobTmp.Add(this.jobChainNodeID, this.slug, data, function(err, success){
			if(done)done(err, success);
		})
	}
	updateTmp(data, done=null){
		JobTmp.UpdateData(this.jobChainNodeID, data, function(err, success){
			if(done)done(err, success);
		})
	}
	getTmp(done){
		JobTmp.GetData(this.jobChainNodeID, function(err, data){
			done(err, data);
		})
	}
	deleteTmp(done=null){
		JobTmp.Delete(this.jobChainNodeID, function(err, success){
			if(done)done(err, success);
		})
	}
	insertPrefix(outputs){
		var obj = {};
		var prefix = this.prefix;
		Object.keys(outputs).forEach(function(key){
			obj[prefix+"_"+key] = outputs[key];
		});
		return obj;
	}
	init(done){
		return done(null, {});
	}
	/**
	*	type: (error | info)
	*	
	*/
	log(type, name, info){
		if (type == "error" && this.level == 0) return;
		this.JobLog.Add({
			type: type,
			name: name,
			jobChainNodeID: this.jobChainNodeID,
			info: this.jobChainNodeID + " - " + info,
			userID: this.userID,
			cat: "Exec Log"
		});
	}
}
module.exports = Job;