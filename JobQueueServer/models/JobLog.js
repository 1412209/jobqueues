var DB = require('./DB.js');
var Model = null;
class JobLog{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			userID: String,
			type: String, // error | info
			date: { type: Date, default: Date.now },
			name: String,
			cat: String,
			jobChainID: String,
			info: String
		});
		Model = DB.mongoose.model('joblog', schema);
		return Model;
	}

	/*
	*	Thêm mới
	*	done(err, null) Nếu lỗi
	*	done(null, jobLog) Nếu thành công
	*	done(null, null) Nếu tên user đã trùng => không thành công
	*/
	static Add(data, done=null){
		JobLog.GetModel();
		var model = new Model({
			userID: data.userID,
			type: data.type,
			name: data.name,
			cat: data.cat,
			jobChainID: data.jobChainID,
			info: data.info
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}

	// Lấy thông tin category dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có category
	// done(null, jobLog): nếu tìm thấy category
	static Get(ID, userID, done){
		JobLog.GetModel();
		Model.findOne({ _id: ID, userID: userID }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	static GetAll(userID, done){
		JobLog.GetModel();
		Model.find({
			userID: userID
		}, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		})
	}

	static Remove(ids, userID, done){
		JobLog.GetModel();
		Model.remove({
			_id: {$in: ids},
			userID:userID
		}).exec().then( function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}

	static RemoveAll(userID, done){
		JobLog.GetModel();
		Model.remove({userID:userID}).exec().then( function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}

	static Filter(query, done){
		JobLog.GetModel();

		var userID = query.userID;
		var type = query.type;
		var jobChainID = query.jobChainID;
		var datestart = query.datestart;
		var dateend = query.dateend;
		var skip = query.skip;
		var limit = query.limit;

		query = { $and: [] };
		if (userID) query["$and"].push({userID: userID});
		if (type) query["$and"].push({type: type});
		if (jobChainID) query["$and"].push({jobChainID: jobChainID});

		if (datestart) query["$and"].push({date: {$gte: datestart.toJSON()}});
		if (dateend){
			dateend.setMinutes(dateend.getMinutes()+1);
			query["$and"].push({date: {$lte: dateend.toJSON()}});
		}

		query = Model.find(query);
		if (skip) query = query.skip(skip);
		if (limit) query = query.limit(limit);
		query = query.sort({date: -1});

		query.exec(function(err, data){
			if (err) return done(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}
	// query { jobChainID, type, userID }
	// done (err, count)
	static GetCount(query, done){
		var q = {};
		if (query.jobChainID) q.jobChainID = query.jobChainID;
		if (query.type) q.type = query.type;
		if (query.userID) q.userID = query.userID;

		JobLog.GetModel();
		Model.find(q).count().exec(function(err, count){
			if (err) return done(err, 0);
			return done(null, count);
		})
	}
}

module.exports = JobLog;