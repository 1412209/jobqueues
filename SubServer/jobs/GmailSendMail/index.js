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
		return this.authentications && this.authentications.token && this.inputs && this.inputs.mail_to && this.inputs.subject && this.inputs.content;
	}

	// Thực thi
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	exec(done){
		var thisObject = this;
		if (!this.validInputs()){
			thisObject.log("error", "Error GmailSendMail", "Unable to send gmail account");
			return done(null, null);
		}
		var client_id = '285919438443-liamkvvn62soun4hemu5iaseo23f3ii1.apps.googleusercontent.com';
		var client_secret = "th-2_K8f8KYYj1WXwXYrwgYF";
		var refresh_token = this.authentications.refresh_token;
		var token = this.authentications.token;	
		var mail_from = this.authentications.email;
		var mail_to = this.inputs.mail_to;
		var subject = this.inputs.subject;
		var text = this.inputs.text;
		var content = this.inputs.content;

		var mail = {
			from: mail_from,
			from_name: this.authentications.name,
			to: mail_to,
			subject: subject,
			text: text,
			html: content
		};

		var oauth2Client = new OAuth2Client(client_id, client_secret);
		oauth2Client.credentials.refresh_token = refresh_token;
		oauth2Client.refreshAccessToken(function(err, tokens){
			oauth2Client.credentials = tokens;
			sendMail(oauth2Client, mail, function(err, data){
				return done(null, {next:{}});
			});
		});
		function sendMail(auth, mail, done) {
			var gmail = google.gmail('v1');
			var payload = base64url(createMimeMessage_(mail));
			gmail.users.messages.send({
				auth: auth,
				userId: 'me',
				resource: { 
					raw: payload
				},
			}, function(err, response) {
				if (err || !response)
					thisObject.log("error", "Error GmailSendMail", "Unable to send gmail account");
				if (err)
					return done(err, null);
				thisObject.log("info", "GmailGetNewMail", "Sent a gmail");
				return done(null, response);
			});
		}
		function encode_(subject) {
			var enc_subject = base64url(subject, "utf8");
			return '=?utf-8?B?' + enc_subject + '?=';
		}
		function createMimeMessage_(msg) {

			var nl = "\n";
			var boundary = "__ctrlq_dot_org__";

			var mimeBody = [
			"From: "+encode_(msg.from_name)+"<"+msg.from+">",
			"To: <"+msg.to+">",
			"Subject: "+encode_(msg.subject), 
			"Content-Type: multipart/alternative; boundary=" + boundary + nl,
			"--" + boundary,
			"Content-Type: text/html; charset=UTF-8",
			"Content-Transfer-Encoding: base64" + nl,
			msg.html,
			];
			return mimeBody.join(nl);

		}
	}
}

module.exports = GmailSendMail;