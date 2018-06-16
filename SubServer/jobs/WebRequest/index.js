const Job = require("../../Job.js")
const request = require("request");
const base64url = require("base64url");

class WebRequest extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}

	exec(done){
		var thisObject = this;
		if (!this.inputs) {
			thisObject.log("error", "Error Web Request", "Unable to execute Web Request");
			return done(null, null);
		}
		var method = this.inputs.method.toLowerCase();
		var url = this.inputs.url;
		var authentication = this.inputs.authentication;
		var headers = this.inputs.headers;
		var parameters = getParameters(this.inputs.parameters);
		var argsAdvance = this.inputs.advances;

		var options = {
			method: method,
			url: url
		}

		if (authentication && authentication.length > 0)
			options.auth = {
				user: authentication[0].username,
				pass: authentication[0].password
			}

		if (headers && headers.length > 0){
			options.headers = {}
			headers.forEach(function(header){
				options.headers[header.name] = header.value;
			})
		}

		if (method == "get")
			options.qs = parameters;
		else if (method == "post" || method == "delete" || method == "put")
			options.form = parameters;
		
		if (argsAdvance && argsAdvance.length > 0)
			argsAdvance.forEach(function(arg){
				options[arg.name] = arg.value;
			})

		request(options, (err, res, data) => {
			if (err){
				thisObject.log("error", "Error Web Request", "Unable to execute Web Request");
				return done(err, null);
			}
			thisObject.log("info", "Web Request", "executed Web Request");
			var outputs = {next:{data:data}};
			return done(null, outputs);
		})

		// parameters [{name, value}]
		function getParameters(parameters){
			if (!parameters) return {};
			var result = {};
			parameters.forEach(function(parameter){
				result[parameter.name] = parameter.value;
			});
			return result;
		}
		function convertParameterToBody(parameters) {
			if (!parameters) return "";
			var result = "";
			var index = 0;
			var count = parameters.length;
			parameters.forEach(function(parameter){
				index ++;
				if (parameter.name == "") return;
				result += parameter.name + "=" + parameter.value;
				if (index != count)
					result += "&";
			});
			return result;
		}
	}
}

module.exports = WebRequest;