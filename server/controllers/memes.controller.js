'use strict';


var mongoose = require('mongoose'),
    multiparty = require('multiparty'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Meme = mongoose.model('Meme'),
    Role = mongoose.model('Role'),
    logger = require('winston');

exports.haveUpdatePermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('meme', 'update')) {
            return next();
        }

        return handleError({message: 'You do not have "Update Meme" permission', code: 403}, res);
    });
};

exports.haveCreatePermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('meme', 'create')) {
            return next();
        }

        return handleError({message: 'You do not have "Create Meme" permission'}, res);
    });
};

exports.haveDeletePermission = function (req, res, next) {
    if (req.user.isRoot) {
        return next();
    }

    Role.findOne({_id: req.user.role}).exec(function (err, role) {
        if (err) {
            return handleError(err, res);
        }

        if (!role) {
            return handleError({message: 'Unknown role'}, res);
        }

        if (role.havePermission('meme', 'delete')) {
            return next();
        }

        return handleError({message: 'You do not have "Create Meme" permission'}, res);
    });
};

exports.uploadMeme = function (req, res) {
    var size = '';
    var fileName = '';
    var destinationPath = '';

    var form = new multiparty.Form({
        maxFilesSize: 4194304
    });

    form.on('error', function (err) {
        handleError(err, res);
    });

    form.on('part', function (part) {
        if (!part.filename) {
            return;
        }
        size = part.byteCount;
        fileName = part.filename;
    });

    form.on('file', function (name, file) {
        var temporalPath = file.path;
        var extension = file.path.substring(file.path.lastIndexOf('.'));
        var fileName = uuid.v4() + extension;
        destinationPath = './upload/memes/' + fileName;
        var inputStream = fs.createReadStream(temporalPath);
        var outputStream = fs.createWriteStream(destinationPath);

        inputStream.pipe(outputStream);

        inputStream.on('end', function () {
            fs.unlinkSync(temporalPath);

            var m = new Meme();
            m.path = destinationPath.slice(1);
            m.type = file.headers['content-type'];

            m.save(function (err, file) {
                if (err) {
                    return handleError(err, res);
                }

                res.send(createResponseObj(RES_STATUS.SUCCESS, null, file));
            });
        });
    });

    form.parse(req);
};

exports.updateById = function (req, res) {
    var _id = req.body.id;
    var name = req.body.name || '';
    var description = req.body.description || '';
    var topText = req.body.topText || '';
    var bottomText = req.body.bottomText || '';

    Meme.findByIdAndUpdate(_id, {name: name, description: description, topText: topText, bottomText: bottomText})
        .exec(function (err, emo) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, emo));
        });
};

exports.getAll = function (req, res) {
    Meme.find({})
        .exec(function (err, memes) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, memes));
        });
};

exports.getById = function (req, res) {
    var _id = req.params.id;

    Meme.findById(_id, '-__v')
        .exec(function (err, meme) {
            if (err) {
                return handleError(err, res);
            }

            if (!meme) {
                return handleError({message: 'Meme not found'}, res);
            }


            res.send(createResponseObj(RES_STATUS.SUCCESS, null, meme));
        });
};

exports.deleteById = function (req, res) {
    var _id = req.params.id;

    Meme.findById(_id, '-__v')
        .exec(function (err, meme) {
            if (err) {
                return handleError(err, res);
            }

            if (!meme) {
                return handleError({message: 'Meme not found'}, res);
            }

            //Remove the file first
            fs.unlink('.' + meme.path, function(err){
                if(err && err.code !== 'ENOENT'){
                    logger.error(err, '- while removing meme\'s image');
                    return handleError(err, res);
                }

                Meme.remove({_id: meme._id}).exec(function(err){
                    if(err){
                        logger.error(err, '- while removing meme');
                        return handleError(err, res);
                    }
                    res.send(createResponseObj(RES_STATUS.SUCCESS, null));
                });
            });

        });
};