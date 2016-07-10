'use strict';

module.exports = function (app, passport) {
    // User Routes
    var users = require('../../controllers/users/users.controller.js');
    var roles = require('../../controllers/roles.controller.js');

    // Setting up the users profile api
    app.route('/api/users/signup').post(users.blockSignup, users.signUp);
    app.route('/api/users/login').post(users.localLogin);
    app.route('/api/profile').get(users.isLoggedIn, users.getCurrentUser);
    app.route('/api/logout').get(users.logOut);
    app.route('/api/users/top/:top').get(users.getTopUsers);
    app.route('/api/users')
        .get(users.isLoggedIn, users.checkReadPermission, users.getAll)
        .post(users.isLoggedIn, users.checkCreatePermission, users.createUser)
        .put(users.isLoggedIn, users.checkUpdatePermission, users.updateById);

    app.route('/api/users/:id')
        .delete(users.isLoggedIn, users.checkDeletePermission, users.deleteById);

    app.route('/api/users/password')
        .put(users.isLoggedIn, users.checkUpdatePermission, users.changePassword);

    app.route('/api/users/follow/:postId').get(users.isLoggedIn, users.followPost);
    app.route('/api/users/unfollow/:postId').get(users.isLoggedIn, users.unFollowPost);

    app.route('/api/roles')
        .get(users.isLoggedIn, roles.checkViewPermission, roles.getAllRoles);
    app.route('/api/roles')
        .post(users.isLoggedIn, roles.checkCreatePermission, roles.createRole);
    app.route('/api/roles')
        .put(users.isLoggedIn, roles.checkEditPermission, roles.editRole);

    app.get('/api/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));
    app.get('/api/auth/facebook/callback', users.facebookLogin);

    app.get('/api/auth/google', passport.authenticate('google', {scope: ['profile', 'email'] }));
    app.get('/api/auth/google/callback', users.googleLogin);

};


