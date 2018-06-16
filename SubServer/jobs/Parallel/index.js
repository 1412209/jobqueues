const Job = require("../../Job.js")
class Parallel extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}

	exec(done){
		var outputs = {
			"1": {},
			"2": {},
			"3": {}
		};
		return done(null, outputs);
	}
}

module.exports = Parallel;