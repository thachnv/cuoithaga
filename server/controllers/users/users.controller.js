'use strict';

var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Post = mongoose.model('Post'),
    passport = require('passport'),
    Role = mongoose.model('Role'),
    logger = require('winston');

/**
 * Private methods
 */
function getClientIp(req){
    return (req.headers['x-forwarded-for'] || '').split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

/**
 * check root user
 */
exports.isRoot = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }
    return res.send(createResponseObj(RES_STATUS.ERROR, 'You are not root user'));
};
exports.blockSignup = function(req, res){
    return handleError({message: 'Sign up function currently not available'}, res);
};
/**
 * Sign up
 */
exports.signUp = function (req, res, next) {
    passport.authenticate('local-signup', function (err, user) {

        if (err) {
            logger.error(err);
            return handleError(err, res);
        }

        if (!user) {
            return handleError({message: 'Bad request'}, res);
        }

        req.login(user, function (err) {
            if (err) {
                return res.send(global.createResponseObj(GLOBAL.RES_STATUS.ERROR, err.message));
            }

            req.session.logged_with = 'local';
            res.send(global.createResponseObj(GLOBAL.RES_STATUS.SUCCESS));
        });

    })(req, res, next);
};
exports.localLogin = function (req, res, next) {

    passport.authenticate('local-login', function (err, user) {
        if (err) {
            handleError(err, res);
        }
        if (user) {

            req.login(user, function (err) {
                if (err) {
                    handleError(err, res);
                }

                user.updateIpHistory(getClientIp(req));
                user.save();

                req.session.logged_with = 'local';
                return res.redirect('/api/profile');
            });
        }

    })(req, res, next);
};

exports.logOut = function (req, res) {
    req.logout();
    res.send(global.createResponseObj(GLOBAL.RES_STATUS.SUCCESS));
};

exports.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    return handleError({message: 'You are not logged in yet', code: 401}, res);
};

exports.getCurrentUser = function (req, res) {
    var _id = req.user._id;

    User.findById(_id)
        .populate('role', 'name')
        .exec(function (err, user) {
            if (err) {
                return handleError(err, res);
            }

            if (!user) {
                return handleError({message: 'User not found'}, res);
            }

            var resData = {
                info: {
                    _id: user._id,
                    facebook: {
                        //email: user.facebook.email,
                        id: user.facebook.id,
                        name: user.facebook.name,
                        token: user.facebook.token
                    },
                    local: {
                        username: user.local.username,
                        email: user.local.email
                    },
                    google: {
                        id: user.google.id,
                        name: user.google.name,
                        token: user.google.token,
                        picture: user.google.picture
                    },
                    role: user.role,
                    root: user.isRoot,
                    followingPosts: user.followingPosts,
                    logged_with: req.session.logged_with
                }
            };
            res.send(global.createResponseObj(GLOBAL.RES_STATUS.SUCCESS, null, resData));
        });
};

exports.facebookLogin = function (req, res, next) {
    passport.authenticate('facebook', function (err, user) {
        if (err) {
            return res.redirect('/');
        }

        if (!user) {
            return res.redirect('/');
        }

        req.login(user, function (err) {

            if (err) {
                return res.redirect('/');
            }

            user.updateIpHistory(getClientIp(req));
            user.save();

            req.session.logged_with = 'facebook';

            return res.redirect('/');
        });

    })(req, res, next);
};
exports.googleLogin = function (req, res, next) {
    passport.authenticate('google', function (err, user) {

        if (err) {
            return res.redirect('/');
        }

        if (!user) {
            return res.redirect('/');
        }

        req.login(user, function (err) {

            if (err) {
                return res.redirect('/');
            }

            user.updateIpHistory(getClientIp(req));
            user.save();

            req.session.logged_with = 'google';

            return res.redirect('/');
        });

    })(req, res, next);
};

exports.getTopUsers = function (req, res) {
    var top = req.params.top;
    User.find({})
        .sort({rating: -1})
        .limit(top)
        .exec(function (err, users) {
            if (err) {
                return handleError(err, res);
            }

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, users));
        });
};
/**
 * Check Permissions view all users
 */
function checkReadPermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknow role'});
        }

        if (role.havePermission('user', 'read')) {
            return next();
        }

        return handleError({message: 'You do not have this permission', code: 403}, res);
    });
}
/**
 * Check Permissions update a user
 */
function checkUpdatePermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('user', 'update')) {
            return next();
        }

        return handleError({message: 'You do not have this permission', code: 403}, res);
    });
}
/**
 * Check Permissions create a user
 */
function checkCreatePermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('user', 'create')) {
            return next();
        }

        return handleError({message: 'You do not have "Create User" permission', code: 403}, res);
    });
}
/**
 * Check Permissions delete a user
 */
function checkDeletePermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('user', 'delete')) {
            return next();
        }

        return handleError({message: 'You do not have "Delete User" permission', code: 403}, res);
    });
}

function deleteById(req, res) {
    User.findByIdAndRemove(req.params.id, function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'User not found', code: 404}, res);
        }
        return res.send(createResponseObj(RES_STATUS.SUCCESS, null));
    });
}

function createUser(req, res) {
    var displayName = req.body.displayName;
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    if (!displayName || !username || !password || !email) {
        return handleError({message: 'Bad request', code: 400}, res);
    }
    var newUser = new User();

    newUser.local.name = displayName;
    newUser.local.username = username;
    newUser.local.password = newUser.generateHash(password);
    newUser.local.email = email;

    Role.findOne({name: 'user'}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }
        if (!role) {
            return handleError({message: 'Base role: "user" not found', code: 404}, res);
        }
        // save the user
        newUser.role = role;
        newUser.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null));
        });
    });
}

function getAllUsers(req, res) {
    User.find({})
        .populate('role')
        .exec(function (err, users) {
            if (err) {
                return handleError(err, res);
            }

            res.send(global.createResponseObj(GLOBAL.RES_STATUS.SUCCESS, null, users));
        });
}

function followPost(req, res) {
    var currentUser = req.user;
    var postId = req.params.postId;
    Post.findById(postId).exec(function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'Post not found'}, res);
        }

        for (var i = 0, len = currentUser.followingPosts.length; i < len; i++) {
            if (currentUser.followingPosts[i].equals(post._id)) {
                return handleError({message: 'You followed this post'}, res);
            }
        }

        currentUser.followingPosts.push(post._id);
        currentUser.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null));
        });

    });
}

function unFollowPost(req, res) {
    var currentUser = req.user;
    var postId = req.params.postId;
    Post.findById(postId).exec(function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'Post not found'}, res);
        }

        for (var i = 0, len = currentUser.followingPosts.length; i < len; i++) {
            if (currentUser.followingPosts[i].equals(post._id)) {
                currentUser.followingPosts.splice(i, 1);
                break;
            }
        }

        currentUser.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            return res.send(createResponseObj(RES_STATUS.SUCCESS, null));
        });
    });
}

function updateById(req, res) {

    User.findById(req.body._id).exec(function (err, user) {
        if (err) {
            return handleError(err, res);
        }
        if (!user) {
            return handleError({message: 'User not found'});
        }

        user.role = req.body.role;

        if (req.body.local) {
            user.local.email = req.body.local.email;
            user.local.name = req.body.local.name;
            user.local.username = req.body.local.username;
        }

        user.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.send('update successful');
        });
    });
}

function updatePassword(req, res) {
    User.findById(req.body._id).exec(function (err, user) {
        if (err) {
            return handleError(err, res);
        }
        if (!user) {
            return handleError({message: 'User not found'});
        }

        user.local.password = user.generateHash(req.body.password);

        user.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.send('update successful');
        });
    });
}

exports.getAll = getAllUsers;
exports.checkReadPermission = checkReadPermission;
exports.checkUpdatePermission = checkUpdatePermission;
exports.updateById = updateById;
exports.followPost = followPost;
exports.unFollowPost = unFollowPost;
exports.changePassword = updatePassword;
exports.createUser = createUser;
exports.checkCreatePermission = checkCreatePermission;
exports.deleteById = deleteById;
exports.checkDeletePermission = checkDeletePermission;