'use strict';

var mongoose = require('mongoose'),
    Post = mongoose.model('Post'),
    logger = require('winston'),
    childProcess = require('child_process'),
    phantomjs = require('phantomjs');

function serveFacebook(req, res, next) {
    var userAgent = req.headers['user-agent'];
    if (userAgent && (userAgent.indexOf('facebookexternalhit/1.0') > -1 || userAgent.indexOf('facebookexternalhit/1.1')) > -1) {
        var rawId = Post.getIdFromLink(req.url);
        var _id;
        if (rawId.indexOf('?') < 0) {
            _id = rawId
        } else {
            _id = rawId.split('?')[0];
        }
        console.log(_id);

        Post.findById(_id, '-__v').exec(function (err, post) {
            if (err) {
                logger.er
                ror(err);
                var htm = '<!DOCTYPE html>' +
                    '<html>' +
                    '<head  prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">' +
                    '<meta property="fb:app_id" content="411546052326680" />' +
                    '<meta property="og:type"   content="share" />' +
                    '<meta property="og:title"  content="Cười Thả Ga" />' +
                    '<meta property="og:image"  content="http://cuoithaga.com/ui/images/icons/sok_icon.png" />' +
                    '<title>Cười Thả Ga</title>' +
                    '</head>' +
                    '<body></body>' +
                    '</html>';
                res.writeHead(200, {
                    'Content-Type': 'text/html; charset=UTF-8'
                    //'Content-Length': length
                });

                return res.end(htm);
                //return handleError(err, res);
            }
            if (!post) {
                return handleError({message: 'Post not found', code: 404}, res);
            }
            if (post.status !== 'allowed') {
                return handleError({message: 'This post is not allowed yet', code: 403}, res);
            }

            var replacedContent = post.content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');

            var strippedContent = replacedContent.replace(/(<([^>]+)>)/ig, '');
            var previewImg = 'http://cuoithaga.com/ui/images/icons/nacdanh.png';
            if (post.media) {
                if (post.media.media_type === 'video/youtube') {
                    previewImg = 'http://img.youtube.com/vi/' + post.media.youtubeId + '/0.jpg';
                } else if (post.media.previewImageSrc) {
                    previewImg = 'http://cuoithaga.com' + post.media.previewImageSrc;
                } else if (post.media.imageSrc) {
                    previewImg = 'http://cuoithaga.com' + post.media.imageSrc;
                }
            }


            //previewImg = 'http://cuoithaga.com/upload/awbOD7D_700b.jpg';
            //previewImg = 'http://tuyettinhkiem.info/photo/e7e05c8a-f393-4c1f-a540-2ccb87e977ad_ogshare.jpg';

            var html = '<!DOCTYPE html>' +
                '<html>' +
                    //'<head  prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb# website: http://ogp.me/ns/website#">' +
                    //'<link rel="image_src" href="http://tuyettinhkiem.info/photo/awbOD7D_700b.jpg" />' +
                    //'<link rel="image_src" href="'+ previewImg +'" />' +
                '<meta property="og:site_name" content="cuoithaga.com" />' +
                '<meta property="fb:app_id" content="411546052326680" />' +
                '<meta property="og:type"   content="article" />' +
                '<meta property="og:title"  content="' + post.title + '" />' +
                '<meta property="og:image"  content="' + previewImg + '" />' +
                //'<meta property="og:image:width"  content="358" />' +
                //'<meta property="og:image:height"  content="272" />' +
                    //'<meta property="og:image:url"  content="' + previewImg + '" />' +
                '<meta property="og:url"  content="' + 'http://cuoithaga.com' + req.url + '" />' +
                '<meta property="og:description"  content="Click để xem hình và bình luận nhé" />' +
                '<title>' + post.title + '</title>' +
                    //'</head>' +
                '<body>' +
                '<img src="' + previewImg + '"/>' +
                '</body>' +
                '</html>';
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=UTF-8'
                //'Content-Length': length
            });

            res.end(html);
        });
    } else {
        next();
    }
}

function serveGoogle(req, res, next) {
    var binPath = phantomjs.path;
    var es = '_escaped_fragment_';
    var hostname = req.get('host');

    if (hostname && hostname.indexOf('tuyettinhkiem') > -1) {
        logger.info('still trying ?');
        res.end('dummy');
    } else if (typeof(req.query[es]) !== 'undefined') {
        //Google bot detected, kick his asssssssssssss
        logger.info('Hi google bot. I\'m serving ya');

        var url = req.protocol + '://' + req.get('host');
        logger.info(url + req.url);
        var script = 'get_html.js'; //Script to get html
        url += req.url.replace('_escaped_fragment_', '');
        var childArgs =
            [
                '--disk-cache=true', '--max-disk-cache-size=1024', script, url
            ];
        childProcess.execFile(binPath, childArgs, function (err, stdout) {
            var response = '<!DOCTYPE html><html>' + stdout + '</html>';
            var length = Buffer.byteLength(response, 'utf8');
            res.writeHead(200, {
                'Content-Type': 'text/html; charset=UTF-8',
                'Content-Length': length
            });
            res.end('<!DOCTYPE html><html>' + stdout + '</html>');
        });
    } else {
        next();
    }
}

exports.serveFacebook = serveFacebook;
exports.serveGoogle = serveGoogle;
