'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
//	crypto = require('crypto');

/**
 * A Validation function for local strategy properties
 */
var validateLocalStrategyProperty = function (property) {
    return ((this.provider !== 'local' && !this.updated) || property.length);
};

/**
 * A Validation function for local strategy password
 */
var validateLocalStrategyPassword = function (password) {
    return (this.provider !== 'local' || (password && password.length > 6));
};

/**
 * Validation functions
 */
function validateNotEmpty(property) {
    return !!property.length;
}

/**
 * User Schema
 */
var BookSchema = new Schema({

    id: {
        type: String,
        validate: [validateNotEmpty, 'Id cannot be empty']
    },
    link: {
        type: String,
        trim: true,
        default: ''
    },
    author: {
        type: String,
        default: ''
    },
    images: [
        {
            type: Schema.ObjectId,
            ref: 'File'
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
    },
    data: [
        {
            type: Schema.ObjectId,
            ref: 'PostData'
        }
    ],
    chapters: [
        {
            type: Schema.ObjectId,
            ref: 'Post'
        }
    ]
});

mongoose.model('Book', BookSchema);