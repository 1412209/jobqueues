const Job = require("../../Job.js")
const async = require("async");
const request = require("request");

class FacebookGetPhotos extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}
	constructor(infos){
		super(infos);
	}

	// Khởi tạo các tmp
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	init(done){
		var thisObject = this;
		thisObject.getPhotos(10, function(err, photos){
			if (err) return done(err, null);
			thisObject.addTmp(photos);
			return done(null, {});
		});
	}

	// Thực thi
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	exec(done){
		var thisObject = this;
		async.parallel({
			tmpData: function(callback){
				thisObject.getTmp(function(err, data){
					callback(err, data);
				})
			},
			newData: function(callback){
				thisObject.getPhotos(10, callback);
			}
		}, function(err, results){
			if (err) {
				thisObject.log("error", "Error FacebookGetPhoto", "Unable to get photos from Facebook");
			}
			var oldPhotos = results.tmpData;
			var newPhotos = results.newData;

			// thisObject.getImageUrlOfPhoto(newPhotos[0].id, function(err, data){
			// 		console.log(data);
			// 	});

			if (!newPhotos){
				thisObject.log("error", "Error FacebookGetPhoto", "Unable to get photos from Facebook");
				return done(null, null);
			}
			if (!oldPhotos){
				thisObject.addTmp(newPhotos);
				return done(null,null);
			}
			thisObject.updateTmp(newPhotos);

			for(var i = newPhotos.length-1; i>=0; i--){
				var newPhoto = newPhotos[i];
				var oldPhoto = oldPhotos.find(function(oldPhoto){
					return oldPhoto.id == newPhoto.id;
				});
				if (oldPhoto) continue;
				thisObject.getImageUrlOfPhoto(newPhoto.id, function(err, imageUrl){
					if (err){
						thisObject.log("error", "Error FacebookGetPhoto", "Unable to get photos from Facebook");
						return done(err, null);
					}
					if (!imageUrl){
						thisObject.log("error", "Error FacebookGetPhoto", "Unable to get photos from Facebook");
						return done(null, null);
					}
					var outputs = { "next": {imageUrl: imageUrl,imageID:newPhoto.id}};
					thisObject.log("info", "FacebookGetPhoto", "Got new facebook photo");
					done(null, outputs);
				});
			}
		})
	}

	// Lấy hình ảnh
	// done(null, outputs) nếu thành công
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	getPhotos(count, done){
		var token = this.authentications.token;
		var url = "https://graph.facebook.com/v2.12/me/photos/uploaded?"
			+"limit="+count
			+"&access_token="+token;
		getContent(url,function(err, data){
			if (err) return done(err, null);
			if (!data || !data.data) return done(err, null);
			var photosInfo = data.data;
			return done(null, photosInfo);
		});
	}
	getImageUrlOfPhoto(id, done){
		var token = this.authentications.token;
		var url = "https://graph.facebook.com/v2.12/"+id+"?"
			+"fields=images"
			+"&access_token="+token;
		getContent(url,function(err, data){
			if (err) return done(err, null);
			if (!data || !data.images || !data.images[0]) return done(err, null);
			var images = data.images;
			return done(null, images[0].source);
		});
	}
}
function getContent(url, done){
	request.get({
		url: url,
		json: true,
		headers: {'User-Agent': 'request'}
	}, (err, res, data) => {
		if (err) return done(err, null);
		if (res.statusCode !== 200) return done(null, null);
		return done(null, data);
	});
}

module.exports = FacebookGetPhotos;