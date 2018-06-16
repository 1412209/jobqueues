var Job = require("../../Job.js");

class FacebookGetPhotos extends Job {
	constructor(infos={}){
		super(infos);
		this.appID = '595872317415953';
	}
	// redirectAuthUrl: url chuyển tới để lấy dữ liệu
	// callbackUrl: url chuyển tới khi lấy dữ liệu hoàn tất
	getAuthUrl(callbackUrl) {
		var redirectAuthUrl = this.getRedirectAuthUrl();
		return "https://graph.facebook.com/oauth/authorize?"
		+"client_id="+this.appID
		+"&scope=user_photos,user_posts"
		+"&redirect_uri="+redirectAuthUrl
		+"&response_type=token,code"
		+"&type=web_server"
		+"&state="+callbackUrl;
	}
	// Lấy thông tin khi đang ở trang redirectAuthUrl
	// done(err, callbackUrl, null): Nếu lỗi
	// done(null, callbackUrl, null): Nếu không tìm thấy dữ liệu
	// done(null, callbackUrl, data): nếu tìm thấy dữ liệu cần thiết
	//		data {
	//			name: Tên tài khoản
	//			indentity: Dùng để xác định danh tính (thường để tránh trùng)
	//			authentications: object	// Các chứng thực cần thiết
	//			authenticationID: String // khóa để phân biệt các chứng thực khác cùng loại tài khoản (thường là id của tài khoản)
	//		}
	getAuthInfos(req, done){
		var request = require('request');
		var code = req.query.code;
		var callbackUrl = (req.query.state) ? req.query.state : null;
		var url = "https://graph.facebook.com/v2.12/oauth/access_token?"
			+"client_id="+this.appID
			+"&redirect_uri="+this.getRedirectAuthUrl()
			+"&client_secret=eb66d99ab7d0d9cf5cab544a122d96f7"
			+"&code="+code;
		getContent(url, function(err, data){
			if (err) return done(err, callbackUrl, null);
			if (!data) return done(null, callbackUrl, null);
			var access_token = data.access_token;
			var url = "https://graph.facebook.com/me?"
				+"&fields=id,name"
				+"&access_token="+access_token;
			getContent(url, function(err, data){
				if (err) return done(err, callbackUrl, null);
				if (!data) return done(null, callbackUrl, null);
				var name = "Facebook " + data.name;
				var indentity = data.name + " - " + data.id;
				var authentications = { token: access_token };
				var authenticationID = data.id;
				done(null, callbackUrl, {
					name: name,
					indentity: indentity,
					authentications: authentications,
					authenticationID: authenticationID
				})
			})
		})

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
	}
}

module.exports = FacebookGetPhotos;