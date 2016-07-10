'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    Post = mongoose.model('Post');
//    Comment = mongoose.model('Comment');


/**
 * Validation functions
 */
function validateNotEmpty(property) {
    if (property) {
        return !!property.length;
    }
}

/**
 * Post Schema
 */

var CommentSchema = new Schema({
    content: {
        type: String,
        required: true,
        validate: [validateNotEmpty, 'content can not be empty']
    },
    toPost: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    parent: {
        type: Schema.ObjectId,
        ref: 'Comment'
    },
    forBadRating: {
        type: Boolean,
        default: false
    },
    nested: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    goodRatings: [
        {
            from: {
                type: Schema.ObjectId,
                ref: 'User'
            }
        }
    ],
    badRatings: [
        {
            from: {
                type: Schema.ObjectId,
                ref: 'User'
            }
        }
    ],
    createdBy: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    createdDate: {
        type: Date
    },
    updatedDate: {
        type: Date
    }
});


CommentSchema.methods.updateRating = function(){
    this.rating = this.goodRatings.length - this.badRatings.length;
};

var Comment = mongoose.model('Comment', CommentSchema);

CommentSchema.pre('save', function (next) {

    var now = new Date();
    this.updatedDate = now;
    if (!this.createdDate) {
        this.createdDate = now;
    }

    var toPost = this.toPost;
    var queryCommentToSamePost = {toPost: toPost};
    Comment.find(queryCommentToSamePost).exec(function (err, comments) {
        if (err) {
            return;
        }
        var commentCount = comments.length + 1;
        Post.findByIdAndUpdate(toPost, {commentCount: commentCount}).exec(function (err) {
            console.log(err);
        });
    });
    next();
});
