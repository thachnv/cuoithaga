'use strict';

var mongoose = require('mongoose'),
    Role = mongoose.model('Role');

/**
 * Create a role
 */
function createRole(req, res) {
    var role = new Role(req.body);

    role.save(function (err) {
        if (err) {
            return handleError(err, res);
        }

        res.send(createResponseObj(RES_STATUS.SUCCESS, null));
    });
}

/**
 * Update a role
 */
function editRole(req, res) {
    var newRole = new Role(req.body);
    var query = {name: req.body.name};

    Role.findOne(query).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Role not found'}, res);
        }
        role.permissions = newRole.permissions;
        role.save(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null));
        });
    });
}

function checkEditPermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('role', 'update')) {
            return next();
        }

        return handleError({message: 'You do not have "Update Role" permission'}, res);
    });
}

function checkCreatePermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('role', 'create')) {
            return next();
        }

        return handleError({message: 'You do not have "Create Role" permission'}, res);
    });
}
function checkViewPermission(req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'});
        }

        if (role.havePermission('role', 'read')) {
            return next();
        }

        return handleError({message: 'You do not have "View Roles" permission'}, res);
    });
}

function getAllRoles(req, res) {
    Role.find({}).exec(function (err, roles) {
        if (err) {
            return handleError(err, res);
        }
        res.send(createResponseObj(RES_STATUS.SUCCESS, null, roles));
    });
}
exports.createRole = createRole;
exports.editRole = editRole;
exports.getAllRoles = getAllRoles;

exports.checkCreatePermission = checkCreatePermission;
exports.checkEditPermission = checkEditPermission;
exports.checkViewPermission = checkViewPermission;