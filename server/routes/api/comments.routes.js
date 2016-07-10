'use strict';

module.exports = function (app) {

    var comments = require('../../controllers/comments/comments.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    app.route('/api/comments')
        .get(users.isLoggedIn, comments.checkViewPermission, comments.getAllComments)
        .post(users.isLoggedIn, comments.create)
        .put(users.isLoggedIn, comments.checkEditPermission, comments.editComment);

    app.route('/api/comments/:postLink')
        .get( comments.getCommentsByPostLink);
    app.route('/api/comments/get/:id')
        .get( comments.getCommentById);
    app.route('/api/comments/delete/:id')
        .delete( users.isLoggedIn, comments.checkDeletePermission, comments.deleteCommentById);

    app.route('/api/comments/rate/good').post(users.isLoggedIn, comments.rateGood);
    app.route('/api/comments/rate/bad').post(users.isLoggedIn, comments.rateBad);
    app.route('/api/comments/unrate').post(users.isLoggedIn, comments.unRate);

};