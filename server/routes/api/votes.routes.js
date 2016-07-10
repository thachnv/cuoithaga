'use strict';

module.exports = function (app) {

    var votes = require('../../controllers/votes/votes.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    app.route('/api/vote')
        .post(users.isLoggedIn, votes.vote);
};