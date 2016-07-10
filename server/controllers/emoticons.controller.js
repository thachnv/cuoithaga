'use strict';

var mongoose = require('mongoose'),
    multiparty = require('multiparty'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    Emoticon = mongoose.model('Emoticon');

exports.upload = function (req, res) {
    var size = '';
    var fileName = '';
    var destinationPath = '';

    var form = new multiparty.Form();

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
        destinationPath = './upload/emoticons/' + uuid.v4() + extension;
        var inputStream = fs.createReadStream(temporalPath);
        var outputStream = fs.createWriteStream(destinationPath);

        inputStream.pipe(outputStream);

        inputStream.on('end', function () {
            fs.unlinkSync(temporalPath);

            var e = new Emoticon();
            e.path = destinationPath.slice(1);
            e.type = file.headers['content-type'];

            e.save(function (err, data) {
                if (err) {
                    handleError(err, res);
                }
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, data));
            });
        });
    });

    form.parse(req);
};

function getAll(req, res){
    Emoticon.find({})
        .exec(function (err, emos) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, emos));
        });
}

function updateById(req, res) {
    var _id = req.body.id;
    var name = req.body.name;
    var shortcut = req.body.shortcut;

    Emoticon.findByIdAndUpdate(_id, {name: name, shortcut: shortcut})
        .exec(function (err, emo) {
            if (err) {
                return handleError(err, res);
            }
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, emo));
        });
}

function deleteById(req, res) {
    var _id = req.params.id;

    Emoticon.findByIdAndRemove(_id)
        .exec(function (err) {
            if (err) {
                return handleError(err, res);
            }
            res.json(createResponseObj(RES_STATUS.SUCCESS, null));
        });
}

exports.updateById = updateById;
exports.deleteById = deleteById;
exports.getAll = getAll;