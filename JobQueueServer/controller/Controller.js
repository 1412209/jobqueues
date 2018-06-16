var app = null;
var JobManager = require("./JobManager.js");
const User = require('./User.js');

class Controler {
	static GetApp(){
		return app;
	}
	static Init(_app, done=null) {
		app = _app;
		var DB = require('../models/DB.js');
		DB.Init(function(){
			// require("./JobChain.js").UpdateNode("5ade847bd142131878a49aa5", "5adead9bd430370db4d40d06", function(err, data){ console.log(data) })
			JobManager.LoadJobs(function(err, data){
				Controler.StartJobChainsActive();
				Controler.RoutingControler();
				if(done)done();
			});
		});
	}
	static RoutingControler(){
		var login = require('./routers/login.js');
		app.use("/", login);

		var auth = require('./routers/auth.js');
		app.use("/dashboard/auth", User.RequiredLogin, auth);

		var api_jobchain = require('./routers/api-jobchain.js');
		app.use("/api/jobchain", /*User.RequiredLogin,*/ api_jobchain);

		var dashboard = require('./routers/dashboard.js');
		app.use("/dashboard", User.RequiredLogin, dashboard);
		
		var defaultRouting = require('./routers/default.js');
		app.use("/", defaultRouting);
	}

	static StartJobChainsActive(done=null) {
		var JobChain = require('./JobChain.js');
		JobChain.StartJobChainsActive(done);
	}
}
module.exports = Controler;