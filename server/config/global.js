'use strict';

global.RES_STATUS = {
    SUCCESS: 'SUCCESS',
    ERROR: 'ERROR'
};

global.RES_OBJ_DEFAULT = {
    status: GLOBAL.RES_STATUS.SUCCESS,
    data: {
        message: ''
    }
};

global.createResponseObj = function (status, message, data) {
    return {
        status: status,
        message: message,
        data: data
    };
};

global.handleError = function (err, res) {
    if (!isNaN(err.code)) {
        res.writeHead(err.code);
    } else {
        res.writeHead(500);
    }
    res.end(err.message);
};