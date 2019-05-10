var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var Customer = require('./Customers');
var Meme = require('./Memes');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use(cors());

var router = express.Router();

const GA_TRACKING_ID = process.env.GA_KEY;

function trackDimension(category, action, label, value, dimension, metric) {

    var options = { method: 'GET',
        url: 'https://www.google-analytics.com/collect',
        qs:
            {   // API Version.
                v: '1',
                // Tracking ID / Property ID.
                tid: GA_TRACKING_ID,
                // Random Client Identifier. Ideally, this should be a UUID that
                // is associated with particular user, device, or browser instance.
                cid: crypto.randomBytes(16).toString("hex"),
                // Event hit type.
                t: 'event',
                // Event category.
                ec: category,
                // Event action.
                ea: action,
                // Event label.
                el: label,
                // Event value.
                ev: value,
                // Custom Dimension
                cd1: dimension,
                // Custom Metric
                cm1: metric
            },
        headers:
            {  'Cache-Control': 'no-cache' } };

    return rp(options);
}

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

router.route('/movies')
    .get(authJwtController.isAuthenticated, function (req, res) {
        if (req.body.title){
            Movie.findOne({title:req.body.title},function(err, movie){
                if(err) res.send(err);
                    if(movie === null){
                        return res.json({ success: false, message: 'Movie not in Database' });
                    }
                if(req.query.reviews == "true"){
                    Review.find({movie:req.body.title},function(err,reviews) {
                        if (err) res.send(err);

                        return res.json({
                            movie: movie,
                            reviews: reviews
                        });
                    });
                }
                else res.json(movie)
            });
        }

        else {
            Movie.find(function (err, movies) {
                if (err) res.send(err);
                // return the users
                res.json(movies);
            });
        }
    });

router.route('/movies/:movieTitle')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var movieTitle = req.params.movieTitle;
        if (req.body.title){
            Movie.findOne({title:movieTitle},function(err, movie){
                if(err) res.send(err);
                if(movie === null){
                    return res.json({ success: false, message: 'Movie not in Database' });
                }
                if(req.query.review == "true"){
                    Review.find({movie:movieTitle},function(err,reviews) {
                        if (err) res.send(err);

                        return res.json({
                            movie: movie,
                            reviews: reviews
                        });
                    });
                }
                else res.json(movie)
            });
        }
        else
            return res.json(movie);


    });

router.route('/reviews')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Review.find(function (err, reviews) {
            if (err) res.send(err);
            // return the users
            res.json(reviews);
        });
    });


router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true,username:user.username ,token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});

router.get('/Movies', function(req,res){
    Movie.find({},function(err, Movies){
        if(!Movie)
            return res.json({ success: false, message: 'There are no movies in the database'});
        res.json({ status: 200, message: 'All Movies' });
});
});

router.post('/Movies',passport.authenticate('jwt',{session : false}),function(req,res){
    if (!req.body.title || !req.body.released || !req.body.genre) {
        res.json({success: false, message: 'Pass the title, year of release, and a specified genre'});
    }
    else {
        var movie = new Movie();
        movie.title = req.body.title;
        movie.released = req.body.released;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;
       // movie.actors.charName = req.body.actors;

        // save the movie
        movie.save(function(err) {
            if(err) return res.send(err);
            res.json({ success: true, message: 'Movie saved' });
        });
    }
});

router.put('/Movies',passport.authenticate('jwt',{session : false}),function(req,res){
    //var movie = new Movie();
   // movie.title = req.body.title;

    Movie.findOne({title:req.body.title},function(err,movie){
        if(err) res.send(err);

        movie.released = req.body.released;
        movie.genre = req.body.genre;
        movie.actors = req.body.actors;

        movie.save(function (err) {
            if (err) return res.send(err);
            res.json({success: true, message: 'Movie updated'});
        });
    });
});

router.delete('/Movies',passport.authenticate('jwt',{session : false}),function(req,res){
    Movie.findOne({title:req.body.title},function(err,movie) {
        if (err) res.send(err);

        movie.remove({title:req.body.title});
        res.json({success: true, message: 'Movie deleted'});
    });
});

router.get('/Reviews', function(req,res){
    Review.find({},function(err, Reviews){
        if(!Review)
            return res.json({ success: false, message: 'There are no reviews in the database'});
        res.json({ status: 200, message: 'All Reviews' });
    });
});

router.post('/Reviews',passport.authenticate('jwt',{session : false}),function(req,res) {
    Movie.findOne({title: req.body.movie},function(err,movie){
        if (err) res.send(err);
        if(movie === null){
            return res.json({success:false, message: "movie not found"});
        }
        if(movie.title !== req.body.movie){
            res.json({success:false, message: "movie not found"});
            console.log(movie.title);
        }
        else {

            var review = new Review();
            review.user = req.body.user;
            review.movie = req.body.movie;
            review.review = req.body.review;
            review.stars = req.body.stars;

            // save the movie
            review.save(function (err) {
                if (err) return res.send(err);
                res.json({success: true, message: 'Review posted'});
            });
        }
    });
});
//--------------------------------------------------------------------
//web api final new stuff
router.route('/Customers', function (req, res) {
        Customer.find(function (err, Customers) {
            if (err) res.send(err);
            // return the users
            res.json(Customers);
        });
    });

router.get('/Customers', function(req,res){
    Customer.find({},function(err, Customers){
        if(!Customer)
            return res.json({ success: false, message: 'There are no customers in the database'});
        res.json(Customers);
    });
});

router.post('/Customers', function(req, res) {
    if (!req.body.email || !req.body.address) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var customer = new Customer();
        customer.email = req.body.email;
        customer.address = req.body.address;
        customer.sendDirect = req.body.sendDirect;
        // save the user
        customer.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A customer with that email already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'customer created!' });
        });
    }
});


router.route('/Memes', function (req, res) {
        //one specific customer
        if (req.body.email){
            Customer.findOne({email:req.body.email},function(err, customer){
                if(err) res.send(err);
                if(customer === null){
                    return res.json({ success: false, message: 'customer not in Database' });
                }

                    Meme.find({userEmail:req.body.email},function(err,memes) {
                        if (err) res.send(err);

                        return res.json({
                            customer: customer,
                            meme: memes
                        });
                    });


            });
        }
        else
            return res.json(meme);


    });

router.post('/Memes', function(req, res) {

        var meme = new Meme();
        meme.url = req.body.url;
        meme.userEmail = req.body.userEmail;
        // save the user
        meme.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'something went wrong, meme not saved'});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'Meme stored!' });
        });

});

router.get('/Memes', function(req,res){
    if (req.body.email){
        Customer.findOne({email:req.body.email},function(err, customer){
            if(err) res.send(err);
            if(customer === null){
                return res.json({ success: false, message: 'customer not in Database' });
            }

            Meme.find({userEmail:req.body.email},function(err,memes) {
                if (err) res.send(err);

                return res.json({
                    customer: customer,
                    meme: memes
                });
            });


        });
    }
    else
        return res.json(meme);

});

/*
router.get('/OneMovie', function(req,res){
    Movie.findOne({title:req.body.title},function(err, movie){
        if(err) res.send(err);

        if(req.body.review){
            Review.find({movie:req.body.title},function(err,reviews) {
                if (err) res.send(err);

                return res.json({
                    movie: movie,
                    reviews: reviews
                });
            });
        }
        else res.json(movie)
    });
});
*/
app.use('/', router);
app.listen(process.env.PORT || 8080);