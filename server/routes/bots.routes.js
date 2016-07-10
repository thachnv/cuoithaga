'use strict';

var bots = require('../controllers/bots.controller.js');

module.exports = function (app) {
    app.all(/^((?!\/api).)*$/, bots.serveFacebook, bots.serveGoogle, function(req, res){
        res.sendFile('index.html', {'root': 'ui'});
    });
};