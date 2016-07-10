'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;


/**
 * Validation functions
 */
function validateRate(property) {
    return !(property !== 1 && property !== -1);
}

function validateTo(property) {
    return !(property !== 1 && property !== 0);
}

/**
 * Post Schema
 */

var VoteSchema = new Schema({
    toPost: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    toComment: {
        type: Schema.ObjectId,
        ref: 'Comment'
    },
    to: {
        type: Number,
        required: true,
        validate: [validateTo, 'wrong "to" value, only 0 and 1 is accepted']
    },
    rate: {
        type: Number,
        required: true,
        validate: [validateRate, 'wrong "rate" value, only 1 and -1 is accepted']
    },
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

VoteSchema.pre('save', function (next) {
    var now = new Date();
    this.updatedDate = now;
    if (!this.createdDate) {
        this.createdDate = now;
    }
    next();
});

mongoose.model('Vote', VoteSchema);