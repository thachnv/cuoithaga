(function () {
    'use strict';

    function QuestionsSingleCtrl($scope, $http, $routeParams, $timeout, mainSrv, $location, $filter, $sce) {
        var question = {};

        var COMMENT_DEFAULT = {
            content: '',
            toPost: ''
        };

        var currentCommentPage = 1;
        var commentsPerPage = 10;

        question.GOOD = 1;
        question.BAD = -1;
        question.NEGATIVE = 0;

        question.ratingStatus = question.NEGATIVE;

        //question.currentUser = mainSrv.getCurrentUser();
        question.data = {};
        question.comments = [];
        question.commentModel = angular.copy(COMMENT_DEFAULT);
        var questionId = $routeParams.questionId;

        function checkRatedStatus(item) {
            if (question.currentUser) {
                for (var i = 0, iLen = item.goodRatings.length; i < iLen; i++) {
                    if (item.goodRatings[i].from === question.currentUser.info._id) {
                        return question.GOOD;
                    }
                }

                for (var j = 0, jLen = item.badRatings.length; j < jLen; j++) {
                    if (item.badRatings[j].from === question.currentUser.info._id) {
                        return question.BAD;
                    }
                }
            }
            return question.NEGATIVE;
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

        question.getById = function () {
            $http.get('/api/posts/public/single/' + questionId).success(function (response) {
                question.data = response.data;
                question.ratingStatus = checkRatedStatus(question.data.post);

                if(question.data.post.media){
                    question.youtubeUrl = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + question.data.post.media.youtubeId);
                }

                $scope.$emit('TITLE_CHANGED', question.data.post.title);

                $timeout(function(){
                    if(FB){
                        FB.XFBML.parse();
                    }
                });
            }).error(function () {
                $location.url('/');
            });
        };
        question.showQCommentForm = function () {
            if (question.currentUser) {
                question.currentUser = mainSrv.getCurrentUser();
                question.qCommentForm = true;
            } else {
                question.showCommentError = true;
            }
        };
        question.closeQCommentForm = function () {
            question.qCommentForm = false;
        };

        question.postComment = function () {
            question.commentModel.toPost = questionId;
            $http.post('/api/comments', angular.toJson(question.commentModel)).success(function () {
                question.showCommentSuccess = true;
                question.qCommentForm = false;
                var timer = $timeout(function () {
                    question.showCommentSuccess = false;
                    $timeout.cancel(timer);
                    timer = null;
                }, 3000);
                question.getComments();
                question.getById();
            }).error(function () {
                question.showCommentError = true;
            });
        };

        question.getComments = function () {
            question.loadingMoreComments = true;
            $http.get('api/comments/' + questionId + '?page=' + currentCommentPage + '&limit=' + commentsPerPage)
                .success(function (response) {
                    //question.comments = response.data;
                    angular.forEach(response.data, function (comment) {
                        comment.ratingStatus = checkRatedStatus(comment);
                        question.comments.push(comment);
                    });
                    question.loadingMoreComments = false;
                });
        };

        function loadMoreComments() {
            currentCommentPage++;
            question.getComments();
        }

        question.rateGoodQuestion = function () {

            var requestData = {
                id: question.data.post._id
            };

            $http.post('/api/posts/rate/good', angular.toJson(requestData)).success(function () {
                question.getById();
            });
        };

        question.rateBadQuestion = function () {
            var requestData = {
                id: question.data.post._id
            };
            $http.post('/api/posts/rate/bad', angular.toJson(requestData)).success(function () {
                question.getById();
            });
        };

        question.unRateQuestion = function () {
            var requestData = {
                id: question.data.post._id
            };

            $http.post('/api/posts/unrate', angular.toJson(requestData)).success(function () {
                question.getById();
            });
        };

        function updateComment(comment) {
            comment.ratingStatus = checkRatedStatus(comment);
            for (var i = 0; i < question.comments.length; i++) {
                if (question.comments[i]._id === comment._id) {
                    question.comments[i] = comment;
                }
            }
        }

        question.rateGoodComment = function (comment) {
            var requestData = {
                id: comment._id
            };

            $http.post('/api/comments/rate/good', angular.toJson(requestData)).success(function (response) {
                updateComment(response.data);
            });
        };

        question.rateBadComment = function (comment) {
            var requestData = {
                postId: question.data.post._id,
                id: comment._id
            };
            $http.post('/api/comments/rate/bad', angular.toJson(requestData)).success(function (response) {
                updateComment(response.data);
            });
        };

        question.unRateComment = function (comment) {
            var requestData = {
                id: comment._id
            };

            $http.post('/api/comments/unrate', angular.toJson(requestData)).success(function (response) {
                updateComment(response.data);
            });
        };

        question.getAva = function (user) {
            if (user) {
                if (user.google) {
                    return user.google.picture;
                } else if (user.facebook) {
                    return 'https://graph.facebook.com/' + user.facebook.id + '/picture?width=200&height=200&access_token=' + user.facebook.token;
                } else {
                    return '/ui/images/icons/dialog_question.png';
                }
            } else {
                return '/ui/images/icons/nacdanh.png';
            }
        };
        question.getName = function (user) {
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
        };

        question.goToNextPost = function(){
            $http.get('/api/posts/public/next/' + question.data.post._id).success(function(response){
                if(response.data && response.data.link){
                    $location.url('/view/'+response.data.link);
                }
            }).error(function(err){
                console.log(err);
            });
        };


        //init
        //question.getComments();
        mainSrv.checkLogin(function(){
            question.currentUser = mainSrv.getCurrentUser();
            if(question.currentUser){
                question.qCommentForm = true;
            }
            question.getById();
        });

        question.getDate = getDate;
        question.loadMoreComments = loadMoreComments;
        $scope.question = question;
        question.share = function (post) {
            FB.ui({
                method: 'share',
                href: 'http://cuoithaga.com/view/' + post.link
            }, function(){});
        };

        $scope.$emit('REFRESH');
    }

    angular.module('KApp')
        .controller('QuestionsSingleCtrl', ['$scope', '$http', '$routeParams', '$timeout', 'mainSrv', '$location', '$filter', '$sce', QuestionsSingleCtrl]);
})();