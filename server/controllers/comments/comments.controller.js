'use strict';
var mongoose = require('mongoose'),
    Comment = mongoose.model('Comment'),
    Post = mongoose.model('Post'),
    User = mongoose.model('User'),
    Role = mongoose.model('Role'),
    logger = require('winston');

exports.create = function (req, res) {
    //Create the post base on request data
    var comment = new Comment(req.body);

    comment.createdBy = req.user;

    var postQuery = {_id: Post.getIdFromLink(req.body.toPost)};

    Post.findOne(postQuery, function (err, post) {
        if (err) {
            logger.error(err);
            return handleError(err, res);
        }

        if (!post) {
            return handleError({message: 'Post not found'}, res);
        }

        comment.toPost = post._id;
        Comment.create(comment, function (err, comment) {
            if (err) {
                return handleError(err, res);
            }

            post.save(function (err) {
                if(err){
                    logger.error(err);
                }
            });

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));

        });
    });


};
/**
 * get all
 */
exports.getAll = function (req, res) {
    Post.find({}, '-_id -__v').populate('data', '-_id title summary language').populate('createdBy', '-_id facebook.name').exec(function (err, posts) {
        if (err) {
            res.send(err);
        } else {
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        }
    });
};

function getCommentById(req, res) {
    var id = req.params.id;

    Comment.findById(id, function (err, comment) {
        if (err) {
            return handleError(err, res);
        }

        if (!comment) {
            return handleError({message: 'Comment not found'}, res);
        }

        res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));
    });
}
/**
 * get by id
 */
function getCommentsByPostLink(req, res) {
    /**
     * @param {{ postLink:string }}
     */
    var postLink = req.params.postLink;
    var page = req.param('page') || 1;
    var limit = req.param('limit') || 10;

    var postQuery = {_id: Post.getIdFromLink(postLink)};
    Post.findOne(postQuery).exec(function (err, post) {
        if (err) {
            return handleError(err, res);
        }

        if (!post) {
            return handleError({message: 'Post not found'}, res);
        }

        var commentQuery = {toPost: post._id};
        Comment.find(commentQuery, 'content createdBy goodRatings badRatings forBadRating createdDate')
            .populate('createdBy', '-_id local.username facebook.name facebook.id facebook.token google.name google.id google.token google.picture rating')
            .skip((Number(page) - 1) * Number(limit))
            .limit(Number(limit))
            .sort({rating: -1, createdDate: -1})
            .exec(function (err, comments) {
                if (err) {
                    res.send(err);
                } else {
                    res.send(createResponseObj(RES_STATUS.SUCCESS, null, comments));
                }
            });

    });
}
/*
 * update by id
 */
exports.updateById = function (req, res) {
    var post = new Post(req.body);

    var updateObj = {
        title: post.title,
        link: post.link,
        content: post.content
    };

    var query = {id: post.id};

    Post.findOneAndUpdate(query, updateObj, function (err, post) {
        if (err) {
            return handleError(err, res);
        }

        res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
    });
};

/*
 * delete by id
 */
exports.deleteById = function (req, res) {
    var query = {id: req.params.id};

    Post.findOneAndRemove(query, function (err) {
        if (err) {
            res.send(err);
        } else {
            res.send('delete successful');
        }
    });
};

function updateUserRating(userId) {
    var sumGoodRatings = 0;
    var sumBadRatings = 0;

    User.findOne({_id: userId}).exec(function (err, user) {
        if (err) {
            logger.error('Updating user rating error: ', err);
        }
        if (!user) {
            logger.error('Updating user rating error: ', err);
        }

        var query = {createdBy: user._id};

        Comment.find(query).exec(function (err, comments) {
            if (err) {
                logger.error('Updating user rating error: ', err);
            }

            for (var i = 0; i < comments.length; i++) {
                sumGoodRatings += comments[i].goodRatings.length;
                sumBadRatings += comments[i].badRatings.length;
            }

            Post.find(query).exec(function (err, posts) {
                if (err) {
                    logger.error('Updating user rating error: ', err);
                }

                for (var i = 0; i < posts.length; i++) {
                    sumGoodRatings += posts[i].goodRatings.length;
                    sumBadRatings += posts[i].badRatings.length;
                }

                user.rating = sumGoodRatings - sumBadRatings;

                user.save(function (err) {
                    if (err) {
                        logger.error('Updating user rating error: ', err);
                    }
                });

            });
        });
    });
}

/**
 * Rate Good
 */
exports.rateGood = function (req, res) {

    Comment.findById(req.body.id)
        .populate('createdBy')
        .exec(function (err, comment) {
            if (err) {
                return handleError(err, res);
            }
            if (!comment) {
                return handleError({message: 'Comment not found'}, res);
            }

            for (var i = 0, iLen = comment.goodRatings.length; i < iLen; i++) {
                if (comment.goodRatings[i].from.equals(req.user._id)) {
                    return handleError({message: 'You rated good for this Comment already'}, res);
                }
            }

            for (var j = 0, jLen = comment.badRatings.length; j < jLen; j++) {
                if (comment.badRatings[j].from.equals(req.user._id)) {
                    return handleError({message: 'You rated bad for this Comment already'}, res);
                }
            }

            comment.goodRatings.push({
                from: req.user
            });

            comment.updateRating();

            comment.save(function (err) {
                if (err) {
                    return handleError(err, res);
                }
                updateUserRating(comment.createdBy, res);
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));
            });
        });
};
/**
 * Rate bad
 */
exports.rateBad = function (req, res) {

    var ratingComment = new Comment(req.body.comment);

    ratingComment.createdBy = req.user;

    Post.findOne({_id: req.body.postId})
        .populate('createdBy')
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }

            Comment.findById(req.body.id)
                .exec(function (err, comment) {
                    if (err) {
                        return handleError(err, res);
                    }
                    if (!comment) {
                        return handleError({message: 'Comment not found'}, res);
                    }

                    for (var i = 0, iLen = comment.goodRatings.length; i < iLen; i++) {
                        if (comment.goodRatings[i].from.equals(req.user._id)) {
                            return handleError({message: 'You rated good for this post already'}, res);
                        }
                    }

                    for (var j = 0, jLen = comment.badRatings.length; j < jLen; j++) {
                        if (comment.badRatings[j].from.equals(req.user._id)) {
                            return handleError({message: 'You rated bad for this post already'}, res);
                        }
                    }


                    comment.badRatings.push({
                        from: req.user
                    });

                    comment.updateRating();

                    comment.save(function (err) {
                        if (err) {
                            return handleError(err, res);
                        }
                        updateUserRating(comment.createdBy, res);
                        res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));
                    });
                });
        });
};
/**
 * Unrate
 */
exports.unRate = function (req, res) {

    Comment.findById(req.body.id)
        .populate('createdBy')
        .exec(function (err, comment) {
            if (err) {
                return handleError(err, res);
            }
            if (!comment) {
                return handleError({message: 'Post not found'}, res);
            }

            for (var i = 0, iLen = comment.goodRatings.length; i < iLen; i++) {
                if (comment.goodRatings[i].from.equals(req.user._id)) {
                    comment.goodRatings.splice(i, 1);
                    break;
                }
            }

            for (var j = 0, jLen = comment.badRatings.length; j < jLen; j++) {
                if (comment.badRatings[j].from.equals(req.user._id)) {
                    comment.badRatings.splice(j, 1);
                    break;
                }
            }

            comment.updateRating();

            comment.save(function (err) {
                if (err) {
                    return handleError(err, res);
                }
                updateUserRating(comment.createdBy);
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));
            });
        });
};

/**
 * Check Permissions update a user
 */
function checkViewPermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            logger.error(err);
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('comment', 'read')) {
            return next();
        }

        return handleError({message: 'You do not have "View Comments" permission'}, res);
    });
}

function getAllComments(req, res) {
    Comment.find({})
        .populate('createdBy')
        .populate('toPost')
        .populate('goodRatings.from')
        .populate('badRatings.from')
        .exec(function (err, comments) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, comments));
        });
}

function checkDeletePermission(req, res, next) {
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

        if (role.havePermission('comment', 'delete')) {
            return next();
        }

        return handleError({message: 'You do not have this permission'}, res);
    });
}

function deleteCommentById(req, res) {
    Comment.findByIdAndRemove(req.params.id, function (err, cmt) {
        if (err) {
            return handleError(err, res);
        }

        res.send(createResponseObj(RES_STATUS.SUCCESS, null, cmt));
    });
}

function editComment(req, res) {
    var commentId = req.body._id;
    var content = req.body.content;

    if (!commentId || !content) {
        return handleError({message: 'Bad Request'}, res);
    }

    Comment.findByIdAndUpdate(commentId, {content: content})
        .exec(function (err, comment) {
            if (err) {
                return handleError(err, res);
            }

            if (!comment) {
                return handleError({message: 'Bad Request'}, res);
            }

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, comment));
        });
}

function checkEditPermission(req, res, next) {
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

        if (role.havePermission('comment', 'update')) {
            return next();
        }

        return handleError({message: 'You do not have "update comment" permission'}, res);
    });
}

//API
exports.getCommentsByPostLink = getCommentsByPostLink;
exports.getCommentById = getCommentById;

/**
 * For manager
 */

//Check permissions
exports.checkViewPermission = checkViewPermission;
exports.checkDeletePermission = checkDeletePermission;
exports.checkEditPermission = checkEditPermission;
//Manage function
exports.getAllComments = getAllComments;
exports.deleteCommentById = deleteCommentById;
exports.editComment = editComment;
