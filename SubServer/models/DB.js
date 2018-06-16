const mongoose = require ('mongoose')
// const connStr = 'mongodb://jobqueueserver:12345@ds255319.mlab.com:55319/jobqueueserver';
const connStr = 'mongodb://localhost:27017/jobqueueserver';
class DB {
	static get mongoose(){
		return mongoose;
	}
	static Init(callback) {
		DB.Connect(callback);
	}
	static Connect(done){
		console.log('Connecting to database. Please wait....');
		mongoose.connect(connStr);
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'Error when connection to MongoDB:'));
		db.once('open', function(){
			console.log('Connected to MongoDB do_an_web database!');
			done();
		});
	}
	static Close(done){
		mongoose.connection.close();
		done();
	}
}

module.exports = DB;