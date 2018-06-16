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

	static Remove(ID, userID, done){
		JobLog.GetModel();
		Model.remove({_id:ID,userID:userID}).exec().then( function(err, data){
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
}

module.exports = JobLog;