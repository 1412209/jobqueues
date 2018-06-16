
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const bodyParser = require('body-parser');
const session = require('express-session');
const Passport = require('passport');
const app = express();

const Controller = require('./controller/Controller.js');

app.set('views', './views')
app.set('view engine', 'ejs');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(session({
	secret: 'scr',
	cookie: {
		maxAge: 1000*60*60*24
	}
}));
app.use(Passport.initialize());
app.use(Passport.session());

Controller.Init(app, function(){

	app.listen(3000, () => console.log('Example app listening on port 3000!'));
	// const httpsOptions = {
	// 	key: fs.readFileSync('./localhost-ssl/file.pem'),
	// 	cert: fs.readFileSync('./localhost-ssl/file.crt')
	// }

	// // Redirect http về https
	// http.createServer(function (req, res) {
	//     res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
	//     res.end();
	// }).listen(80, "127.0.0.5");

	// // Tạo server https với ip 127.0.0.5 và port 443 (port default https)
	// https.createServer(httpsOptions,app).listen(443, "127.0.0.5", () => {
	// 	console.log('Example app listening with https on ip 127.0.0.5 port 443!');
	// });
});

