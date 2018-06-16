const DBJobTmp = require("./models/JobTmp.js");
class JobTmp {
	static Add(jobChainID, jobSlug, data, done=null){
		DBJobTmp.Add(jobChainID, jobSlug, data, done);
	}
	static UpdateData(jobChainID, data, done=null){
		DBJobTmp.UpdateData(jobChainID, data, done);
	}
	static GetData(jobChainID, done){
		DBJobTmp.GetData(jobChainID, done);
	}
	static Delete(jobChainID, done=null){
		DBJobTmp.Delete(jobChainID, done);
	}
}

module.exports = JobTmp;