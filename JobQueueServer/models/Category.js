var DB = require('./DB.js');
var Model = null;
class Category{
	static GetModel(){
		if (Model != null)
			return Model;
		var schema = DB.mongoose.Schema({
			name: String,
			slug: String	// Định danh cho Category
		});
		Model = DB.mongoose.model('category', schema);
		return Model;
	}

	/*
	*	Thêm mới
	*	data = {
	*		name: tên category
	*		slug: định danh cho Category
	*	}
	*	done(err, null) Nếu lỗi
	*	done(null, category) Nếu thành công
	*	done(null, null) Nếu tên user đã trùng => không thành công
	*/
	static Add(data, done=null){
		Category.GetModel();
		Category.VerifyCategoryExists(data.slug, function(err, isExists){
			if (err && done) return done(err, null);
			if (isExists && done) return done(null, null);
			var model = new Model({
				name: data.name,
				slug: data.slug
			});
			model.save(function(err, data){
				if (err && done) return done(err, null);
				if (done) return done(null, data);
			});
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

	// Lấy thông tin category dựa vào slug
	// done(err, null): lỗi
	// done(null, null): không có category
	// done(null, categories): nếu tìm thấy category
	static GetBySlug(slug, done){
		Category.GetModel();
		Model.findOne({ slug: slug }, function(err, data){
			if (err) return done(err, null);
			if (data) return done(null, data);
			return done(null, null);
		});
	}

	// Lấy toàn bộ category
	// done(err, null): Lỗi
	// done(null, categories): nếu thành công
	//		categories: danh sách các category
	static GetAll(done){
		Category.GetModel();
		Model.find({}, function(err, data){
			if (err) return data(err, null);
			data = (data) ? data : [];
			return done(null, data);
		});
	}

	// Kiểm tra Category đã tồn tại chưa
	// done(null,true): Nếu category tồn tại
	// done(null,false): Nếu category không tồn tại
	// done(err,false): Nếu lỗi
	static VerifyCategoryExists(slug, done){
		Category.GetModel();
		Category.GetBySlug(slug, function(err, data){
			data = !!data;
			return done(err, data);
		});
	}
}

module.exports = Category;