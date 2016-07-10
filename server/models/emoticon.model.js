'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var MemeSchema = new Schema({
    name: {
        type: String
    },
    description: {
        type: String
    },
    path: {
        type: String
    },
    type: {
        type: String
    },
    topText: {
        type: String
    },
    bottomText: {
        type: String
    }
});

mongoose.model('Meme', MemeSchema);