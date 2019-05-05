var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');

module.exports = app;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");
var router = express.Router();
var token = "";

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.email || !req.body.address) {
        res.json({success: false, message: 'Please pass email & address'});
    }
    else {
        var user = new User();
        user.email = req.body.email;
        user.address = req.body.address;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that email already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.email = req.body.email;
    userNew.address = req.body.address;
    userNew.password = req.body.password;

    User.findOne({ email: userNew.email }).select('email address password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, email: user.email,address:user.address};
                token = jwt.sign(userToken, process.env.SECRET_KEY,{expiresIn:18000});

                res.json({success: true,email:user.email ,token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

//mails to employee using User DB email info
/*
router.post('/mail', function(req, res){
if (!req.body.email) {
    res.json({success: false, message: 'Please pass email of employee'});
}
    User.findOne({email: req.body.email},function(err,user){
        if (err) res.send(err);
        //user.address;
        const msg = {
            to: req.body.empMail, //employee email
            from: 'memeinc@gmail.com',
            subject: 'Meme Assignment',
            text: 'Meme Assignment',
            html: user.address,
        };
        sgMail.send(msg);
        res.json({ success: true, message: 'notification sent to employee' });
    });

});
*/
//mails to employee using token, token is global var at the moment,
//didnt work when token passed in
router.post('/mail', function(req, res){
        var decoded = jwt.verify(token,process.env.SECRET_KEY);
        const msg = {
            to: req.body.empMail, //employee email
            from: 'memeinc@gmail.com',
            subject: 'Meme Assignment',
            text: 'Meme Assignment',
            html: decoded.address,
        };
        sgMail.send(msg);
        res.json({ success: true, message: 'notification sent to employee' });

});

app.use('/', router);
app.listen(process.env.PORT || 8080);
/*
const msg = {
    to: 'marknilov@yahoo.com',
    from: 'memeinc@gmail.com',
    subject: 'Meme Assignment',
    text: 'Meme Assignment',
    html: '<strong>meme delivery goes here</strong>',
};
sgMail.send(msg);
*/