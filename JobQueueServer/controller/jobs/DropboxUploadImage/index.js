var Job = require("../../Job.js");

class DropboxUploadImage extends Job {
	constructor(infos={}){
		super(infos);
		this.appID = 'yzfxwmzyrh8vbv0';
		this.author_access_token = "eXpmeHdtenlyaDh2YnYwOm51bmFocTV3eTdmN3Qwbw==";
		this.client_secret = 'nunahq5wy7f7t0o';
	}
	// redirectAuthUrl: url chuyển tới để lấy dữ liệu
	// callbackUrl: url chuyển tới khi lấy dữ liệu hoàn tất
	getAuthUrl(callbackUrl) {
		var redirectAuthUrl = this.getRedirectAuthUrl();
		return "https://www.dropbox.com/oauth2/authorize?"
		+"client_id="+this.appID
		+"&redirect_uri="+redirectAuthUrl
		+"&response_type=code"
		+"&scope="
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
		var author_access_token = this.author_access_token;

		var request = require('request');
		var callbackUrl = req.query.state;
		var code = req.query.code;

		var dataString = "code="+code
			+"&grant_type=authorization_code"
			+"&redirect_uri="+this.getRedirectAuthUrl()
		var options = {
			url: 'https://api.dropboxapi.com/oauth2/token',
			method: 'POST',
			body: dataString,
			json: true,
			auth: {
				user: this.appID,
				pass: this.client_secret
			},
			headers: { "Content-Type": 'application/x-www-form-urlencoded' }
		}
		request(options, (err, res, data) => {
			if (err) return done(err, callbackUrl, null);
			if (res.statusCode !== 200) return done(null, callbackUrl, null);
			var token = data.access_token;
			var accountID = data.account_id;
			var tokenType = (data.token_type == "bearer") ? "Bearer" : data.token_type;

			var options = {
				url: "https://api.dropboxapi.com/2/users/get_current_account",
				method: 'POST',
				json: true,
				headers: {
					"Authorization": tokenType + " " + token
				}
			}
			request(options, (err, res, data) => {
				if (err) return done(err, callbackUrl, null);
				if (res.statusCode !== 200) return done(null, callbackUrl, null);
				var name = "Dropbox " + data.name.display_name;
				var indentity = data.name.display_name + " - " +data.email;
				var authInfos = {
					name: name,
					indentity: indentity,
					authentications: { token: token },
					authenticationID: accountID
				}
				done(null, callbackUrl, authInfos)
			})
		});
	}
}

module.exports = DropboxUploadImage;