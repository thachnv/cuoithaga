'use strict';

var mongoose = require('mongoose'),
    Post = mongoose.model('Post'),
    Comment = mongoose.model('Comment'),
    Role = mongoose.model('Role'),
    User = mongoose.model('User'),
    PostMark = mongoose.model('PostMark'),
    logger = require('winston');

//formidable = require('formidable'),
/**
 * Private methods
 */
function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || '').split(',')[0] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

function changeAlias(alias) {
    var str = alias;
    str = str.toLowerCase();
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ  |ặ|ẳ|ẵ/g, 'a');
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ  |ợ|ở|ỡ/g, 'o');
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
    str = str.replace(/đ/g, 'd');
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|$|_/g, '-');
    str = str.replace(/-+-/g, '-');
    str = str.replace(/^\-+|\-+$/g, '');
    str = str.replace(/[^\w\s]/gi, '');
    str = str.replace(/ /g, '-');
    return str;
}

function increasePostViewsCount(post){
    post.viewsCount++;
    post.save(function(err){
        if(err){
            logger.error('Error while updating post views count', err);
        }
    });
}

function updateUserRating(userId) {
    var sumGoodRatings = 0;
    var sumBadRatings = 0;

    User.findOne({_id: userId}).exec(function (err, user) {
        if (err) {
            return logger.error(err);
        }
        if (!user) {
            return logger.error('User ' + userId + ' not found');
        }
        var query = {createdBy: user._id};
        Comment.find(query).exec(function (err, comments) {
            if (err) {
                return logger.error(err);
            }

            for (var i = 0; i < comments.length; i++) {
                sumGoodRatings += comments[i].goodRatings.length;
                sumBadRatings += comments[i].badRatings.length;
            }

            Post.find(query).exec(function (err, posts) {
                if (err) {
                    return logger.error(err);
                }
                for (var i = 0; i < posts.length; i++) {
                    sumGoodRatings += posts[i].goodRatings.length;
                    sumBadRatings += posts[i].badRatings.length;
                }
                user.rating = sumGoodRatings - sumBadRatings;
                user.save(function (err) {
                    if (err) {
                        return logger.error(err);
                    }
                });

            });
        });
    });
}

/**
 * create
 */
function createPost(req, res) {
    //Create the post base on request data
    var post = new Post(req.body);

    post.createdBy = req.user;

    post.link = changeAlias(post.title) + '-' + post._id;
    post.status = 'allowed';
    post.save(function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
    });

}
/**
 * create anonymous Post
 */
exports.createAnonymousPost = function createAnonymousPost(req, res) {
    //Create the post base on request data
    var post = new Post(req.body);

    post.link = changeAlias(post.title) + '-' + post._id;
    post.status = 'allowed';
    post.creatorIp = getClientIp(req);

    post.save(function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
    });

};

function getTopCommentsPosts(req, res) {
    var top = req.params.top;
    Post.find({})
        .sort({commentCount: -1})
        .limit(top)
        .exec(function (err, users) {
            if (err) {
                return handleError(err, res);
            }

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, users));
        });
}
/**
 * get all
 */
function getAllPosts(req, res) {
    Post.find({}, '-__v')
        .populate('data', '-_id title summary language')
        .populate('createdBy', '-_id facebook.name local.username')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }
            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        });
}
/**
 * get allowed
 */
function getAllowedPosts(req, res) {
    var page = Number(req.param('page'));
    var num = Number(req.param('num'));
    var sortBy = req.param('sort_by');

    if (!page || isNaN(page)) {
        page = 1;
    }

    if (!num || isNaN(num)) {
        num = 10;
    }

    var sortByQuery = {};

    if (sortBy === 'commentCount') {
        sortByQuery.commentCount = -1;
    }

    sortByQuery.createdDate = -1;

    var skip = (page - 1) * num;

    Post.find({status: 'allowed'}, '-__v')
        .skip(skip)
        .sort(sortByQuery)
        .limit(num)
        .populate('data', '-_id title summary language')
        .populate('createdBy', '-_id facebook.name local.username')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }

            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        });
}
/**
 * get random allowed posts
 */
function getRandomAllowedPosts(req, res) {
    var num = req.param('number');

    Post.count(function(err, count){
        if(err){
            return handleError(err, res);
        }

        var rand = Math.floor(Math.random() * count);

        Post.find({status: 'allowed'}, '-__v')
            .skip(rand)
            .limit(num)
            .exec(function (err, posts) {
                if (err) {
                    return handleError(err, res);
                }

                return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
            });
    });
}

function getAllowedPostsRaw(req, res) {
    var query = {status: 'allowed'};
    Post.find(query, 'title link')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }
            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        });
}

function getAllowedPostsByTime(req, res) {
    var serverTime = new Date();
    var time = new Date(Number(req.param('timestamp')));
    if (time > serverTime) {
        time = serverTime;
    }
    var limit = Number(req.param('limit'));
    var type = req.param('query');
    var sortBy = req.param('sort-by');
    var category = req.param('category');

    var query = {status: 'allowed'};

    if (type === 'old') {
        query.createdDate = {
            $lt: time
        };
    } else {
        query.createdDate = {
            $gte: time
        };
    }

    if(category){
        query.category = category;
    }else{
        query.category = {
            $in: ['funny', null]
        };
    }

    var sortByQuery = {};

    if (sortBy === 'commentCount') {
        sortByQuery.commentCount = -1;
    }

    sortByQuery.createdDate = -1;

    Post.find(query, '-__v')
        .sort(sortByQuery)
        .limit(limit)
        .populate('data', '-_id title summary language')
        .populate('createdBy', '-_id facebook.name local.username')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));

            for(var i = 0, len = posts.length; i<len; i++){
                increasePostViewsCount(posts[i]);
            }

        });
}
function getAllowedFollowingPosts(req, res) {
    var currentUser = req.user;
    var page = Number(req.param('page'));
    var num = Number(req.param('num'));

    if (!page || isNaN(page)) {
        page = 1;
    }
    if (!num || isNaN(num)) {
        num = 10;
    }

    var skip = (page - 1) * num;
    var query = {
        _id: {
            $in: currentUser.followingPosts
        }
    };

    Post.find(query, '-__v')
        .skip(skip)
        .sort({createdDate: -1})
        .limit(num)
        .populate('data', '-_id title summary language')
        .populate('createdBy', '-_id facebook.name local.username')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }

            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        });
}
function getAllFollowingPosts(req, res) {
    var currentUser = req.user;

    var query = {
        _id: {
            $in: currentUser.followingPosts
        },
        status: 'allowed'
    };

    Post.find(query, '-__v')
        .populate('data', '-_id title summary language')
        .populate('createdBy', '-_id facebook.name local.username')
        .exec(function (err, posts) {
            if (err) {
                return handleError(err, res);
            }

            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, posts));
        });
}

function checkViewedPosts(req, res) {
    var postIds = req.body;

    if (postIds instanceof Array) {
        var query = {
            post: {
                $in: postIds
            },
            user: req.user
        };

        PostMark.find(query).exec(function (err, postMarks) {
            if (err) {
                return handleError({message: 'Bad request'}, res);
            }
            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, postMarks));
        });
    } else {
        return handleError({message: 'Bad request'}, res);
    }
}

/**
 * get by id
 */
function getAllowedPostById(req, res) {

    var _id = Post.getIdFromLink(req.params.link);

    Post.findById(_id, '-__v')
        .populate('data', '-_id -__v')
        .populate('createdBy', '-_id local.username facebook.name facebook.id facebook.token google.name google.id google.token google.picture rating')
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }
            if (post.status !== 'allowed') {
                return handleError({message: 'This post is not allowed yet'}, res);
            }

            res.send(createResponseObj(RES_STATUS.SUCCESS, null, {post: post}));

            //Increase views
            increasePostViewsCount(post);

            //If user have logged in, mark that the user have read that post
            if (req.isAuthenticated()) {
                var query = {user: req.user, post: post};
                PostMark.findOne(query).exec(function (err, postMark) {
                    if (err) {
                        logger.error(err);
                    } else if (!postMark) {
                        var newPostMark = new PostMark();
                        newPostMark.user = req.user;
                        newPostMark.post = post;
                        newPostMark.save(function (err) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    } else {
                        postMark.save(function (err) {
                            if (err) {
                                logger.error(err);
                            }
                        });
                    }
                });
            }

        });
}
/**
 * get by id
 */
function getNextAllowedPostLink(req, res) {

    var _id = req.params.id;

    Post.findById(_id, 'createdDate status')
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }
            if (post.status !== 'allowed') {
                return handleError({message: 'This post is not allowed yet'}, res);
            }
            var query = {
                createdDate: {
                    $lt: post.createdDate
                },
                status: 'allowed'
            };
            Post.findOne(query, 'link').sort({createdDate: -1}).exec(function (err, nextPost) {
                if (err) {
                    return handleError(err, res);
                }
                if (!post) {
                    return handleError({message: 'Post not found'}, res);
                }
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, nextPost));
            });
        });
}

/*
 * update by id
 */
exports.updateById = function (req, res) {
    var _id = req.body._id;
    var title = req.body.title;
    var content = req.body.content;
    var category = req.body.category;

    if (!_id || !title) {
        return handleError({message: 'Bad request', code: 400}, res);
    }

    var updateObj = {
        title: title,
        content: content,
        category: category
    };

    Post.findByIdAndUpdate(_id, updateObj)
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }

            if (!post) {
                return handleError({message: 'Post not found', code: 404});
            }

            return res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
        });
};

/*
 * delete by id
 */
exports.deletePostById = function (req, res) {
    Post.findByIdAndRemove(req.params.id, function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'Post not found', code: 404}, res);
        }
        return res.send(createResponseObj(RES_STATUS.SUCCESS, null));
    });
};
/*
 * delete by id
 */
exports.allowPostById = function (req, res) {
    Post.findByIdAndUpdate(req.params.id, {status: 'allowed'}, function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'Post not found', code: 404}, res);
        }
        return res.send(createResponseObj(RES_STATUS.SUCCESS, null));
    });
};
/*
 * delete by id
 */
exports.banPostById = function (req, res) {
    Post.findByIdAndUpdate(req.params.id, {status: 'banned'}, function (err, post) {
        if (err) {
            return handleError(err, res);
        }
        if (!post) {
            return handleError({message: 'Post not found', code: 404}, res);
        }

        return res.send(createResponseObj(RES_STATUS.SUCCESS, null));
    });
};
/**
 * Rate Good
 */
exports.rateGood = function (req, res) {
    var _id = req.body.id;
    Post.findById(_id)
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }

            for (var i = 0, iLen = post.goodRatings.length; i < iLen; i++) {
                if (post.goodRatings[i].from.equals(req.user._id)) {
                    return handleError({message: 'You rated good for this post already', code: 403}, res);
                }
            }

            for (var j = 0, jLen = post.badRatings.length; j < jLen; j++) {
                if (post.badRatings[j].from.equals(req.user._id)) {
                    return handleError({message: 'You rated bad for this post already', code: 403}, res);
                }
            }

            post.goodRatings.push({
                from: req.user
            });

            post.save(function (err) {
                if (err) {
                    return handleError(err, res);
                }
                updateUserRating(post.createdBy, res);
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
            });
        });
};
/**
 * Rate bad
 */
exports.rateBad = function (req, res) {

    var comment = new Comment(req.body.comment);

    comment.createdBy = req.user;

    Post.findById(req.body.id)
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }

            for (var i = 0, iLen = post.goodRatings.length; i < iLen; i++) {
                if (post.goodRatings[i].from.equals(req.user._id)) {
                    return handleError({message: 'You rated good for this post already', code: 403}, res);
                }
            }

            for (var j = 0, jLen = post.badRatings.length; j < jLen; j++) {
                if (post.badRatings[j].from.equals(req.user._id)) {
                    return handleError({message: 'You rated bad for this post already', code: 403}, res);
                }
            }

            post.badRatings.push({
                from: req.user,
                comment: comment
            });

            post.save(function (err) {
                if (err) {
                    return handleError(err, res);
                }
                updateUserRating(post.createdBy, res);
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
            });
        });
};
/**
 * Unrate
 */
exports.unRate = function (req, res) {

    Post.findById(req.body.id)
        .exec(function (err, post) {
            if (err) {
                return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found'}, res);
            }

            for (var i = 0, iLen = post.goodRatings.length; i < iLen; i++) {
                if (post.goodRatings[i].from.equals(req.user._id)) {
                    post.goodRatings.splice(i, 1);
                    break;
                }
            }

            for (var j = 0, jLen = post.badRatings.length; j < jLen; j++) {
                if (post.badRatings[j].from.equals(req.user._id)) {
                    post.badRatings.splice(j, 1);
                    break;
                }
            }

            post.save(function (err) {
                if (err) {
                    return handleError(err, res);
                }
                updateUserRating(post.createdBy, res);
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, post));
            });
        });
};

/**
 * Check Permissions on post functions
 */
exports.permitDelete = function (req, res, next) {
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

        if (role.havePermission('post', 'delete')) {
            return next();
        }

        return handleError({message: 'You do not have this permission'}, res);
    });
};
exports.haveCreatePermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('post', 'create')) {
            return next();
        }

        return handleError({message: 'You do not have "Create Post" permission'}, res);
    });
};

exports.haveUpdatePermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('post', 'update')) {
            return next();
        }

        return handleError({message: 'You do not have "Update Post" permission', code: 403}, res);
    });
};

exports.haveReadPermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('post', 'read')) {
            return next();
        }

        return handleError({message: 'You do not have "View All Posts" permission', code: 403}, res);
    });
};

exports.getAllowedPosts = getAllowedPosts;
exports.getAllowedPostsByTime = getAllowedPostsByTime;
exports.getAllowedPostById = getAllowedPostById;
exports.getNextAllowedPostLink = getNextAllowedPostLink;
exports.createPost = createPost;
//exports.getTopCommentsPosts = getTopCommentsPosts;
exports.checkViewedPosts = checkViewedPosts;
//exports.getFollowingPosts = getFollowingPosts;
exports.getAllowedFollowingPosts = getAllowedFollowingPosts;
exports.getAllowedPostsRaw = getAllowedPostsRaw;
exports.getAllPosts = getAllPosts;
exports.getRandomAllowedPosts = getRandomAllowedPosts;