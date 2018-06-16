var DB = require('./DB.js');
var Model = null;
class JobMeta{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			slug: String,
			key: String,
			value: Object
		});
		Model = DB.mongoose.model('jobmeta', schema);
		return Model;
	}
	static GetOne(query, done){
		JobMeta.GetModel();
		Model.findOne(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
	static Get(query, done){
		JobMeta.GetModel();
		Model.find(query, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}
	// done (err, data)
	static Insert(slug, key, value, done=null){
		JobMeta.GetModel();
		var model = new Model({
			slug: slug,
			key: key,
			value: value
		});
		model.save(function(err, data){
			if (err && done) return done(err, null);
			if (done) return done(null, data);
		});
	}
	// done(err, success)
	static Update(query, value, done=null){
		JobMeta.GetModel();
		Model.update(query,{
			value: value
		},{
			upsert: false
		}, function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}
	static Delete(query, done=null){
		JobMeta.GetModel();
		Model.remove(query).exec().then( function(err, data){
			if (err && done) return done(err, false);
			if (data.ok > 0 && done) return done(null, true);
			if (done) return done(null, false);
		});
	}
}

module.exports = JobMeta;