'use strict';

module.exports = function (app) {

    var memes = require('../../controllers/memes.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    // Setting the files API
    app.route('/api/memes/upload')
        .post(users.isLoggedIn, memes.haveCreatePermission, memes.uploadMeme);

    app.route('/api/memes')
        .put(users.isLoggedIn, memes.haveUpdatePermission, memes.updateById);

    app.route('/api/memes')
        .get(memes.getAll);

    app.route('/api/memes/:id')
        .get(memes.getById);

    app.route('/api/memes/:id')
        .delete(users.isLoggedIn, memes.haveDeletePermission, memes.deleteById);

};