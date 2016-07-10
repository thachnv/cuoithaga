'use strict';
/**
 * Module dependencies.
 */
require('./server/config/global');
require('./server/models/user.model.js');
require('./server/models/book.model');
require('./server/models/post.model');
require('./server/models/postData.model');
require('./server/models/file.model');
require('./server/models/comment.model');
require('./server/models/vote.model');
require('./server/models/role.model');
require('./server/models/emoticon.model');
require('./server/models/meme.model');
require('./server/models/postMark.model');

var mongoose = require('mongoose'),
    express = require('express'),
    passport = require('passport'),
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    RedisStore = require('connect-redis')(session),
    logger = require('winston');

//Some configurations
var port = 80,
    redisPort = 6379;

// Bootstrap db connection
var db = mongoose.connect('localhost', 'sokdb', 27017, {user: 'sokadmin', pass: 'Nudns@sook223498'});
require('./server/config/passport')(passport);

// Init the express application
var app = express(db);

//Config logger
logger.add(logger.transports.File, {
    filename: 'sok.log',
    json: false,
    maxsize: 1024,
    timestamp: function () {
        return (new Date()).toString();
    }
});

logger.remove(logger.transports.Console);

app.use(cookieParser()); // read cookies (needed for auth)
app.use(session({
    store: new RedisStore({
        pass: 'MQwO31Jc7cPL[5B4974(C3C52LQvqP05X2U=Q^rJ5B=;I',
        host: 'localhost',
        port: redisPort
    }), secret: 'adsfkljadfjadfnakjdsnfkj4565s21ddd2222aaakjdfnkj'
}));

app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

require('./server/routes')(app, passport, express);

// Start the app by listening on <port>
app.listen(port);

// Logging initialization
logger.info('Successfully startup. Listening on port: ', port);