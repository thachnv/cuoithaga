'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Post Schema
 */

var RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    permissions: [
        {
            resourceName: {
                type: String,
                required: true
            },
            can: [
                {
                    action: {
                        type: String,
                        required: true,
                        enum: ['create', 'read', 'update', 'delete', 'read_mine', 'update_mine', 'delete_mine', 'read_aio']
                    },
                    allow: {
                        type: Boolean,
                        default: false
                    }
                }
            ]
        }
    ]
});

RoleSchema.methods.havePermission = function (resourceName, can) {
    for (var i = 0, len = this.permissions.length; i < len; i++) {
        if (this.permissions[i].resourceName === resourceName) {
            for (var j = 0, jLen = this.permissions[i].can.length; j < jLen; j++) {
                if (this.permissions[i].can[j].action === can) {
                    return this.permissions[i].can[j].allow;
                }
            }
        }
    }
    return false;
};

mongoose.model('Role', RoleSchema);