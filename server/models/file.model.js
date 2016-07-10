'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Post Schema
 */

var FileSchema = new Schema({
    path: {
        type: String
    },
    type: {
        type: String
    }
});

mongoose.model('File', FileSchema);