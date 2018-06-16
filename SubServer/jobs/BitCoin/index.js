const Job = require("../../Job.js")
const request = require("request");

class BitCoin extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}

	// Thực thi
	// Với mỗi hình ảnh mới, done sẽ được gọi 1 lần
	// done(null, outputs) nếu thành công  (outputs theo nextAttribute)
	// done(null, null) nếu không thành công
	// done(err, null)	nếu lỗi
	exec(done){
		var delay = 1 * 60 * 60 * 1000; // 1 giờ
		var thisObject = this;
		if (!thisObject.inputs || !thisObject.inputs.type_of_cryptocurrencies){
			thisObject.log("error", "Error BitCoin", "type_of_cryptocurrencies invalid");
			return done(null, null);
		}
		var typeOfCryptocurrencies = thisObject.inputs.type_of_cryptocurrencies;
		var logic = thisObject.inputs.logic ? thisObject.inputs.logic : "and";
		var conditions = thisObject.inputs.conditions ? thisObject.inputs.conditions : [];

		var url = "https://api.coindesk.com/v1/bpi/currentprice/"+typeOfCryptocurrencies+".json";
		request(url, function(err, res, body){
			if (!err && res.statusCode == 200) {
				// try{
					var object = JSON.parse(body);
					var updated = object.time.updated;
					var rate = object.bpi.USD.rate_float;
					console.log(rate, updated);
					if (!thisObject.validate(rate)){ return done(null, null); }

					thisObject.getTmp(function(err, tmp){
						if (err) {
							thisObject.log("error", "Error BitCoin", "Unable to execute BitCoin");
							return done(null, null);
						}
						var time = (new Date()).getTime();
						if (!tmp) {
							thisObject.log("info", "BitCoin", "Executed Bitcon");
							thisObject.addTmp(time);
							return done(null, {next: {updated: updated, rate: rate}});
						}
						tmp = parseInt(tmp);
						if (time - delay > tmp){
							thisObject.log("info", "BitCoin", "Executed Bitcon");
							thisObject.updateTmp(time);
							return done(null, {next: {updated: updated, rate: rate}});
						}
						return done(null, null);
					})

				// } catch (err){
				// 	thisObject.log("error", "Error BitCoin", "Connection failed");
				// 	return done(err, null);
				// }
			} else {
				thisObject.log("error", "Error BitCoin", "Connection failed");
				return done(err, null);
			}
		})
	}
	validate(rate){
		var thisObject = this;
		var logic = thisObject.inputs.logic ? thisObject.inputs.logic : "and";
		var conditions = thisObject.inputs.conditions ? thisObject.inputs.conditions : [];

		var result = true;
		conditions.forEach(function(condition){
			if (!condition.value) return;
			var operator = condition.operator;
			var value = parseFloat(condition.value);
			if (logic == "or"){
				result = result || thisObject.compare(rate, operator, value);
			} else if (logic == "and"){
				result = result && thisObject.compare(rate, operator, value);
			} else {
				logic = "and";
				result = false;
			}
		})
		return result;
	}
	compare(param1, operator, param2){
		if (operator == "=")
			return param1 = param2;
		if (operator == ">")
			return param1 > param2;
		if (operator == "<")
			return param1 < param2;
		if (operator == ">=")
			return param1 >= param2;
		if (operator == "<=")
			return param1 <= param2;
		if (operator == "><")
			return param1 != param2;
		return false;
	}
}

module.exports = BitCoin;