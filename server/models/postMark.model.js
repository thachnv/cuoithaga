'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PostMarkSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    post: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    viewedDate: {
        type: Date
    }
});

PostMarkSchema.pre('save', function (next) {
    this.viewedDate = new Date();
    next();
});

mongoose.model('PostMark', PostMarkSchema);