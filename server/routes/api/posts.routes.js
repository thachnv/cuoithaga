'use strict';

module.exports = function (app) {

    var posts = require('../../controllers/posts/posts.controller.js');
    var users = require('../../controllers/users/users.controller.js');

    //no need authenticate or permissions check
    app.route('/api/posts/public').get(posts.getAllowedPosts);
    app.route('/api/posts/public/next/:id').get(posts.getNextAllowedPostLink);
    app.route('/api/posts/public/single/:link').get(posts.getAllowedPostById);
    //app.route('/api/posts/public/top/:top').get(posts.getTopCommentsPosts);
    app.route('/api/posts/public/following').get(users.isLoggedIn, posts.getAllowedFollowingPosts);
    app.route('/api/posts/public/time').get(posts.getAllowedPostsByTime);
    app.route('/api/posts/public/all').get(posts.getAllowedPostsRaw);
    app.route('/api/posts/public/random').get(posts.getRandomAllowedPosts);

    //only need authenticate
    app.route('/api/posts/rate/good').post(users.isLoggedIn, posts.rateGood);
    app.route('/api/posts/rate/bad').post(users.isLoggedIn, posts.rateBad);
    app.route('/api/posts/unrate').post(users.isLoggedIn, posts.unRate);
    app.route('/api/posts/check').post(users.isLoggedIn, posts.checkViewedPosts);

    app.route('/api/posts/public/create').
        post(posts.createAnonymousPost);

    //need authenticate and check permissions
    app.route('/api/posts/member/create').post(users.isLoggedIn, posts.haveCreatePermission, posts.createPost);


    //API for manager
    app.route('/api/posts/manage/update').put(users.isLoggedIn, posts.haveUpdatePermission, posts.updateById);
    app.route('/api/posts/manage/all').get(posts.haveReadPermission, posts.getAllPosts);
    app.route('/api/posts/manage/delete/:id').delete(users.isLoggedIn, posts.permitDelete, posts.deletePostById);
    app.route('/api/posts/manage/allow/:id').get(users.isLoggedIn, posts.haveUpdatePermission, posts.allowPostById);
    app.route('/api/posts/manage/ban/:id').get(users.isLoggedIn, posts.haveUpdatePermission, posts.banPostById);
};