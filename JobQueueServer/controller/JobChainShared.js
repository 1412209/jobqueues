var DBJobChainShared = require("../models/JobChainShared.js");
class JobChainShared{
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.name = infos.name;
		this.description = infos.description;
		this.userID = infos.userID;
		this.jobs = infos.jobs;
		this.quantity_used = infos.quantity_used;
		this.JobChain = infos.JobChain;
	}
	// done(err, data)
	static Add(data, done=null){
		DBJobChainShared.Add(data, function(err, data){
			if (!done) return;
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return done(null, new JobChainShared({
				ID: data._id,
				name: data.name,
				description: data.description,
				userID: data.userID,
				jobs: data.jobs,
				quantity_used: data.quantity_used,
				JobChain: data.JobChain
			}));
		});
	}

	// data: { name, description }
	static Update(ID, data, done, userID=null){
		DBJobChainShared.Update(ID, data, done, userID);
	}

	static Get(ID, done){
		DBJobChainShared.Get(ID, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return done(null, new JobChainShared({
				ID: data._id,
				name: data.name,
				description: data.description,
				userID: data.userID,
				jobs: data.jobs,
				quantity_used: data.quantity_used,
				JobChain: data.JobChain
			}));
		});
	}

	static IncreaseQuantityUsed(ID, done){
		DBJobChainShared.IncreaseQuantityUsed(ID, done);
	}

	// query: { limit, skip, search, job }
	// done(err, jobChainShareds)
	static Filter(query, done){
		DBJobChainShared.Filter(query, function(err, dataJobChainShareds){
			if (err) return done(err, null);
			if (!dataJobChainShareds) return done(null, null);
			var jobChainShareds = [];
			dataJobChainShareds.forEach(function(dataJobChainShared){
				jobChainShareds.push(new JobChainShared({
					ID: dataJobChainShared._id,
					name: dataJobChainShared.name,
					description: dataJobChainShared.description,
					userID: dataJobChainShared.userID,
					jobs: dataJobChainShared.jobs,
					quantity_used: dataJobChainShared.quantity_used,
					JobChain: dataJobChainShared.JobChain
				}));
			})
			return done(null, jobChainShareds);
		});
	}

	// done (err, success)
	static Remove(ID, done, userID=null){
		DBJobChainShared.Remove(ID, done, userID);
	}
}

module.exports = JobChainShared;