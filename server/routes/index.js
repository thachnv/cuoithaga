'use strict';

var path = require('path'),
    fs = require('fs'),
    bodyParser = require('body-parser');

module.exports = function (app, passport, express) {

    app.use(bodyParser.json({type: 'application/json'}));
    app.use(function (err, req, res, next) {
        if (err) {
            return handleError(err, res);
        }
        next();
    });

    //Config static contents
    //app.use('/', express.static('ui'));
    app.use('/ui', express.static('ui'));
    app.use('/bower_components', express.static('bower_components'));
    app.use('/upload', express.static('upload'));

    //Serving bot ( google, facebook) and redirect 404 to index.html
    require('./bots.routes.js')(app);

    //Load api routes
    fs.readdirSync(path.join(__dirname, 'api')).forEach(function(file) {
        require('./api/' + file)(app, passport);
    });

};
