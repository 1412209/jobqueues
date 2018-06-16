const Job = require("../../Job.js")
const base64url = require("base64url");
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');


class GmailSendMail extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}
	validInputs(inputs){
		return this.authentications && this.authentications.refresh_token;
	}

	// Khởi tạo các tmp
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	init(done){
		if (!this.validInputs()) return done(null, null);
		var client_id = '285919438443-liamkvvn62soun4hemu5iaseo23f3ii1.apps.googleusercontent.com';
		var client_secret = "th-2_K8f8KYYj1WXwXYrwgYF";
		var refresh_token = this.authentications.refresh_token;
		var token = this.authentications.token;
		var gmail = google.gmail('v1');

		var thisObject = this;

		var oauth2Client = new OAuth2Client(client_id, client_secret);
		oauth2Client.credentials.refresh_token = refresh_token;
		oauth2Client.refreshAccessToken(function(err, tokens){
			oauth2Client.credentials = tokens;
			gmail.users.messages.list({
				auth: oauth2Client,
				userId: 'me'
			}, function(err, response) {
				if (err) return done(err, null);
				var newMessages = response.data.messages;
				if (newMessages)
					thisObject.deleteTmp(function(err, success){
						thisObject.addTmp(newMessages);
					});
				return done(null, {});
			});
		});
	}

	// Thực thi
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	exec(done){
		var thisObject = this;
		if (!this.validInputs()){
			thisObject.log("error", "Unverified GmailGetNewMail", "Unverified custom fields GmailGetNewMail Job");
			return done(null, null);
		}
		var client_id = '285919438443-liamkvvn62soun4hemu5iaseo23f3ii1.apps.googleusercontent.com';
		var client_secret = "th-2_K8f8KYYj1WXwXYrwgYF";
		var refresh_token = this.authentications.refresh_token;
		var token = this.authentications.token;
		var thisObject = this;

		var oauth2Client = new OAuth2Client(client_id, client_secret);
		oauth2Client.credentials.refresh_token = refresh_token;
		oauth2Client.refreshAccessToken(function(err, tokens){
			oauth2Client.credentials = tokens;
			getNewMail(oauth2Client, function(err, data){
				return done(null, data);
			});
		});
		function getNewMail(auth, done) {
			var gmail = google.gmail('v1');
			gmail.users.messages.list({
				auth: auth,
				labelIds: "INBOX",
				userId: 'me'
			}, function(err, response) {
				if (err){
					thisObject.log("error", "Error GmailGetNewMail", "Unable to authentication gmail account");
					return done(err, null);
				}
				var newMessages = response.data.messages;
				thisObject.getTmp(function(err, data){
					thisObject.log("error", "Error GmailGetNewMail", "The system has a few problems");
					if (err) return done(err, null);
					var oldMessages = data;

					if (!newMessages){
						thisObject.log("error", "Error GmailGetNewMail", "Unable to get massages from Gmail");
						return done(null, null);
					}
					if (!oldMessages){
						thisObject.addTmp(newMessages);
						return done(null,null);
					}
					thisObject.updateTmp(newMessages);
					for(var i = newMessages.length-1; i>=0; i--){
						var newMessage = newMessages[i];
						var oldMessage = oldMessages.find(function(oldMessage){
							return oldMessage.id == newMessage.id;
						});
						if (oldMessage) continue;
						getMassageDetail(auth, newMessage.id, function(err, data){
							if (err || !data)
								thisObject.log("error", "Error GmailGetNewMail", "Unable to get massages detail from Gmail");
							if (err) return done(err, null);
							if (!data) return done(null, null);
							var outputs = { "next": {
								from: data.from,
								to: data.to,
								subject: data.subject,
								content: data.content
							}};
							thisObject.log("info", "GmailGetNewMail", "Got a new gmail");
							done(null, outputs);
						});
					}
				})
			});
		}
		function getMassageDetail(auth, msgID, done){
			var gmail = google.gmail('v1');
			gmail.users.messages.get({
				auth: auth,
				userId: "me",
				id: msgID
			}, function(err, response){
				if (err || response.status != 200) return done(err, null);
				var headers = response.data.payload.headers;
				var fromInfo = headers.find(function(header){
					return header.name.toLowerCase() == "from";
				})
				var from = (fromInfo) ? fromInfo.value : "";
				from = getEmail(from);

				var toInfo = headers.find(function(header){
					return header.name.toLowerCase() == "to";
				})
				var to = (toInfo) ? toInfo.value : "";
				to = getEmail(to);

				var subject = headers.find(function(header){
					return header.name.toLowerCase() == "subject";
				});
				subject = (subject) ? subject.value : "";

				var parts = response.data.payload.parts;
				var content = base64url.decode(parts[0].body.data)

				var data = {
					from: from,
					to: to,
					subject: subject,
					content: content
				}
				return done(null, data);
			})
		}
		function getEmail(str){
			var end = str.lastIndexOf(">");
			var start = str.lastIndexOf("<");
			if (end == -1 || start == -1)
				return "";
			return str.slice(start+1, end);
		}
	}
}

module.exports = GmailSendMail;