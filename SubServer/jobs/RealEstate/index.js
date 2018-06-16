const Job = require("../../Job.js")
const request = require("request");
const cheerio = require('cheerio');

class RealEstate extends Job {
	//	{
	//		this.jobChainNodeID // { id, thông tin bổ sung }
	// 		this.authentications
	// 		this.inputs
	// 		this.slug
	//	}
	init(done){
		var thisObject = this;
		if (!this.inputs || !this.inputs.source) {
			thisObject.log("error", "Error RealEstate", "Unable to execute RealEstate");
			return done(null, {});
		}

		var inputs = this.inputs;
		if (inputs.source == "muabannhadat.vn"){
			this.crawlMBND(inputs['url_muabannhadat.vn'], function(err, data){
				if (err) return done(err, null);
				thisObject.addTmp(data);
			})
		}
	}
	exec(done){
		var thisObject = this;
		if (!this.inputs || !this.inputs.source) {
			thisObject.log("error", "Error RealEstate", "Unable to execute RealEstate");
			return done(null, null);
		}
		var inputs = this.inputs;

		if (inputs.source == "muabannhadat.vn"){
			this.crawlMBND(inputs['url_muabannhadat.vn'], function(err, data){
				if (err || !data) return done(null, null);
				thisObject.compareOldData(data, function(err, differences){
					if (err) return done(null, null);
					differences.forEach(function(difference){
						var outputs = {
							next: {
								name: difference.name,
								url: "http://www.muabannhadat.vn" + difference.url,
								price: difference.price
							}
						}
						thisObject.log("info", "RealEstate", "Got new property");
						done(null, outputs);
					});
					return;
				})
			});
		} else {
			thisObject.log("error", "Error RealEstate", "Input Source invalided");
			return done(null, null);
		}
	}

	// done(err, differences)
	compareOldData(datas, done){
		var thisObject = this;
		this.getTmp(function(err, oldDatas){
			if (err || !oldDatas){
				if (!oldDatas) thisObject.addTmp(datas);
				return done(null, []);
			}
			var results = [];
			datas.forEach(function(data){
				var oldData = oldDatas.find(function(oldData){
					return oldData.key == data.key;
				});
				if (oldData) return;
				results.push(data);
			});
			thisObject.updateTmp(datas);
			return done(null, results);
		})
	}
	// done(err, data)
	crawl(url, done){
		request(url, function (error, response, html) {
			if (!error && response.statusCode == 200) {
				if (!error && response.statusCode == 200) {
					var $ = cheerio.load(html);
					return done(null, $);
				} else {
					thisObject.log("error", "Error RealEstate", "Failed URL connection");
					return done(null, null);
				}
			}
		});
	}
	crawlMBND(url, done){
		if (url.toLowerCase().indexOf("muabannhadat.vn") == -1){
			thisObject.log("error", "Error RealEstate", "Input URL invalided");
			return done(null, null);
		}
		this.crawl(url, function(err, $){
			if (err || !$) return done(err, null);
			var infos = [];
			$(".list-group.result-list .listing-item").each(function(index, el) {
				var key = $(this).find(".resultItem").attr("rel");
				var name = $(this).find(".title-filter-link").text(); name = name ? name.replace(/[\n\r]+/g, '').trim() : "";
				var price = $(this).find(".listing-price").text();
				var url = $(this).find(".title-filter-link").attr('href');
				infos.push({
					key: key,
					name: name,
					price: price,
					url: url
				});
			});
			return done(null, infos);
		})
	}
}

module.exports = RealEstate;