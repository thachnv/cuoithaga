(function () {
    'use strict';

    function QuestionsMultipleCtrl($scope, $http, mainSrv, $location, $filter, $routeParams, $timeout) {
        //Constants
        var VIEW_MODES = {
            ALL_TIME_LINE: 0,
            ALL_TOP_COMMENTS: 1,
            FOLLOWING_NEW_UPDATE: 2,
            ALL: 3
        };

        //Variables
        var page = 1,
            numPerPage = 4,
            timeHead = new Date(),
            timeTail = new Date();

        //View multiple Questions app
        var app = {
            VIEW_MODES: VIEW_MODES,
            loadingMore: false,
            currentViewMode: undefined,
            currentUser: mainSrv.getCurrentUser(),
            list: [],
            GOOD: 1,
            BAD: -1,
            NEGATIVE: 0
        };

        var currentCategory = null;


        //function checkViewedPosts(posts, done) {
        //    if (app.currentUser) {
        //        var postIds = [];
        //        angular.forEach(posts, function (p) {
        //            postIds.push(p._id);
        //        });
        //        $http.post('/api/posts/check', angular.toJson(postIds)).success(function (responsePm) {
        //            angular.forEach(posts, function (p) {
        //                p.ratingStatus = checkRatedStatus(p);
        //                angular.forEach(responsePm.data, function (pm) {
        //                    if (p._id === pm.post) {
        //                        var postUpdatedDate = new Date(p.updatedDate);
        //                        var markedDate = new Date(pm.viewedDate);
        //                        if (postUpdatedDate > markedDate) {
        //                            p.state = 'unseen';
        //                        } else {
        //                            p.state = 'seen';
        //                        }
        //                    }
        //                });
        //                if (!p.state) {
        //                    p.state = 'unseen';
        //                }
        //            });
        //
        //            if (kt.isFunction(done)) {
        //                done(posts);
        //            }
        //        });
        //    }
        //}

        function checkFollowingPosts(posts) {
            if (app.currentUser) {
                var followingPosts = app.currentUser.info.followingPosts;
                angular.forEach(posts, function (post) {
                    post.ratingStatus = checkRatedStatus(post);
                    post.marked = false;
                    angular.forEach(followingPosts, function (postId) {
                        if (post._id === postId) {
                            post.marked = true;
                        }
                    });
                });
            }
        }

        function getDate(date) {
            var theDate = new Date(date);
            var currentDate = new Date();

            var _1m = 60000;
            var _1h = 3600000;
            var _24h = 86400000;
            var _7d = 604800000;

            var delta = currentDate - theDate;
            if (delta <= _1m) {
                return kt.millisecondsToSeconds(delta) + ' giây trước';
            } else if (delta <= _1h) {
                return kt.millisecondsToMinutes(delta) + ' phút trước';
            } else if (currentDate - theDate <= _24h) {
                return kt.millisecondsToHours(delta) + ' giờ trước';
            } else if (delta <= _7d) {
                return kt.millisecondsToDays(delta) + ' ngày trước';
            } else {
                return $filter('date')(date, 'M/d/y');
            }
        }

        function getMinCreatedDate(list) {
            var min = new Date(list[0].createdDate);
            for (var i = 1, len = list.length; i < len; i++) {
                var tmp = new Date(list[i].createdDate);
                if (min > tmp) {
                    min = tmp;
                }
            }
            return min;
        }

        function getMaxCreatedDate(list) {
            var max = new Date(list[0].createdDate);
            for (var i = 1, len = list.length; i < len; i++) {
                var tmp = new Date(list[i].createdDate);
                if (max < tmp) {
                    max = tmp;
                }
            }
            return max;
        }

        /**
         * Get older post
         * */
        var gettingOlderPosts = false; // To lock resource
        function getOlderPosts() {
            if (!gettingOlderPosts) {
                gettingOlderPosts = true;
                var query = '/api/posts/public/time' + '?timestamp=' + timeTail.getTime() + '&limit=' + numPerPage + '&query=old';

                //if (commentSort) {
                //    query += '&sort-by=commentCount';
                //}

                if (currentCategory) {
                    query += '&category=' + currentCategory;
                }

                $http.get(query).success(function (response) {
                    angular.forEach(response.data, function (post) {
                        app.list.push(post);
                    });

                    if (app.list.length > 0) {
                        timeTail = getMinCreatedDate(app.list);
                    }

                    //checkViewedPosts(app.list);
                    checkFollowingPosts(app.list);

                    app.loadingMore = false;

                    $timeout(function () {
                        if (typeof FB !== 'undefined') {
                            FB.XFBML.parse();
                        }
                    });
                }).finally(function () {
                    gettingOlderPosts = false;
                });
            }
        }

        /**
         * Get older post
         * */
        function getPosts(queries) {
            var query = '/api/posts/public' + '?page=' + page + '&num=' + numPerPage + '&query=old';

            for (var i = 0; i < queries.length; i++) {
                query += '&' + queries[i].key + '=' + queries[i].value;
            }

            $http.get(query).success(function (response) {
                angular.forEach(response.data, function (post) {
                    app.list.push(post);
                });

                checkFollowingPosts(app.list);
                //checkViewedPosts(app.list);

                app.loadingMore = false;
            });
        }

        /**
         * Get new post
         * */
        function getNewPosts() {
            $http.get('/api/posts/public/time' + '?timestamp=' + timeHead.getTime() + '&limit=' + 0 + '&query=new').success(function (response) {
                if (response.data && response.data.length > 0) {

                    for (var i = response.data.length - 1; i >= 0; i--) {
                        app.list.unshift(response.data[i]);
                    }

                    if (app.list.length > 0) {
                        timeHead = getMaxCreatedDate(app.list);
                    }

                    //checkViewedPosts(app.list);

                    checkFollowingPosts(app.list);

                    app.loadingMore = false;
                }
            });
        }

        /**
         * Get older post
         * */
        function getFollowingPosts() {
            $http.get('/api/posts/public/following').success(function (response) {
                app.list = response.data;
                //checkViewedPosts(app.list, function () {
                kt.multiSort(app.list, 'desc', ['state', 'createdDate']);
                checkFollowingPosts(app.list);
                //});
            });
        }

        /**
         * Get all posts
         */

        function getAllPosts() {
            $http.get('/api/posts/public/all').success(function (response) {
                app.list = response.data;
            });
        }

        function loadMore() {
            if (app.currentViewMode === app.VIEW_MODES.ALL_TIME_LINE) {
                app.loadingMore = true;
                app.getOlderPosts();
            } else if (app.currentViewMode === app.VIEW_MODES.ALL_TOP_COMMENTS) {
                app.loadingMore = true;
                page++;
                getPosts([{
                    key: 'sort_by',
                    value: 'commentCount'
                }]);
            }
        }


        function viewTimeLineWithTopComments() {
            if (app.currentViewMode !== VIEW_MODES.ALL_TOP_COMMENTS) {
                page = 1;
                app.list = [];
                app.currentViewMode = VIEW_MODES.ALL_TOP_COMMENTS;
                getPosts([{
                    key: 'sort_by',
                    value: 'commentCount'
                }]);
            }
        }

        function viewTimeLine() {
            if (app.currentViewMode !== VIEW_MODES.ALL_TIME_LINE) {
                app.list = [];
                app.currentViewMode = VIEW_MODES.ALL_TIME_LINE;
                timeTail = new Date();
                getOlderPosts();
            }
        }

        function viewFollowingPosts() {
            if (app.currentViewMode !== VIEW_MODES.FOLLOWING_NEW_UPDATE) {
                app.list = [];
                app.currentViewMode = VIEW_MODES.FOLLOWING_NEW_UPDATE;
                getFollowingPosts();
            }
        }

        function viewAll() {
            if (app.currentViewMode !== VIEW_MODES.ALL) {
                app.list = [];
                app.currentViewMode = VIEW_MODES.ALL;
                getAllPosts();
            }
        }


        function followPost(question) {
            if (app.currentUser) {
                var list = app.currentUser.info.followingPosts;
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === question._id) {
                        return;
                    }
                }
                app.currentUser.info.followingPosts.push(question._id);
                question.marked = true;
                $http.get('/api/users/follow/' + question._id);
            }
        }

        function unFollowPost(question) {
            if (app.currentUser) {
                var list = app.currentUser.info.followingPosts;
                for (var i = 0; i < list.length; i++) {
                    if (list[i] === question._id) {
                        app.currentUser.info.followingPosts.splice(i, 1);
                        question.marked = false;
                        $http.get('/api/users/unfollow/' + question._id);
                        return;
                    }
                }
            }
        }

        function viewNew() {
            $location.url('/new');
        }

        function viewHot() {
            $location.url('/hot');
        }

        function viewFollowing() {
            $location.url('/following');
        }

        function getName(user) {
            if (user) {
                if (user.google) {
                    return user.google.name;
                } else if (user.facebook) {
                    return user.facebook.name;
                } else if (user.local) {
                    return user.local.name;
                } else {
                    return '';
                }
            } else {
                return 'Nặc Danh';
            }
        }

        function share(post) {
            FB.ui({
                method: 'share',
                href: 'http://cuoithaga.com/view/' + post.link
            }, function () {
            });
        }

        function like(post) {
            FB.ui({
                method: 'share_open_graph',
                action_type: 'og.like',
                action_properties: JSON.stringify({
                    object: 'http://cuoithaga.com/view/' + post.link
                })
            }, function () {
            });

        }

        function checkRatedStatus(item) {
            if (app.currentUser) {
                for (var i = 0, iLen = item.goodRatings.length; i < iLen; i++) {
                    if (item.goodRatings[i].from === app.currentUser.info._id) {
                        return app.GOOD;
                    }
                }

                for (var j = 0, jLen = item.badRatings.length; j < jLen; j++) {
                    if (item.badRatings[j].from === app.currentUser.info._id) {
                        return app.BAD;
                    }
                }
            }
            return app.NEGATIVE;
        }

        function updateQuestion(question) {
            question.ratingStatus = checkRatedStatus(question);
            for (var i = 0; i < app.list.length; i++) {
                if (app.list[i]._id === question._id) {
                    app.list[i] = question;
                }
            }
        }

        function rateGoodQuestion(question) {

            var requestData = {
                id: question._id
            };

            $http.post('/api/posts/rate/good', angular.toJson(requestData)).success(function (response) {
                updateQuestion(response.data);
            });
        }

        function rateBadQuestion(question) {
            var requestData = {
                id: question._id
            };
            $http.post('/api/posts/rate/bad', angular.toJson(requestData)).success(function (response) {
                updateQuestion(response.data);
            });
        }

        function unRateQuestion(question) {
            var requestData = {
                id: question._id
            };

            $http.post('/api/posts/unrate', angular.toJson(requestData)).success(function (response) {
                updateQuestion(response.data);
            });
        }

        /**
         * Binding methods
         */
        app.like = like;
        app.share = share;
        app.unRateQuestion = unRateQuestion;
        app.rateBadQuestion = rateBadQuestion;
        app.rateGoodQuestion = rateGoodQuestion;

        app.getDate = getDate;
        app.getName = getName;

        app.viewTimeLine = viewTimeLine;
        app.viewFollowingPosts = viewFollowingPosts;
        app.viewTimeLineWithTopComments = viewTimeLineWithTopComments;

        app.viewNew = viewNew;
        app.viewHot = viewHot;
        app.viewFollowing = viewFollowing;

        app.loadMore = loadMore;

        app.followPost = followPost;
        app.unFollowPost = unFollowPost;

        app.getOlderPosts = getOlderPosts;
        app.getNewPosts = getNewPosts;

        //init
        $scope.app = app;
        //Set up current view mode
        var viewMode = $routeParams.viewMode;
        $scope.$emit('VIEW_MODE_CHANGED', viewMode);
        if (viewMode === 'hot') {
            viewTimeLineWithTopComments();
        } else if (viewMode === 'following') {
            viewFollowingPosts();
        } else if (viewMode === 'new') {
            viewTimeLine();
        } else if (viewMode === 'all') {
            viewAll();
        } else if (viewMode === 'girl') {
            currentCategory = 'girl';
            viewTimeLine();
        } else if (viewMode === 'boy') {
            currentCategory = 'boy';
            viewTimeLine();
        } else {
            viewTimeLine();
        }
        $scope.$emit('TITLE_CHANGED', 'Xả Stress');
        $scope.$emit('REFRESH');
        $scope.$on('GET_NEWEST_QUESTION', function () {
            app.getNewPosts();
        });
    }

    angular.module('KApp')
        .controller('QuestionsMultipleCtrl', ['$scope', '$http', 'mainSrv', '$location', '$filter', '$routeParams', '$timeout', QuestionsMultipleCtrl]);
})();