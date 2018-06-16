const Job = require("../../Job.js")
const fs = require("fs");
const request = require('request');
const mime = require("mime-types");

class DropboxUploadImage extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs { path, fileUrl }
	// 		this.slug
	//	}
	constructor(infos){
		super(infos);
	}
	getFileName(){
		var date = new Date();
		return this.jobChainNodeID + "-" + date.yyyymmddms();
	}
	validInputs(){
		return this.inputs && this.inputs.fileUrl;
	}
	normalizePath(path){
		if (!path) return "";
		while(path.endsWith("/"))
			path = path.slice(0, path.length-1);
		while(path.startsWith("/"))
			path = path.slice(1, path.length-1);
		if (path != "") path = "/" + path;
		return path;
	}
	exec(done){
		var thisObject = this;
		if (!this.validInputs()){
			thisObject.log("error", "Unverified DropboxUploadImage", "Unverified custom fields DropboxUploadImage Job");
			return done(null, null);
		}
		this.inputs.path = this.normalizePath(this.inputs.path);

		var tmpPath = this.getTmpPath();

		var fileUploadUrl = this.inputs.fileUrl;

		var token = this.authentications.token;
		var dropboxPath = this.inputs.path;
		var fileName = this.getFileName();
		var extension = "";

		request({
			url: fileUploadUrl,
			method: "GET",
			headers: { "Content-Type": "application/octet-stream" }
		})
		.on('response', function(response) {
			extension = mime.extensions[response.headers['content-type']][0];
		})
		.pipe(fs.createWriteStream(tmpPath+"/"+fileName).on("close", (data) => {
			var options = {
				url: "https://content.dropboxapi.com/2/files/upload",
				method: 'POST',
				json: true,
				encoding: 'binary',
				headers: {
					"Authorization": "Bearer " + token,
					"Dropbox-API-Arg": '{ "path": "'+dropboxPath+"/"+fileName+"."+extension+'", "mode": {".tag":"add"}, "autorename": true, "mute": false}',
					"Content-Type": "application/octet-stream"
				}
			}
			fs.createReadStream(tmpPath+"/"+fileName).pipe(request(options, (err, res, data) => {
				if (err || !data || data.error){
					thisObject.log("error", "Image DropboxUploadImage", "Unable to get image from File upload Url");
					return done(null, null);
				}
				var outputs = {
					next: { dui_filename: data.name }
				};
				thisObject.log("info", "DropboxUploadImage", "Uploaded image to dropbox");
				return done(null, outputs);
			}).on("end", (data) => {
				fs.unlink(tmpPath+"/"+fileName, function(err){});
			}))
		} ));
	}
}

Date.prototype.yyyymmddms = function() {
	var mm = this.getMonth() + 1;
	var dd = this.getDate();
	var ms = (this.getTime()%1000).toString();
	ms = (ms.length < 2) ? "00" + ms : (ms.length < 3) ? "0" : ms;

	return [this.getFullYear(),
	(mm>9 ? '' : '0') + mm,
	(dd>9 ? '' : '0') + dd,
	ms
	].join('');
};

module.exports = DropboxUploadImage;