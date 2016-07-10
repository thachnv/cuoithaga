'use strict';

module.exports = function(app) {
    // User Routes
    var books = require('../../controllers/books/books.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    // Setting up the users profile api
    app.route('/api/books')
        .post(users.isLoggedIn, books.create)
        .get(books.getAll);

    app.route('/api/books/:id')
        .get(books.getById)
        .delete(users.isLoggedIn, books.deleteById);

};
