'use strict';

module.exports = function (app) {

    var files = require('../../controllers/files/files.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    // Setting the files API
    app.route('/api/files/upload')
        .post(users.isLoggedIn, files.upload);
    app.route('/api/files/images/upload')
        .post(files.uploadImage);
    //app.route('/api/files/meme/upload')
    //    .post(users.isLoggedIn, files.uploadMeme);
};