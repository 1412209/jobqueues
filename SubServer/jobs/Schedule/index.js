const Job = require("../../Job.js")
class Schedule extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}

	exec(done){
		var outputs = {next:{}};
		this.log("info", "Schedule", "Executed schedule");
		return done(null, outputs);
	}
}

module.exports = Schedule;