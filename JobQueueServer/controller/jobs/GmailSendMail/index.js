var Job = require("../../Job.js");

class GmailSendMail extends Job {
	constructor(infos={}){
		super(infos);
		this.appID = '285919438443-liamkvvn62soun4hemu5iaseo23f3ii1.apps.googleusercontent.com';
		this.client_secret = "th-2_K8f8KYYj1WXwXYrwgYF";
	}
	// redirectAuthUrl: url chuyển tới để lấy dữ liệu
	// callbackUrl: url chuyển tới khi lấy dữ liệu hoàn tất
	getAuthUrl(callbackUrl) {
		var redirectAuthUrl = this.getRedirectAuthUrl();
		return "https://accounts.google.com/o/oauth2/v2/auth?"
		+"client_id="+this.appID
		+"&scope=https://mail.google.com/ "
			+"https://www.googleapis.com/auth/gmail.compose "
			+"https://www.googleapis.com/auth/gmail.modify "
			+"https://www.googleapis.com/auth/gmail.send "
			+"https://www.googleapis.com/auth/userinfo.email "
			+"https://www.googleapis.com/auth/userinfo.profile "
		+"&redirect_uri="+redirectAuthUrl
		+"&response_type=code"
		+"&access_type=offline"
		+"&prompt=consent"
		+"&include_granted_scopes=true"
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
		var dataString = "code="+code
			+"&grant_type=authorization_code"
			+"&approval_prompt=force"
			+"&redirect_uri="+this.getRedirectAuthUrl()
		var options = {
			url: 'https://www.googleapis.com/oauth2/v4/token',
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
			var token_type = data.token_type;
			var refresh_token = data.refresh_token;

			var accountID = data.account_id;

			var options = {
				url: "https://www.googleapis.com/plus/v1/people/me?access_token=" + token,
				method: 'GET',
				json: true
			}
			request(options, (err, res, data) => {
				if (err) return done(err, callbackUrl, null);
				if (res.statusCode !== 200) return done(null, callbackUrl, null);
				var accountID = data.id;
				var name = "Gmail " + data.displayName;
				var indentity = data.displayName + " - " +data.emails[0].value;
				var authInfos = {
					name: name,
					indentity: indentity,
					authentications: { token: token, refresh_token: refresh_token, token_type: token_type, email: data.emails[0].value, name: data.displayName },
					authenticationID: accountID
				}
				done(null, callbackUrl, authInfos)
			})
		});
	}

}

module.exports = GmailSendMail;