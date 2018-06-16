var fs = require("fs");
var clone = require('clone');
var JobMeta = require("./JobMeta.js");

class Job {
	constructor(infos){

	}

	setSlug(slug){
		this.slug = slug;
	}
	update(infos){
		var thisObject = this;
		Object.keys(infos).forEach(function(key){
			thisObject[key] = infos[key];
		});
	}
	increaseQuantityUsed(done=null){
		var thisObject = this;
		JobMeta.GetOne({slug: thisObject.slug, key: "quantity_used"}, function(err, jobMeta){
			if (err) return done(err, null);
			if (!jobMeta){
				JobMeta.Insert(thisObject.slug, "quantity_used", 1, function(err, data){
					if (!done) return;
					if (err) return done(err, null);
					return done(null, 1);
				});
			}
			else {
				var quantityUsed = parseInt(jobMeta.value) + 1;
				JobMeta.Update({
					slug: thisObject.slug,
					key: "quantity_used"
				}, quantityUsed,  function(err, success){
					if (!done) return;
					if (err) return done(err, null);
					return done(null, quantityUsed);
				})
			}
		});
	}
	loadBasicInfos(slug=null){
		slug = (slug) ? slug : this.slug;
		var buf = fs.readFileSync("./controller/jobs/"+slug+"/config.json", "utf8");
		var infos = JSON.parse(buf);
		infos.optionsAttributes = this.getOptionsAttributes(infos);
		this.update(infos);
	}
	getOptionsAttributes(infos){
		var optionsAttributesName = (!infos.optionsAttributesName) ? [] : infos.optionsAttributesName;

		// prefix
		var prefix = {
			"field_name": "prefix",
			"name": "Prefix",
			"type": "text"
		}

		// nexts
		var nextsFields = [];
		var nextsAttributes = (infos.nextsAttributes) ? infos.nextsAttributes : [];
		nextsAttributes.forEach(function(nextAttributes){
			var nextsField = {
				field_name: nextAttributes.field_name,
				name: nextAttributes.name,
				type: 'checkbox',
				value: 1
			}
			nextsFields.push(nextsField)
		})
		var nexts = {
			field_name: "nexts",
			name: "The next jobs are displayed",
			type: "group",
			fields: nextsFields
		}

		// intervalSeconds
		var intervalSeconds = {
			"field_name": "intervalSeconds",
			"name": "Repeat in seconds",
			"type": "number",
			value: 10,
			attributes: {
				min: 1
			}
		}
		// schedule
		var schedule = {
			field_name: "schedule",
			name: "Schedule",
			type: "group",
			fields: [
				{
					field_name: "type",
					name: "Repeat type",
					type: "select",
					choices: {
						"repeat_seconds": "Repeat in seconds",
						"repeat_daily": "Repeat daily",
						"repeat_weekly": "Repeat weekly",
						"repeat_monthly": "Repeat monthly",
						"repeat_annual": "Repeat annual",
						"one_time": "One Time"
					}
				},
				{
					field_name: "repeat_seconds",
					name: "Repeat in seconds",
					type: "group",
					fields: [
						{
							"field_name": "seconds",
							"name": "Seconds",
							"type": "number",
							value: 10,
							attributes: {
								min: 10
							}
						}
					],
					conditions: {
						"schedule.type": "repeat_seconds"
					}
				},
				{
					field_name: "repeat_daily",
					name: "Repeat daily",
					type: "group",
					fields: [
						{
							field_name: "time",
							name: "Time",
							type: "time",
							value: new Date().toLocaleTimeString(
								'en-US',
								{
									hour12: false, 
									hour: "numeric", 
									minute: "numeric"
								}
							)
						}
					],
					conditions: {
						"schedule.type": "repeat_daily"
					}
				},
				{
					field_name: "repeat_weekly",
					name: "Repeat weekly",
					type: "group",
					fields: [
						{
							field_name: "time",
							name: "Time",
							type: "time",
							value: new Date().toLocaleTimeString(
								'en-US',
								{
									hour12: false, 
									hour: "numeric", 
									minute: "numeric"
								}
							)
						},
						{
							field_name: "week",
							name: "Week",
							type: "group",
							fields: [
								{
									field_name: "monday",
									name: "Monday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "tuesday",
									name: "Tuesday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "wednesday",
									name: "Wednesday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "thursday",
									name: "Thursday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "friday",
									name: "Friday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "saturday",
									name: "Saturday",
									type: "checkbox",
									class: "col-sm-3"
								},
								{
									field_name: "sunday",
									name: "Sunday",
									type: "checkbox",
									class: "col-sm-3"
								}
							]
						}
					],
					conditions: {
						"schedule.type": "repeat_weekly"
					}
				},
				{
					field_name: "repeat_monthly",
					name: "Repeat monthly",
					type: "group",
					fields: [
						{
							field_name: "time",
							name: "Time",
							type: "time",
							value: new Date().toLocaleTimeString(
								'en-US',
								{
									hour12: false, 
									hour: "numeric", 
									minute: "numeric"
								}
							),
							class: "col-sm-6"
						},
						{
							field_name: "day",
							name: "Day",
							type: "number",
							value: function(){
								var today = new Date();
								return today.getDate();
							}(),
							attributes: {
								min: 1,
								max: 31
							},
							class: "col-sm-6"
						}
					],
					conditions: {
						"schedule.type": "repeat_monthly"
					}
				},
				{
					field_name: "repeat_annual",
					name: "Repeat annual",
					type: "group",
					fields: [
						{
							field_name: "time",
							name: "Time",
							type: "time",
							value: new Date().toLocaleTimeString(
								'en-US',
								{
									hour12: false, 
									hour: "numeric", 
									minute: "numeric"
								}
							),
							class: "col-sm-4"
						},
						{
							field_name: "day",
							name: "Day",
							type: "number",
							value: function(){
								var today = new Date();
								return today.getDate();
							}(),
							attributes: {
								min: 1,
								max: 31
							},
							class: "col-sm-4"
						},
						{
							field_name: "month",
							name: "Month",
							type: "select",
							value: function(){
								var today = new Date();
								return today.getMonth();
							}(),
							choices: {
								"1": "1",
								"2": "2",
								"3": "3",
								"4": "4",
								"5": "5",
								"6": "6",
								"7": "7",
								"8": "8",
								"9": "9",
								"10": "10",
								"11": "11",
								"12": "12"
							},
							class: "col-sm-4"
						}
					],
					conditions: {
						"schedule.type": "repeat_annual"
					}
				},
				{
					field_name: "one_time",
					name: "One Time",
					type: "group",
					fields: [
						{
							field_name: "time",
							name: "Time",
							type: "time",
							value: new Date().toLocaleTimeString(
								'en-US',
								{
									hour12: false, 
									hour: "numeric", 
									minute: "numeric"
								}
							),
							class: "col-sm-6"
						},
						{
							field_name: "date",
							name: "Date (mm/dd/yyyy)",
							type: "date",
							value: function(){
								var date = new Date();
								return date.toJSON().slice(0,10);
							}(),
							class: "col-sm-6"
						}
					],
					conditions: {
						"schedule.type": "one_time"
					}
				}
			]
		}

		// Data Fields
		var dataFields = {
			field_name: "dataFields",
			name: "Data Fields",
			type: "repeat",
			fields: [
				{
					field_name: "field_name",
					name: "Field key",
					type: "text",
					class: "col-sm-6"
				},
				{
					field_name: "name",
					name: "Name",
					type: "text",
					class: "col-sm-6"
				}
			]
		}

		function generateString(count){
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
			for (var i = 0; i < count; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));

			return text;

		}
		var jobKey = {
			field_name: "jobKey",
			name: "Job Key",
			type: "text",
			value: generateString(15)
		}

		// All options
		var allOptionsAttributes = {
			prefix: prefix,
			nexts: nexts,
			intervalSeconds: intervalSeconds,
			schedule: schedule,
			jobKey: jobKey,
			dataFields: dataFields
		}

		var optionsAttributes = [];
		optionsAttributesName.forEach(function(optionAttributesName){
			var optionAttributes = allOptionsAttributes[optionAttributesName];
			if (!optionAttributes) return;
			optionsAttributes.push(optionAttributes);
		})
		return optionsAttributes;
	}
	clone(){
		// var obj = Object.create(Object.getPrototypeOf(this));
		// obj = Object.assign(obj, this);
		var obj = clone(this);
		return obj;
	}
	getIconPath(){
		var fs = require('fs');
		var path = "./controller/jobs/"+this.slug+"/icon.png";
		if (fs.existsSync(path))
			return path;
		return "./controller/job-default/icon.png";
	}
	getIconUrl(){
		return "/job/icon/" + this.slug;
	}
	getAuthUrl(callbackUrl) {
		var redirectAuthUrl = this.getRedirectAuthUrl();
		return "#";
	}
	getRedirectAuthUrl(){
		return "https://jobqueues.info/dashboard/auth/add/" + this.slug;
	}
}

module.exports = Job;