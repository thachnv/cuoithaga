'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    bcrypt = require('bcrypt-nodejs');
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
 * User Schema
 */
var UserSchema = new Schema({
    role: {
        type: Schema.ObjectId,
        ref: 'Role'
    },
    isRoot: {
        type: Boolean,
        default: false
    },
    rating: {
        type: Number,
        default: 0
    },
    followingPosts: [
        {
            type: Schema.ObjectId,
            ref: 'Post'
        }
    ],
    local: {
        name: {
            type: String
        },
        email: {
            type: String,
            trim: true,
            validate: [validateLocalStrategyProperty, 'Please fill in your email'],
            match: [/.+\@.+\..+/, 'Please fill a valid email address']
        },
        username: {
            type: String,
            trim: true
        },
        password: {
            type: String,
            validate: [validateLocalStrategyPassword, 'Password should be longer']
        }
    },
    facebook: {
        email: {
            type: String
        },
        name: {
            type: String
        },
        token: {
            type: String
        },
        id: {
            type: String
        }
    },
    google: {
        id: {
            type: String
        },
        token: {
            type: String
        },
        name: {
            type: String
        },
        email: {
            type: String
        },
        picture: {
            type: String
        }
    },
    ipHistory: [
        {
            type: String
        }
    ],
    createdDate: {
        type: Date
    },
    updatedDate: {
        type: Date
    }
});

// methods ======================
// Generating a hash
UserSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// Checking if password is valid
UserSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.local.password);
};

// Update ip history
UserSchema.methods.updateIpHistory = function (ip) {
    if (this.ipHistory.indexOf(ip) < 0) {
        this.ipHistory.push(ip);
    }
};

UserSchema.pre('save', function (next) {
    var now = new Date();
    this.updatedDate = now;
    if (!this.createdDate) {
        this.createdDate = now;
    }
    if (this.local && (!this.local.name || this.local.name.length === 0)) {
        this.local.name = this.local.username;
    }
    next();
});

mongoose.model('User', UserSchema);