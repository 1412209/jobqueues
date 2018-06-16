const Job = require("../../Job.js")
const request = require("request");
const base64url = require("base64url");

class Schedule extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	//		this.dataFields
	// 		this.inputs
	// 		this.slug
	//	}

	exec(done){
		var thisObject = this;
		if (!this.inputs) {
			thisObject.log("error", "Error Webhooks", "Unable to execute webhook");
			return done(null, null);
		}
		var dataFields = this.dataFields;
		var inputs = this.inputs;
		var body = inputs.body;
		var outputs = {next:{}};
		dataFields.forEach(function(dataField){
			if (body[dataField])
				outputs.next[dataField] = body[dataField];
		})
		thisObject.log("info", "Webhooks", "executed Webhooks");
		return done(null, outputs);
	}
}

module.exports = Schedule;