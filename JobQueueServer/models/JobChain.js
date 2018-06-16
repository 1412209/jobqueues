var DB = require('./DB.js');
var Model = null;
class JobChain {
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			jobChainNodeID: String,
			name: String,
			userID: String,
			status: Number,	// 0: off | 1: on | unset: off
			publicDate: { type: Date, default: Date.now }
		});
		Model = DB.mongoose.model('job_chain', schema);
		return Model;
	}

	/*
	*	Thêm mới JobChain
	*	data = {
	*		jobChainNodeID
	*		userID
	*		status
	*	}
	*	done(err, null) Nếu lỗi
	*	done(null, jobChain) Nếu thành công
	*/
	static Add(data, done=null){
		JobChain.GetModel();
		var model = new Model({
			jobChainNodeID: data.jobChainNodeID,
			userID: data.userID,
			name: data.name,
			status: data.status
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}
	
	// Lấy thông tin chuỗi công việc dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có JobChain
	// done(null, jobChain): nếu tìm thấy JobChain
	static Get(ID, done, userIDVerify=null){
		JobChain.GetModel();
		var query = { _id: ID };
		if (userIDVerify) query.userID = userIDVerify;
		Model.findOne(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	static GetJobsActive(done, userIDVerify=null){
		JobChain.GetModel();
		var query = {status:1};
		if (userIDVerify) query.userID = userIDVerify;
		Model.find(query, function(err, data){
			if (err) return data(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}

	// Lấy toàn bộ JobChain
	// done(err, null): Lỗi
	// done(null, jobChains): nếu thành công
	//		jobChains: danh sách các JobChain
	static GetAll(done, userIDVerify=null){
		JobChain.GetModel();
		var query = {};
		if (userIDVerify) query.userID = userIDVerify;
		Model.find(query).sort({publicDate:-1}).exec(function(err, data){
			if (err) return done(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}
	static GetJobChains(q, done, userIDVerify=null){
		JobChain.GetModel();
		var search = (q.search) ? q.search : "";
		var skip = (q.skip < 0) ? 0 : q.skip;
		var count = q.count;
		var find = {};
		if (search != "")
			find['$and'] = [
				{ name: { $exists: true } },
				{ name: new RegExp(search, "i") }
			];
		if (userIDVerify) find.userID = userIDVerify;
		var query = Model.find(find).skip(skip);
		if (count > 0)
			query = query.limit(count);

		query.sort({publicDate:-1}).exec(function(err, data){
			if (err) return done(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}
	static GetStatus(jobChainID, done, userIDVerify=null){
		JobChain.GetModel();
		var query = {_id: jobChainID};
		if (userIDVerify) query.userID = userIDVerify;
		Model.findOne(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data.status);
			return done(null, null);
		});
	}

	// done(err, success)
	static UpdateName(jobChainID, name, done, userIDVerify=null){
		JobChain.GetModel();
		var query = { _id:jobChainID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.update(query,{
			name: name
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	// Cập nhật status
	// done(err, false): lỗi
	// done(null, true): Thành công
	// done (null, false): thất bại 
	static UpdateStatus(jobChainID, status, done, userIDVerify=null){
		JobChain.GetModel();
		var query = { _id:jobChainID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.update(query,{
			status: status
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}

	static UpdateNode(jobChainID, nodeID, done, userIDVerify=null){
		JobChain.GetModel();
		var query = { _id:jobChainID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.update(query,{
			jobChainNodeID: nodeID
		},{
			upsert: false
		}, function(err, data){
			if (err) return done(err, false);
			if (data.ok > 0) return done(null, true);
			return done(null, false);
		});
	}
	// done(err, data)
	static Remove(jobChainID, done, userIDVerify=null){
		JobChain.GetModel();
		var query = { _id:jobChainID }
		if (userIDVerify) query.userID = userIDVerify;
		Model.findOneAndRemove(query).exec(function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
}

module.exports = JobChain;