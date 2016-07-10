'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EmoticonSchema = new Schema({
    name: {
        type: String
    },
    path: {
        type: String
    },
    type: {
        type: String
    },
    shortcut: {
        type: String
    }
});

mongoose.model('Emoticon', EmoticonSchema);