var DBCategory = require('../models/Category.js');
class Category {
	constructor(infos){
		this.data = infos.data;
		this.ID = infos.ID;
		this.name = infos.name;
		this.slug = infos.slug;
	}
	update(infos){
		var thisObject = this;
		Object.keys(infos).forEach(function(key){
			thisObject[key] = infos[key];
		});
	}

	// Thêm mới category
	// data { name, slug }
	// done(err, null) nếu lỗi
	// done(null, null) nếu thêm không thành công
	// done(null, category) nếu thêm thành công
	static Add(data, done){
		DBCategory.Add(data, function(err, data){
			if (err) return done(err, null);
			if (!data) return done(null, null);
			return done(null, new Category({
				data: data,
				ID: data._id,
				name: data.name,
				slug: data.slug
			}));
		})
	}

	// Lấy toàn bộ category
	// done(err, null): Lỗi
	// done(null, categories): nếu thành công
	//		categories: danh sách các category
	static GetAll(done){
		var categories = [];
		DBCategory.GetAll(function(err, dataCategories){
			if (err) return done(err, null);
			dataCategories.forEach(function(dataCategory){
				categories.push(new Category({
					data: dataCategory,
					name: dataCategory.name,
					slug: dataCategory.slug
				}));
			});
			done(null, categories);
		});
	}
}

module.exports = Category;