var listScheduleExec = {};	// {jobChainID: ISchedule}
var schedule = require('node-schedule');

class IntervalExec {
	// Thêm 1 thực thi
	static Add(jobChian, scheduleInfo){
		var id = jobChian.ID;
		if (listScheduleExec[id]) return;
		var Schedule = scheduleFactory[scheduleInfo.type];
		if (!Schedule) return;
		var infos = scheduleInfo[scheduleInfo.type];
		var fExec = (function(jobChian){
			jobChian.exec();
		}).bind(this, jobChian);

		var scheduleJob = new Schedule(infos, fExec);
		if (scheduleJob.exec())
			listScheduleExec[id] = scheduleJob;
	}
	// Dừng 1 thực thi
	static Remove(jobChainID){
		if (!listScheduleExec[jobChainID]) return;
		listScheduleExec[jobChainID].destroy();
		delete listScheduleExec[jobChainID];
	}
}

class ISchedule {
	constructor(infos, fExec){
		this.infos = infos;
		this.fExec = fExec;
	}
	exec(){ return false; }
	destroy() {  }
}
class ScheduleSeconds extends ISchedule {
	constructor(infos, fExec){
		super(infos, fExec);
		this.partTime = 999999; // 5s // 999999999
		this.timePass = 0;
		this.seconds = infos.seconds;
		this.interval = null;
	}
	exec(){
		var thisObj = this;
		var time = Math.min(this.partTime, this.seconds);

		thisObj.interval = setInterval(function(thisObj, time){
			thisObj.timePass += time;
			if (thisObj.timePass >= thisObj.seconds){
				thisObj.timePass = 0;
				thisObj.fExec();
			} else {
				thisObj.destroy();
				thisObj.exec();
			}
		}, time * 1000, this, time);
		return true;
	}
	destroy() {
		clearInterval(this.interval);
	}
}
class IScheduleRepeat extends ISchedule {
	constructor(infos, fExec){
		super(infos, fExec);
		this.schedule = null;
	}
	exec(){
		var scheduleString = this.getScheduleString();
		if (!scheduleString)
			return false;
		var thisObj = this;
		thisObj.schedule = schedule.scheduleJob(scheduleString, function(){
			thisObj.fExec();
		});
		return true;
	}
	getScheduleString(){
		return null;
	}
	destroy() {
		this.schedule.cancel();
	}
}

class ScheduleDaily extends IScheduleRepeat {
	constructor(infos, fExec){
		super(infos, fExec);
		this.time = (infos.time) ? infos.time : null; 
	}
	getScheduleString(){
		var time = getTime(this.time);
		if (!time) return null;
		var hour = time.hour;
		var minute = time.minute;

		var scheduleString = "0 ";
		scheduleString += minute + " " + hour + " * * *";
		return scheduleString;
	}
}
class ScheduleWeekly extends IScheduleRepeat {
	constructor(infos, fExec){
		super(infos, fExec);
		this.time = (infos.time) ? infos.time : null;
		this.week = infos.week;
	}
	getScheduleString(){
		var thisObj = this;

		var time = getTime(this.time);
		if (!time) return null;
		var hour = time.hour;
		var minute = time.minute;

		var scheduleString = "0 ";
		scheduleString += minute + " " + hour + " * * ";
		var dayOfWeek = "";
		var dayOfWeekKey = {
			monday: 1,
			tuesday: 2,
			wednesday: 3,
			thursday: 4,
			friday: 5,
			saturday: 6,
			sunday: 7
		}
		Object.keys(thisObj.week).forEach(function(key){
			if (thisObj.week[key] == 1 && dayOfWeekKey[key])
				if (dayOfWeek == "")
					dayOfWeek += dayOfWeekKey[key];
				else dayOfWeek += "," + dayOfWeekKey[key];
		});
		if (dayOfWeek == "")
			return null;
		scheduleString += dayOfWeek;
		return scheduleString;
	}
}
class ScheduleMonthly extends IScheduleRepeat {
	constructor(infos, fExec){
		super(infos, fExec);
		this.time = (infos.time) ? infos.time : null;
		this.day = (infos.day) ? infos.day : null;
	}
	getScheduleString(){
		var time = getTime(this.time);
		if (!time) return null;
		var hour = time.hour;
		var minute = time.minute;

		var scheduleString = "0 ";
		var day = getDay(this.day);
		if (!day) return null;
		scheduleString += minute + " " + hour + " " + day + " * *";
		return scheduleString;
	}
}
class ScheduleAnnual extends IScheduleRepeat {
	constructor(infos, fExec){
		super(infos, fExec);
		this.time = (infos.time) ? infos.time : null;
		this.day = (infos.day) ? infos.day : null;
		this.month = infos.month ? infos.month : null;
	}
	getScheduleString(){
		var time = getTime(this.time);
		if (!time) return null;
		var hour = time.hour;
		var minute = time.minute;

		var day = getDay(this.day);
		if (!day) return null;

		var month = getMonth(this.month);
		if (!month) return null;

		var scheduleString = "0 ";

		scheduleString += minute + " " + hour + " " + day + " " + month + " *";
		return scheduleString;
	}
}
class ScheduleOneTime extends IScheduleRepeat {
	constructor(infos, fExec){
		super(infos, fExec);
		this.time = (infos.time) ? infos.time : null;
		this.date = (infos.date) ? infos.date : null;
	}
	getScheduleString(){
		var time = getTime(this.time);
		if (!time) return null;
		var hour = time.hour;
		var minute = time.minute;

		var date = getDate(this.date);
		if (!date) return null;
		date.setHours(hour);
		date.setMinutes(minute);

		return date;
	}
}

function getTime(timeString){
	if (!timeString) return null;
	var hour = timeString.slice(0,2);
	var minute = timeString.slice(3,5);

	var regNumberOnly = new RegExp('^[0-9]+$');
	if (!regNumberOnly.test(minute) || !regNumberOnly.test(hour))
		return null;
	minute = parseInt(minute);
	hour = parseInt(hour);
	if (minute >= 60 || minute < 0 || hour >= 24 || hour < 0)
		return null;

	return {hour: hour, minute: minute}
}

function getDay(dayString){
	if (!dayString) return null;
	var regNumberOnly = new RegExp('^[0-9]+$');
	if (!regNumberOnly.test(dayString))
		return null;
	day = parseInt(dayString);
	if (day > 31 || day < 1)
		return null;
	return day;
}

function getMonth(monthString){
	if (!monthString) return null;
	var regNumberOnly = new RegExp('^[0-9]+$');
	if (!regNumberOnly.test(monthString))
		return null;
	month = parseInt(monthString);
	if (month > 12 || month < 1)
		return null;
	return month;
}

function getDate(dateString){
	if (!dateString) return null;
	var date = new Date(dateString);
	if (!date.getDate()) return null;
	return date;
}

var scheduleFactory = {
	repeat_seconds: ScheduleSeconds,
	repeat_daily: ScheduleDaily,
	repeat_weekly: ScheduleWeekly,
	repeat_monthly: ScheduleMonthly,
	repeat_annual: ScheduleAnnual,
	one_time: ScheduleOneTime,
	default: ScheduleSeconds
}

module.exports = IntervalExec;