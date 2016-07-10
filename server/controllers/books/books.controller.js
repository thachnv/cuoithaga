'use strict';
/**
 * Created by ipinkk on 10/6/2014.
 */
var mongoose = require('mongoose'),
    Book = mongoose.model('Book'),
    Post = mongoose.model('Post'),
    PostData = mongoose.model('PostData'),
    File = mongoose.model('File');

/**
 * Sign up
 */
exports.create = function (req, res) {
    //get request data
    var requestData = req.body;

    requestData.createdBy = req.user;

    var book = new Book(requestData);

    var query = { id: { $in: requestData.chapters } };
    Post.find(query, function (err, mappedChapters) {
        if (err) {
            handleError(err, res);
        }

        book.chapters = mappedChapters;

        var bookInfoDatas = [];

        for (var j = 0; j < requestData.data.length; j++) {
            var postData = new PostData(requestData.data[j]);
            bookInfoDatas.push(postData);
        }

//        var queryFiles
//        File.find(queryFiles)
        PostData.create(bookInfoDatas, function (err) {
            if (err) {
                handleError(err, res);
            } else {
                book.data = bookInfoDatas;

                // Then save the post
                Book.create(book, function (err) {
                    if (err) {
                        handleError(err, res);
                    } else {
                        res.send(createResponseObj(RES_STATUS.SUCCESS, null));
                    }
                });

            }
        });
    });
};
/**
 * get all
 */
exports.getAll = function (req, res) {
    Book.find({}, '-_id -__v')
        .populate('chapters', '-_id -__v')
        .populate('data', '-_id -__v')
        .populate('images', '-_id path')
        .exec(function (err, books) {
            PostData.populate(books, {
                model: 'PostData',
                path: 'chapters.data',
                select: '-_id title language summary'
            }, function (err) {
                if (err) {
                    handleError(err, res);
                }
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, books));
            });
        });
};
/**
 * get by id
 */
exports.getById = function (req, res) {

    var query = { id: req.params.id};

    Book.findOne(query, '-_id -__v')
        .populate('chapters', '-_id -__v')
        .populate('data', '-_id -__v')
        .exec(function (err, book) {
            PostData.populate(book, {
                model: 'PostData',
                path: 'chapters.data',
                select: '-_id title language summary'
            }, function (err) {
                if (err) {
                    handleError(err, res);
                }
                res.send(createResponseObj(RES_STATUS.SUCCESS, null, book));
            });
        });
};
/*
 * delete by id
 */
exports.deleteById = function (req, res) {
    var query = { id: req.params.id};

    Book.findOneAndRemove(query, function (err, book) {
        if (err) {
            handleError(err, res);
        } else {
            res.send(createResponseObj(RES_STATUS.SUCCESS, null, book));
        }
    });
};