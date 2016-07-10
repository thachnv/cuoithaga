'use strict';

module.exports = function (app) {

    var emoticons = require('../../controllers/emoticons.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    // Setting the files API

    app.route('/api/emoticons/upload')
        .post(users.isLoggedIn, emoticons.upload);
    app.route('/api/emoticons')
        .get(emoticons.getAll);
    app.route('/api/emoticons')
        .put(users.isLoggedIn, emoticons.updateById);
    app.route('/api/emoticons/:id')
        .delete(users.isLoggedIn, emoticons.deleteById);
};