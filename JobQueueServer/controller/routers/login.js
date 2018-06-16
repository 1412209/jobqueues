var router = require("express").Router();
const Passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const PassportFacebook = require("passport-facebook").Strategy;
const PassportGoogle = require("passport-google-oauth").OAuth2Strategy;
const User = require('../User.js');
const async = require("async");

/**************************************************************/
/********************** PASSPORT LOCAL ************************/
router.route('/login')
.get((req, res, next) => { 
	if (req.isAuthenticated()) return res.redirect('/');
	req.session.redirect_uri = (req.query.redirect_uri) ? req.query.redirect_uri : "/";
	var signin = req.session.signin;
	var username = "";
	var message = "";
	if (signin){
		username = (signin.username) ? signin.username : username;
		message = signin.message ? signin.message : message;
	}
	res.locals.signin = {
		username: username,
		message: message
	}
	req.session.signin = null;
	res.render('customer/login');
})
// .post(Passport.authenticate('local', {failureRedirect: '/login',successRedirect: '/'}));
.post(function (req, res, next) {
	Passport.authenticate('local', function (err, user, info) {
		if (err) {
			return next(err)
		} else if (!user) { 
			var username = (req.body.username) ? req.body.username : "";
			var message = "Username or password is incorrect";
			req.session.signin = {
				username: username,
				message: message
			};
			return res.redirect('/login?redirect_uri=' + req.session.redirect_uri) 
		} else {
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return next();
			});
		}
	})(req, res, next);
}, function (req, res, next) {
	var redirect = req.session.redirect_uri;
	req.session.redirect_uri = "/";
	res.redirect(redirect); 
});

Passport.use(new LocalStrategy(
	(username, password, done) => {
		User.Login(username, password, (err, user) => {
			if (err) return done(err, false);
			if (user) return done(null, user);
			return done(null, false);
		});
	}
));
/********************** PASSPORT LOCAL ************************/
/**************************************************************/

/***********************************************************/
/********************** PASSPORT FB ************************/
router.get("/login/auth/fb", Passport.authenticate('facebook', { scope: ['email'] }));
router.get("/login/auth/fb/cb", (req, res, next) => {
	Passport.authenticate('facebook', function (err, user, info) {
		if (err) {
			return next(err)
		} else if (!user) { 
			return res.redirect('/login?redirect_uri=' + req.session.redirect_uri) 
		} else {
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return next();
			});
		}
	})(req, res, next);
}, function (req, res, next) {
	var redirect = req.session.redirect_uri;
	req.session.redirect_uri = "/";
	res.redirect(redirect); 
});
Passport.use(new PassportFacebook(
	{
		clientID: "595872317415953",
		clientSecret: "eb66d99ab7d0d9cf5cab544a122d96f7",
		callbackURL: "https://jobqueues.info/login/auth/fb/cb",
		// https://github.com/feathersjs/authentication-oauth2/issues/57
		profileFields: ['id', 'email', 'gender', 'birthday', 'displayName', 'photos' ] 
	},
	(accessToken, refreshToken, profile, done) => {
		var id = profile._json.id;
		var email = profile._json.email;
		var fullname = profile._json.name;
		var gender = profile._json.gender == "female" ? 0 : profile._json.gender == "male" ? 1 : -1;
		var dateOfBirth = profile._json.birthday ? new Date(profile._json.birthday) : null;
		var avatar = (profile._json && profile._json.picture && profile._json.picture.data && profile._json.picture.data.url) ? profile._json.picture.data.url : null;

		User.GetBySocialLogin({
			socialType: "facebook",
			accountID: id
		}, function(err, user){
			if (err) return done(err);
			if (user) return done(null, user);

			var infos = {
				socialType: 'facebook',
				accountID: id,
				fullname: fullname,
				email: email,
				gender: gender,
				dateOfBirth: dateOfBirth,
				avatar: avatar
			}
			User.AddSocail(infos, function(err, user){
				if (err) return done(err);
				if (user) return done(null, user);
				return done("error");
			})
		});
	}
));
/********************** PASSPORT FB ************************/
/***********************************************************/

/***********************************************************/
/********************** PASSPORT GG ************************/
router.get("/login/auth/gg", Passport.authenticate('google', {scope:["profile", "email"]}));
router.get("/login/auth/gg/cb", (req, res, next) => {
	Passport.authenticate('google', function (err, user, info) {
		if (err) {
			return next(err)
		} else if (!user) { 
			return res.redirect('/login?redirect_uri=' + req.session.redirect_uri) 
		} else {
			req.logIn(user, function (err) {
				if (err) {
					return next(err);
				}
				return next();
			});
		}
	})(req, res, next);
}, function (req, res, next) {
	var redirect = req.session.redirect_uri;
	req.session.redirect_uri = "/";
	res.redirect(redirect); 
});
Passport.use(new PassportGoogle(
	{
		clientID: "285919438443-liamkvvn62soun4hemu5iaseo23f3ii1.apps.googleusercontent.com",
		clientSecret: "th-2_K8f8KYYj1WXwXYrwgYF",
		callbackURL: "https://jobqueues.info/login/auth/gg/cb",
		profileFields: ['id', 'email', 'displayName', 'gender', 'birthday']
	},
	(accessToken, refreshToken, profile, done) => {
		var id = profile.id;
		var email = (profile.emails && profile.emails[0]) ? profile.emails[0].value : "";
		var fullname = profile.displayName;
		var gender = profile.gender == "female" ? 0 : profile.gender == "male" ? 1 : -1;
		// var dateOfBirth = profile._json.birthday ? new Date(profile._json.birthday) : null;
		var avatar = (profile._json && profile._json.image && profile._json.image.url) ? profile._json.image.url.substring(0, profile._json.image.url.length-2) + '300' : null;

		User.GetBySocialLogin({
			socialType: "google",
			accountID: id
		}, function(err, user){
			if (err) return done(err);
			if (user) return done(null, user);
			User.AddSocail({
				socialType: 'google',
				accountID: id,
				fullname: fullname,
				email: email,
				gender: gender,
				avatar: avatar
			}, function(err, user){
				if (err) return done(err);
				if (user) return done(null, user);
				return done("error");
			})
		});
	}
));
/********************** PASSPORT GG ************************/
/***********************************************************/

/***********************************************************/
/********************** SERIALIZE USER *********************/
Passport.serializeUser((user, done) => {
	done(null, user.ID);
});

Passport.deserializeUser((id, done) => {
	User.Get(id, function(err, user){
		if (err) return done(err, false);
		if (user) return done(null, user);
		return done(null, false);
	})
});
/********************** SERIALIZE USER *********************/
/***********************************************************/



router.get('/logout', (req, res, next) => {
	req.logout(); 
	res.redirect('/');
});

router.route('/signup')
.get((req, res, next) => {
	res.render('customer/sign-up');
})
.post((req, res, next) => {
	var fullname = req.body.fullname;
	var email = req.body.email;
	var username = req.body.username;
	var password = req.body.password;
	var confirm_password = req.body.confirm_password;

	var phone = req.body.phone;
	var dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : '';
	var gender = parseInt(req.body.gender);
	var address = req.body.address;
	if (password != confirm_password)
		return fail();
	async.parallel({
		verifyEmailExists: function(callback){
			User.VerifyEmailExists(email, function(err, success){
				callback(err, success);
			})
		},
		verifyUsernameExists: function(callback){
			User.VerifyUsernameExists(username, function(err, success){
				callback(err, success);
			})
		}
	}, function(err, results){
		if (err || !results.verifyEmailExists || !results.verifyUsernameExists)
			return fail();
		var data = {
			fullname: fullname,
			email: email,
			username: username,
			password: password,
			phone: phone,
			dateOfBirth: dateOfBirth,
			gender: gender,
			address: address
		}
		User.Add(data, function(err, user){
			if (err || !user)
				return fail();
			return success();
		})
	})
	function success (){
		res.redirect("/signup-success")
	}
	function fail (){
		res.redirect("/signup")
	}
})
router.get("/signup-success", (req, res, next) => {
	res.render('customer/sign-up-success');
})

router.get('/signup/email-validate', (req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	var email = req.query.email;
	User.VerifyEmailExists(email, function(err, success){
		res.send(JSON.stringify(!err && success));
	})
})
router.get('/signup/username-validate', (req, res, next) => {
	res.setHeader('Content-Type', 'application/json');
	var username = req.query.username;
	User.VerifyUsernameExists(username, function(err, success){
		res.send(JSON.stringify(!err && success));
	})

})


module.exports = router;
