var DBJobMeta = require('../models/JobMeta.js');
class JobMeta {
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.slug = infos.slug;
		this.key = infos.key;
		this.value = infos.value;
	}

	static GetOne(query, done){
		DBJobMeta.GetOne(query, function(err, dataJobMeta){
			if (err) return done(err, null);
			if (!dataJobMeta) return done(null, null);
			return done(null, new JobMeta({
				data: dataJobMeta,
				ID: dataJobMeta._id,
				slug: dataJobMeta.slug,
				key: dataJobMeta.key,
				value: dataJobMeta.value
			}));
		})
	}

	static Get(query, done){
		DBJobMeta.Get(query, function(err, dataJobMetas){
			if (err) return done(err, null);
			if (!dataJobMetas) return done(null, null);
			var results = [];
			dataJobMetas.forEach(function(dataJobMeta){
				results.push(new JobMeta({
					data: dataJobMeta,
					ID: dataJobMeta._id,
					slug: dataJobMeta.slug,
					key: dataJobMeta.key,
					value: dataJobMeta.value
				}))
			});
			return done(null, results);
		})
	}
	// done (err, data)
	static Insert(slug, key, value, done=null){
		DBJobMeta.Insert(slug, key, value, function(err, dataJobMeta){
			if (!done) return;
			if (err) return done(err, null);
			if (!dataJobMeta) return done(null, null);
			return done(null, new JobMeta({
				data: dataJobMeta,
				ID: dataJobMeta._id,
				slug: dataJobMeta.slug,
				key: dataJobMeta.key,
				value: dataJobMeta.value
			}));
		})
	}
	// done(err, success)
	static Update(query, value, done=null){
		DBJobMeta.Update(query, value, done);
	}
	static Delete(query, done=null){
		DBJobMeta.Delete(query, done);
	}
}

module.exports = JobMeta;