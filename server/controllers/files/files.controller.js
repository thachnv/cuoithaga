'use strict';

var mongoose = require('mongoose'),
    multiparty = require('multiparty'),
    uuid = require('node-uuid'),
    fs = require('fs'),
    File = mongoose.model('File'),
    url = require('url'),
    path = require('path'),
    appDir = path.dirname(require.main.filename),
    logger = require('winston'),
    childProcess = require('child_process'),
    Meme = mongoose.model('Meme');

exports.upload = function (req, res) {
    var size = '';
    var fileName = '';
    var destinationPath = '';

    var form = new multiparty.Form({
        maxFilesSize: 1
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
        var hostname = req.headers.host; // hostname = 'localhost:8080'
        //var pathname = url.parse(req.url).pathname; // pathname = '/MyApp'
        var temporalPath = file.path;
        var extension = file.path.substring(file.path.lastIndexOf('.'));
        var fileName = uuid.v4() + extension;
        destinationPath = './upload/' + fileName;
        var inputStream = fs.createReadStream(temporalPath);
        var outputStream = fs.createWriteStream(destinationPath);
        var fileUrl = 'http://' + hostname + '/upload/' + fileName;

        inputStream.pipe(outputStream);

        inputStream.on('end', function () {
            fs.unlinkSync(temporalPath);

            var f = new File();
            f.path = destinationPath.slice(1);
            f.type = file.headers['content-type'];

            f.save(function (err) {
                if (err) {
                    handleError(err, res);
                }
                var num = req.param('CKEditorFuncNum');

                var cb = 'window.parent.CKEDITOR.tools.callFunction(' + num + ',"' + fileUrl + '")';
                var retVal = '<script type="text/javascript">' + cb + '</script>';
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=UTF-8'
                    //'Content-Length': length
                });
                res.end(retVal);
                //res.send(createResponseObj(RES_STATUS.SUCCESS, null, cb));
            });
        });
    });

    form.parse(req);
};
exports.uploadImage = function (req, res) {
    var size = '';
    var fileName = '';
    var destinationPath = '';
    var imagesDirectory = './upload/images/';

    var form = new multiparty.Form({
        //maxFilesSize: 4194304
        maxFilesSize: 10485760
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
        var type = file.headers['content-type'];

        if (type === 'image/gif' || type === 'image/jpeg' || type === 'image/bmp' || type === 'image/png') {
            var uniqueName = uuid.v4();
            var temporalPath = file.path;
            var extension = file.path.substring(file.path.lastIndexOf('.'));
            var fileName = uniqueName + extension;
            destinationPath = imagesDirectory + fileName;
            var inputStream = fs.createReadStream(temporalPath);

            var outputStream = fs.createWriteStream(destinationPath);

            inputStream.pipe(outputStream);

            inputStream.on('end', function () {
                fs.unlinkSync(temporalPath);
                var filePath = destinationPath.slice(1);

                /*Create a light-weight copy of the gif for preview (GIF)*/
                if (type === 'image/gif') {
                    var ffmpegBin = appDir + '/ffmpeg/bin/ffmpeg';

                    var previewFilePath = imagesDirectory + uniqueName + '_preview.jpg';
                    //var ogshareFilePath = imagesDirectory + uniqueName + '_ogshare.jpg';
                    var mp4FilePath = imagesDirectory + uniqueName + '.mp4';
                    var webmFilePath = imagesDirectory + uniqueName + '.webm';

                    var args = [
                        appDir + filePath + '[0]',
                        appDir + previewFilePath
                    ];

                    childProcess.execFile('convert', args, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                    });

                    //var ogshareArgs = [
                    //    appDir + filePath + '[0]',
                    //    '-resize', '1200x630',
                    //    appDir + ogshareFilePath
                    //];
                    ////
                    //childProcess.execFile('convert', ogshareArgs, function (err) {
                    //    if (err) {
                    //        logger.error(err);
                    //    }
                    //});

                    var getMp4Args = [
                        '-f', 'gif',
                        '-i', appDir + filePath,
                        '-vcodec', 'libx264',
                        '-pix_fmt', 'yuv420p',
                        '-preset', 'slow',
                        '-profile:v', 'baseline',
                        '-movflags', 'faststart',
                        '-b:v', '650k',
                        '-vf',
                        'scale=trunc(iw/2)*2:trunc(ih/2)*2',
                        '-y',
                        mp4FilePath
                    ];

                    childProcess.execFile(ffmpegBin, getMp4Args, function (err) {
                        if (err) {
                            logger.error(err);
                        }

                        //var getPreviewImgArgs = [
                        //    '-i',
                        //    appDir + mp4FilePath,
                        //    '-ss', '00:00:00.000',
                        //    '-f', 'image2',
                        //    '-vframes', '1',
                        //    previewFilePath
                        //];
                        //
                        //childProcess.execFile(ffmpegBin, getPreviewImgArgs, function (err) {
                        //    if (err) {
                        //        logger.error(err);
                        //    }
                        //});
                    });

                    var getWebmArgs = [
                        '-f', 'gif',
                        '-i', appDir + filePath,
                        '-c:v', 'libvpx',
                        '-c:a', 'libvorbis',
                        '-pix_fmt',
                        'yuv420p',
                        '-b:v', '650k',
                        '-crf', '5',
                        '-vf', 'scale=trunc(in_w/2)*2:trunc(in_h/2)*2',
                        webmFilePath
                    ];

                    childProcess.execFile(ffmpegBin, getWebmArgs, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                    });


                    res.send(createResponseObj(RES_STATUS.SUCCESS, null, {
                        media_type: type,
                        imageSrc: filePath,
                        previewImageSrc: previewFilePath.slice(1),
                        mp4Src: mp4FilePath.slice(1),
                        webmSrc: webmFilePath.slice(1)
                    }));
                    /* End GIF Only */
                } else {
                    var waterMaskArgs = [
                        '-gravity', 'SouthEast',
                        '-geometry', '+0+0',
                        appDir + '\\upload\\images\\mask.png',
                        appDir + filePath,
                        appDir + filePath
                    ];
                    childProcess.execFile('composite', waterMaskArgs, function (err) {
                        if (err) {
                            logger.error(err);
                        }
                    });
                    res.send(createResponseObj(RES_STATUS.SUCCESS, null, {
                        media_type: type,
                        imageSrc: filePath,
                        previewImageSrc: null,
                        mp4Src: null,
                        webmSrc: null
                    }));
                }

            });
        } else {
            handleError({message: 'Chỉ chấp nhận định dạng gif, jpg, bmp, png'}, res);
        }
    });

    form.parse(req);
};