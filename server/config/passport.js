'use strict';
// load all the things we need
var LocalStrategy = require('passport-local').Strategy,
    FacebookStrategy = require('passport-facebook').Strategy,
    GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
    configAuth = require('./auth'),
    logger = require('winston');


var mongoose = require('mongoose');

// load up the user model
var User = mongoose.model('User');
var Role = mongoose.model('Role');
module.exports = function (passport) {

    // =========================================================================
    // passport session setup ==================================================
    // =========================================================================
    // required for persistent login sessions
    // passport needs ability to serialize and unserialize users out of session

    // used to serialize the user for the session
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    // used to deserialize the user
    passport.deserializeUser(function (id, done) {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    });

    // =========================================================================
    // LOCAL SIGNUP ============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-signup', new LocalStrategy({
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, username, password, done) {
            // asynchronous
            // User.findOne wont fire unless data is sent back
            process.nextTick(function () {
                // find a user whose email is the same as the forms email
                // we are checking to see if the user trying to login already exists
                User.findOne({'local.username': req.body.username}, function (err, user) {
                    // if there are any errors, return the error
                    if (err) {
                        return done(err);
                    }

                    // check to see if theres already a user with that email
                    if (user) {
                        return done({message: 'That username is already taken.'});
                    } else {
                        // if there is no user with that email
                        // create the user
                        var newUser = new User();

                        newUser.local.username = req.body.username;
                        newUser.local.email = req.body.email;
                        newUser.local.password = newUser.generateHash(req.body.password);
                        Role.findOne({name: 'user'}).exec(function (err, role) {
                            if (err) {
                                return done(err);
                            }
                            if (!role) {
                                return done({message: 'Role user not found'});
                            }
                            // save the user
                            newUser.role = role;
                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, newUser);
                            });
                        });


                    }

                });

            });

        }));
    // =========================================================================
    // LOCAL LOGIN =============================================================
    // =========================================================================
    // we are using named strategies since we have one for login and one for signup
    // by default, if there was no name, it would just be called 'local'

    passport.use('local-login', new LocalStrategy({
            passReqToCallback: true // allows us to pass back the entire request to the callback
        },
        function (req, email, password, done) { // callback with email and password from our form

            // find a user whose email is the same as the forms email
            // we are checking to see if the user trying to login already exists
            User.findOne({'local.username': req.body.username}, function (err, user) {
                // if there are any errors, return the error before anything else
                if (err) {
                    return done(err);
                } else
                // if no user is found, return the message
                if (!user) {
                    return done({message: 'User does not exist.'}); // req.flash is the way to set flashdata using connect-flash
                } else
                // if the user is found but the password is wrong
                if (!user.validPassword(password)) {
                    return done({message: 'Invalid Password.'}); // create the loginMessage and save it to session as flashdata
                } else {
                    // all is well, return successful user
                    return done(null, user);
                }
            });

        }));

    passport.use(new FacebookStrategy({
            clientID: configAuth.facebookAuth.clientID,
            clientSecret: configAuth.facebookAuth.clientSecret,
            callbackURL: configAuth.facebookAuth.callbackURL
        },
        function (accessToken, refreshToken, profile, done) {
            process.nextTick(function () {
                User.findOne({'facebook.id': profile.id}, function (err, user) {
                    // if there is an error, stop everything and return that
                    // ie an error connecting to the database
                    if (err) {
                        return done(err);
                    }

                    // if the user is found, then log them in
                    if (user) {
                        return done(null, user); // user found, return that user
                    } else {
                        // if there is no user found with that facebook id, create them
                        var newUser = new User();

                        // set all of the facebook information in our user model
                        newUser.facebook.id = profile.id; // set the users facebook id
                        newUser.facebook.token = accessToken; // we will save the token that facebook provides to the user
                        newUser.facebook.name = profile.name.givenName + ' ' + profile.name.familyName; // look at the passport user profile to see how names are returned

                        if (profile.emails && profile.emails.length > 0) {
                            newUser.facebook.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first
                        } else {
                            logger.error('no facebook email', profile);
                        }

                        Role.findOne({name: 'user'}).exec(function (err, role) {
                            if (err) {
                                return done(err);
                            }
                            if (!role) {
                                return done({message: 'Role user not found'});
                            }
                            // save the user
                            newUser.role = role;
                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, newUser);
                            });
                        });
                    }

                });
            });
        }
    ));

    passport.use(new GoogleStrategy({
            clientID: configAuth.googleAuth.clientID,
            clientSecret: configAuth.googleAuth.clientSecret,
            callbackURL: configAuth.googleAuth.callbackURL
        },
        function (token, refreshToken, profile, done) {

            // make the code asynchronous
            // User.findOne won't fire until we have all our data back from Google
            process.nextTick(function () {

                // try to find the user based on their google id
                User.findOne({'google.id': profile.id}, function (err, user) {
                    if (err)
                        return done(err);

                    if (user) {

                        // if a user is found, log them in
                        return done(null, user);
                    } else {
                        // if the user isnt in our database, create a new user
                        var newUser = new User();

                        // set all of the relevant information
                        newUser.google.id = profile.id;
                        newUser.google.token = token;
                        newUser.google.name = profile.displayName;
                        if (profile.emails && profile.emails.length > 0) {
                            newUser.google.email = profile.emails[0].value; // pull the first email
                        } else {
                            logger.error('no google email', profile);
                        }
                        newUser.google.picture = profile._json.picture;
                        Role.findOne({name: 'user'}).exec(function (err, role) {
                            if (err) {
                                return done(err);
                            }
                            if (!role) {
                                return done({message: 'Role user not found'});
                            }
                            // save the user
                            newUser.role = role;
                            newUser.save(function (err) {
                                if (err) {
                                    return done(err);
                                }
                                return done(null, newUser);
                            });
                        });
                    }
                });
            });

        }));

};

