const DB = require("./DB.js");
var Model = null;

class JobTmp{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			jobChainNodeID: String,
			jobSlug: String,
			data: {}
		});
		Model = DB.mongoose.model('job_tmp', schema);
		return Model;
	}
	static Add(jobChainNodeID, jobSlug, data, done=null){
		JobTmp.GetModel();
		var model = new Model({
			jobChainNodeID: jobChainNodeID,
			jobSlug: jobSlug,
			data: data
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}
	static UpdateData(jobChainNodeID, data, done=null){
		JobTmp.GetModel();
		Model.update({
			jobChainNodeID: jobChainNodeID,
		},{
			data: data
		},{
			upsert: false
		}, function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});

	}
	static GetData(jobChainNodeID, done){
		JobTmp.GetModel();
		Model.findOne({ jobChainNodeID: jobChainNodeID }, function(err, data){
			if (err) return done(err, null);
			if (data && data.data) return done(null, data.data);
			return done(null, null);
		});
	}
	static Delete(jobChainNodeID, done=null){
		JobTmp.GetModel();
		Model.find({ jobChainNodeID: jobChainNodeID }).remove().exec(function(err, data){
			if (err && done) return done(err, null) 
			if (err) return;

			if(done) return done(null, !!data);
		})
	}
}

module.exports = JobTmp;