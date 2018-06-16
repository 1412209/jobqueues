var DB = require('./DB.js');
var Model = null;
class PopularJobChain{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			name: String,
			description: String,
			userID: String,
			jobs: Array,
			quantity_used: Number,
			JobChain: Object
		});
		Model = DB.mongoose.model('category', schema);
		return Model;
	}

	// done(err, data)
	static Add(data, done=null){
		PopularJobChain.GetModel();
		var model = new Model({
			name: data.name,
			description: data.description,
			userID: data.userID,
			jobs: data.jobs,
			quantity_used: data.quantity_used,
			JobChain: data.JobChain,
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}

	// Lấy thông tin category dựa vào id
	// done(err, null): lỗi
	// done(null, null): không có category
	// done(null, category): nếu tìm thấy category
	static Get(ID, done){
		Category.GetModel();
		Model.findOne({ _id: ID }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	static filter(query, done){
		
	}
}

module.exports = PopularJobChain;