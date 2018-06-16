var router = require("express").Router();
var User = require("../User.js");

router.get("/", (req, res, next) => {
	var user = req.user;
	var basicInfo = user.basicInfo ? user.basicInfo  : {};

	var email = basicInfo.email ? basicInfo.email : "";
	var fullname = basicInfo.fullname ? basicInfo.fullname : "";
	var dateOfBirth = basicInfo.dateOfBirth ? basicInfo.dateOfBirth : "";
	var gender = basicInfo.gender || basicInfo.gender==0 ? basicInfo.gender : -1;
	var address = basicInfo.address ? basicInfo.address : "";
	var phone = basicInfo.phone ? basicInfo.phone : "";
	var avatar = basicInfo.avatar ? basicInfo.avatar : "/images/default-avatar.png";
	var hasPass = user.loginInfo.loginType == "localLogin";

	res.locals.userInfo = {
		email: email,
		fullname: fullname,
		dateOfBirth: dateOfBirth,
		gender: gender,
		address: address,
		phone: phone,
		avatar: avatar,
		hasPass: hasPass,
	}

	res.render("dashboard/user");
});

router.put("/", (req, res, next) => {
	var userID = req.user.ID;
	var fullname = req.body.fullname;
	var email = req.body.email;
	var phone = req.body.phone;
	var dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : '';
	var gender = parseInt(req.body.gender);
	var address = req.body.address;
	User.UpdateBasicInfo(userID, {
		fullname: fullname,
		email: email,
		phone: phone,
		dateOfBirth: dateOfBirth,
		gender: gender,
		address: address
	}, function(err, success){
		res.setHeader('Content-Type', 'application/json');
		if (err || !success) return res.send(JSON.stringify({success: 0}));
		return res.send(JSON.stringify({success: 1}));
	})
})

router.put("/password", (req, res, next) => {
	var user = req.user;
	var oldpassword = req.body.oldpassword;
	var newpassword = req.body.newpassword;
	res.setHeader('Content-Type', 'application/json');

	if (!user.loginInfo || !user.loginInfo.localLogin || user.loginInfo.loginType != "localLogin"){
		return res.send(JSON.stringify({success: -1}));
	}
	var username = user.loginInfo.localLogin.username;
	User.Login(username, oldpassword, function(err, user){
		if (err) return res.send(JSON.stringify({success: -1}));
		if (!user) return res.send(JSON.stringify({success: 0}));
		User.ChangePass(user.ID, newpassword, function(err, success){
			if (err) return res.send(JSON.stringify({success: -1}));
			if (!success) return res.send(JSON.stringify({success: 0}));
			return res.send(JSON.stringify({success: 1}));
		})
	})
})

router.get("*", (req, res, next) => {
	res.redirect("/dashboard/user")
})
module.exports = router;