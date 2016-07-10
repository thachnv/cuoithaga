'use strict';

var mongoose = require('mongoose'),
    Post = mongoose.model('Post'),
    Comment = mongoose.model('Comment'),
    Vote = mongoose.model('Vote');

/**
 * create
 */
exports.vote = function (req, res) {
    //Create the post base on request data
    var vote = new Vote(req.body);

    vote.createdBy = req.user;

    if (vote.to === 0 && vote.toPost) {
        Post.findById(vote.toPost, '').exec(function (err, post) {
            if (err) {
                handleError(err, res);
            } else if (!post) {
                handleError({message: 'post not found'}, res);
            } else {
                vote.toPost = post._id;
                vote.save(function (err) {
                    if (err) {
                        handleError(err, res);
                    } else {
                        if(vote.rate === 1){
                            post.upVotes++;
                        }else{
                            post.downVotes++;
                        }
                        console.log(post);
                        post.save(function(err){
                            if (err) {
                                handleError(err, res);
                            } else {
                                res.send(createResponseObj(RES_STATUS.SUCCESS, null));
                            }
                        });
                    }
                });
            }
        });
    } else if (vote.to === 1 && vote.toComment) {
        Comment.findById(vote.toComment, '').exec(function (err, comment) {
            if (err) {
                handleError(err, res);
            } else if (!comment) {
                handleError({message: 'comment not found'}, res);
            } else {
                vote.toComment = comment._id;
                vote.save(function (err) {
                    if (err) {
                        handleError(err, res);
                    } else {
                        res.send(createResponseObj(RES_STATUS.SUCCESS, null));
                    }
                });
            }
        });
    } else {
        handleError({message: 'Bad Request'}, res);
    }

};
