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
    return !!property.length;
}

/**
 * Post Schema
 */

var PostSchema = new Schema({
    link: {
        type: String
    },
    title: {
        type: String,
        required: true,
        validate: [validateNotEmpty, 'Please fill in title']
    },
    content: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        enum: ['girl','boy','funny'],
        default: 'funny'
    },
    images: [
        {
            type: String
        }
    ],
    media: {
        media_type: {
            type: String
        },
        imageSrc: {
            type: String
        },
        previewImageSrc: {
            type: String
        },
        mp4Src: {
            type: String
        },
        webmSrc: {
            type: String
        },
        youtubeId: {
            type: String
        }
    },
    commentCount: {
        type: Number,
        default: 0
    },
    viewsCount: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['allowed', 'banned', 'pending']
    },
    creatorIp: {
        type: String
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
    stateChangedDate: {},
    createdDate: {
        type: Date
    },
    updatedDate: {
        type: Date
    }
});

PostSchema.pre('save', function (next) {
    var now = new Date();
    this.updatedDate = now;
    this.stateChangedDate = now;
    if (!this.createdDate) {
        this.createdDate = now;
    }
    next();
});

PostSchema.statics.getIdFromLink = function (link) {
    var array = link.split('-');
    return array[array.length - 1];
};

mongoose.model('Post', PostSchema);