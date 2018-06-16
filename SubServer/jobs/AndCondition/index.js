const Job = require("../../Job.js")
class TriggerAnd extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}

	exec(done){
		if (!this.inputs || !this.inputs.conditions)
			return done(null, null);
		var result = true;
		var thisObj = this;
		this.inputs.conditions.forEach(function(input){
			result = result && thisObj.compare(input.variable, input.operator, input.value);
		})
		var outputs = {};
		if (result)
			outputs['yes'] = {};
		else outputs['no'] = {};
		outputs['complete'] = { field_name: (result ? 1 : 0) };
		return done(null, outputs);
	}
	compare(variable, operator, value){
		switch(operator){
			case "equals": return variable.toString() == value.toString();
			case "containers": return variable.indexOf(value) != -1;
			case "startsWith": return variable.startsWith(value);
			case "endsWith": return variable.endsWith(value);
			case "not_equals": return variable.toString() != value.toString();
			case "not_containers": return variable.indexOf(value) == -1;
			case "not_startsWith": return !variable.startsWith(value);
			case "not_endsWith": return !variable.endsWith(value);
			default: return false;
		}
	}
}

module.exports = TriggerAnd;