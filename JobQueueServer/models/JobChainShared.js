var DB = require('./DB.js');
var Model = null;
class JobChainShared{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			name: String,
			description: String,
			userID: String,
			jobs: Array,
			quantity_used: Number,
			JobChain: Object,	// {options, inputs, jobSlug, nexts}
			publicDate: { type: Date, default: Date.now }
		});
		Model = DB.mongoose.model('job_chain_shared', schema);
		return Model;
	}

	// done(err, data)
	static Add(data, done=null){
		JobChainShared.GetModel();
		var model = new Model({
			name: data.name,
			description: data.description,
			userID: data.userID,
			jobs: data.jobs,
			quantity_used: data.quantity_used,
			JobChain: data.JobChain,
		});
		model.save(function(err, data){
			if (!done) return;
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}

	// data: { name, description }
	static Update(ID, data, done, userID=null){
		var name = data.name;
		var description = data.description;
		var update = {
			name: name,
			description: description
		}
		var query = {
			_id: ID
		}
		if (userID) query.userID = userID;
		JobChainShared.GetModel();

		Model.update(query,update,{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	static Get(ID, done){
		JobChainShared.GetModel();
		Model.findOne({ _id: ID }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	static IncreaseQuantityUsed(ID, done){
		JobChainShared.Get(ID, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			var quantity_used = data.quantity_used ? parseInt(data.quantity_used) + 1 : 1;
			Model.update({
				_id: ID
			},{
				quantity_used: quantity_used
			},{
				upsert: false
			}, function(err, data){
				if (err) return done(err, false);
				if (data.ok > 0) return done(null, true);
				return done(null, false);
			});
		})
	}

	// query: { limit, skip, search, job, sortBy: "latest" | "popular" }
	// done(err, jobChainShareds)
	static Filter(q, done){
		JobChainShared.GetModel();
		var limit = q.limit ? parseInt(q.limit) : 0;
		var skip = q.skip ? parseInt(q.skip) : 0;
		var search = q.search ? q.search : "";
		var job = q.job ? q.job : null;
		var sortBy = q.sortBy ? q.sortBy : "popular";
		var query = {
			"name": new RegExp(search, "i")
		}
		if (q.userID)
			query.userID = q.userID;

		if (job) query.jobs = job;
		query = Model.find(query).skip(skip).limit(limit);
		if (sortBy == "latest")
			query = query.sort({publicDate:-1, quantity_used:-1});
		else if (sortBy == "popular")
			query = query.sort({quantity_used:-1, publicDate:-1});
		else 
			query = query.sort({quantity_used:-1, publicDate:-1});

		query.exec(function(err, data){
			if (err) return done(err, null);
			data = (data) ? data : [];
			return done(null, data);
		})
	}

	static Remove(ID, done, userID=null){
		JobChainShared.GetModel();
		var query = { _id:ID }
		if (userID) query.userID = userID;
		Model.find(query).remove().exec(function(err, data){
			if (err && done) return done(err, null) 
			if (err) return;

			if(done) return done(null, !!data);
		})
	}
}

module.exports = JobChainShared;