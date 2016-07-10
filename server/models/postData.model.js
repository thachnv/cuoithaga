'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Validation functions
 */
function validateNotEmpty(property) {
    if (typeof property === 'string') {
        return !!property.length;
    }else{
        return false;
    }
}

/**
 * Post Schema
 */

var PostDataSchema = new Schema({
    title: {
        type: String,
        required: true,
        validate: [validateNotEmpty, 'Please fill in title']
    },
    summary: {
        type: String,
        default: ''

    },
    content: {
        type: String,
        default: ''
    },
    language: {
        type: String,
        default: 'en'
    }
});

mongoose.model('PostData', PostDataSchema);