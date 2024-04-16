/*
CSC3916 HW4
File: Server.js
Description: Web API scaffolding for Movie API
 */

var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObjectForMovieRequirement(req) {
    var json = {
        headers: "No headers",
        key: process.env.UNIQUE_KEY,
        body: "No body"
    };

    if (req.body != null) {
        json.body = req.body;
    }

    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please include both username and password to signup.'})
    } else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;

        user.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A user with that username already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Successfully created new user.'})
        });
    }
});

router.post('/signin', function (req, res) {
    var userNew = new User();
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
        if (err) {
            res.send(err);
        }

        user.comparePassword(userNew.password, function(isMatch) {
            if (isMatch) {
                var userToken = { id: user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json ({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed.'});
            }
        })
    })
});

router.route('/Reviews')
    .get(authJwtController.isAuthenticated, (req, res) => {

        if (!req.body.movieId) {
            return res.status(400).json({ success: false, msg: "Movie ID not provided."})
        }
    
        Review.findOne({ movieId: req.body.movieId }).exec(function(err, outReview) {
            if (err || outReview == null) {
                return res.status(404).json(err, "Review not found.");
            }

            res.status(200).json({success: true, msg: 'GET Review', review: outReview})
        });
    })
    .post(authJwtController.isAuthenticated, (req, res) => {
        
        if (!req.body.movieId) {
            return res.status(400).json({ success: false, msg: "Movie ID not provided."})
        }

        var review = new Review();
        review.movieId = req.body.movieId;
        review.username = req.body.username;
        review.review = req.body.review;
        review.rating = req.body.rating;

        Movie.find({ _id: req.body.movieId }).exec(function(err, outMovie) {
            if (err || outMovie == null) {
                return res.status(401).json(err, "Unable to create review.");
            }
        });

        review.save(function(err){
            if (err) {
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A review with that name already exists.'});
                else
                    return res.json(err);
            }

            res.json({success: true, msg: 'Review created!', review: review})
        });
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        // HTTP DELETE Method
        // Requires JWT authentication.
        // Returns a JSON object with status, message, headers, query, and env.
        var review = new Review();
        review.movieId = req.body.movieId;
        review.username = req.body.username;
        review.review = req.body.review;
        review.rating = req.body.rating;
    
        Review.findOneAndDelete({ movieId: review.movieId }).exec(function(err, outReview) {
            if (err) {
                return res.json(err);
            }
            res.json({success: true, msg: 'Review deleted', review: outReview})
        });
    })
    .all((req, res) => {
        // Any other HTTP Method
        // Returns a message stating that the HTTP method is unsupported.
        res.status(405).send({ message: 'HTTP method not supported.' });
    });

router.route('/movies')
    .get(authJwtController.isAuthenticated, (req, res) => {
        var movie = new Movie();
        movie.title = req.body.title;
        /*
        Movie.findOne({ title: movie.title }).exec(function(err, outMovie) {
            if (err || outMovie == null) {
                return res.status(401).json(err, "Movie not found.");
            }

            res.json({success: true, msg: 'GET movie', movie: outMovie})
        });
        */
        Movie.find({ title: movie.title }).exec(function (err, outMovie) {
            if (err || outMovie == null) {
                return res.status(404).json({ success: false, message: "Movie not found" });
            } 
            else if (req.query.reviews === "true") {
                Movie.aggregate([
                    {
                        $match: { _id: ObjectId(id) }
                    },
                    {
                        $lookup: {
                            from: "reviews",
                            localField: "_id",
                            foreignField: "movieId",
                            as: "movieReviews"
                        }
                    },
                    {
                      $addFields: {
                        avgRating: { $avg: '$movieReviews.rating' }
                      }
                    },
                    {
                      $sort: { avgRating: -1 }
                    }
                ]).exec(function (err, outReview) {
                    if (err) {
                        return res.status(404).json({ success: false, message: "Review not found" });
                    } else {
                        res.status(200).json({ success: true, message: "GET Review", outReview });
                    }
                });
            }
            else {
                res.status(200).json({ success: true, message: "GET Movie", outMovie });
            }
        });
    })
    .post(authJwtController.isAuthenticated, (req, res) => {
        if (!req.body.title || !req.body.genre || !req.body.actors) {
            res.json({success: false, msg: 'Please include the title, genre, and actors.'})
        } else {
            var movie = new Movie();
            movie.title = req.body.title;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            movie.releaseDate = req.body.releaseDate != null ? req.body.releaseDate : null;
    
            movie.save(function(err){
                if (err) {
                    if (err.code == 11000)
                        return res.json({ success: false, message: 'A movie with that name already exists.'});
                    else
                        return res.json(err);
                }
    
                res.json({success: true, msg: 'Movie saved', movie: movie.title})
            });
        }
    })
    .put(authJwtController.isAuthenticated, (req, res) => {
        // HTTP PUT Method
        // Requires JWT authentication.
        // Returns a JSON object with status, message, headers, query, and env.
        if (!req.body.title || !req.body.genre || !req.body.actors) {
            res.json({success: false, msg: 'Please include the title, genre, and actors.'})
        } else {
            var movie = new Movie();
            movie.title = req.body.title;
            movie.genre = req.body.genre;
            movie.actors = req.body.actors;
            movie.releaseDate = req.body.releaseDate;
    
            Movie.findOneAndUpdate({ title: movie.title}, {relaseDate: movie.releaseDate, genre: movie.genre, actors: movie.actors}).exec(function(err) {
                if (err) {
                    return res.json(err);
                }
    
                res.json({success: true, msg: 'Movie updated', movie: movie.title})
            });
        }
    })
    .delete(authJwtController.isAuthenticated, (req, res) => {
        // HTTP DELETE Method
        // Requires JWT authentication.
        // Returns a JSON object with status, message, headers, query, and env.

        var movie = new Movie();
            movie.title = req.body.title;
    
        Movie.findOneAndDelete({ title: movie.title }).exec(function(err, outMovie) {
            if (err) {
                return res.json(err);
            }
            res.json({success: true, msg: 'Movie deleted', movie: outMovie.title})
        });
    })
    .all((req, res) => {
        // Any other HTTP Method
        // Returns a message stating that the HTTP method is unsupported.
        res.status(405).send({ message: 'HTTP method not supported.' });
    });

router.route('/movies/:id')
    .get(authJwtController.isAuthenticated, (req, res) => {

        Movie.find({ _id: req.params.id }).exec(function (err, outMovie) {
            if (err || outMovie.legnth === 0) {
                return res.status(404).json({ success: false, message: "Movie not found" });
            } 
            else if (req.query.reviews === "true") {
                Movie.aggregate([
                    {
                        $match: { _id: ObjectId(id) }
                    },
                    {
                        $lookup: {
                            from: "reviews",
                            localField: "_id",
                            foreignField: "movieId",
                            as: "movieReviews"
                        }
                    },
                    {
                      $addFields: {
                        avgRating: { $avg: '$movieReviews.rating' }
                      }
                    },
                    {
                      $sort: { avgRating: -1 }
                    }
                ]).exec(function (err, outReview) {
                    if (err) {
                        return res.status(404).json({ success: false, message: "Review not found" });
                    } else {
                        res.status(200).json({ success: true, message: "GET Review", outReview });
                    }
                });
            }
            else {
                res.status(200).json({ success: true, message: "GET Movie", outMovie });
            }
        });
    });

app.use('/', router);
app.listen(process.env.PORT || 8080);
module.exports = app; // for testing only

