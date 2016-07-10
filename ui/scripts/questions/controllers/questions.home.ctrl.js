'use strict';
(function () {
    angular.module('KApp')
        .run(['$anchorScroll', function ($anchorScroll) {
            $anchorScroll.yOffset = 50;   // always scroll by 50 extra pixels
        }])
        .directive('video', function () {
            return {
                restrict: 'E',
                link: function (scope, element) {
                    var eWrapper = element.parent();
                    var button = eWrapper.find('.play-button');
                    if (button) {
                        button.show();
                    }
                    element.mouseover(function () {
                        if (element.get(0).paused) {
                            if (button) {
                                button.hide();
                            }
                            element.get(0).play();
                        }
                    });
                    eWrapper.on('click', function () {
                        if (element.get(0).paused) {
                            if (button) {
                                button.hide();
                            }
                            element.get(0).play();
                        } else {
                            if (button) {
                                button.show();
                            }
                            element.get(0).pause();
                        }
                    });
                }
            };
        })
        .controller('QuestionHomeCtrl', ['$scope', '$http', '$routeParams', '$timeout', 'mainSrv', '$upload', '$anchorScroll', '$location',
            function ($scope, $http, $routeParams, $timeout, mainSrv, $upload, $anchorScroll, $location) {
                var questions = {};

                var DEFAULT_MODEL = {
                    title: '',
                    content: '',
                    media: null
                };

                questions.postingIdentity = 'member';

                var MODES = {
                    viewAll: {
                        template: '/ui/scripts/questions/templates/questions.multiple.template.html'
                    },
                    viewSingle: {
                        template: '/ui/scripts/questions/templates/questions.single.template.html'
                    }
                };

                var questionId = $routeParams.questionId;

                if (questionId && questionId.indexOf('_=_') === -1) {
                    questions.currentMode = MODES.viewSingle;
                } else {
                    questions.currentMode = MODES.viewAll;
                }


                questions.model = angular.copy(DEFAULT_MODEL);
                questions.currentUser = mainSrv.getCurrentUser();
                questions.list = [];

                //questions.getAll = function () {
                //    $http.get('/api/posts').success(function (response) {
                //        questions.list = response.data;
                //    });
                //};

                questions.dataUrls = [];
                var files;
                questions.onFileSelect = function ($files) {
                    files = $files;
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL($files[0]);

                    fileReader.onload = function (e) {
                        $timeout(function () {
                            questions.dataUrls[0] = e.target.result;
                        });
                    };
                };

                function handlePostingError(error) {
                    questions.postError = true;
                    questions.postErrorMsg = error;
                    questions.posting = false;

                    $timeout(function () {

                        var newHash = 'post-error';
                        if ($location.hash() !== newHash) {
                            $location.hash('post-error');
                        } else {
                            $anchorScroll();
                        }
                    });
                }

                function wantToPost(){
                    var newHash = 'ask-now-btn';
                    if ($location.hash() !== newHash) {
                        $location.hash(newHash);
                    } else {
                        $anchorScroll();
                    }
                }

                $scope.$on('WANT_TO_POST', wantToPost);

                questions.post = function () {
                    if (!questions.model.title || questions.model.title.trim() === '') {
                        handlePostingError('Tiêu đề bài viết không thể để trống !');
                        return;
                    }
                    questions.posting = true;
                    if (files && files[0]) {
                        $upload.upload({
                            url: '/api/files/images/upload',
                            method: 'post',
                            headers: {'my-header': 'my-header-value'},
                            data: {
                                myModel: '',
                                errorCode: 500,
                                errorMessage: 'Error'
                            },
                            file: files[0],
                            fileFormDataName: 'myFile'
                        }).then(function (response) {
                            var mediaInfo = response.data.data;
                            post(mediaInfo);
                        }, function (response) {
                            handlePostingError(response.data);
                        });
                    } else {
                        post();
                    }
                };

                function post(mediaInfo) {
                    if (mediaInfo) {
                        questions.model.media = mediaInfo;
                    }

                    if (!mediaInfo && (!questions.model.content || questions.model.title.trim().length < 32)) {
                        handlePostingError('Bài viết không có hình ảnh phải có độ dài 32 ký tự trở lên !');
                        return;
                    }

                    if (questions.postingIdentity === 'member') {
                        $http.post('/api/posts/member/create', angular.toJson(questions.model)).success(function (data) {
                            questions.showPostSuccess = true;
                            var timer = $timeout(function () {
                                questions.showPostSuccess = false;
                                $timeout.cancel(timer);
                                timer = null;
                            }, 3000);

                            questions.closePostForm();
                            $scope.$broadcast('GET_NEWEST_QUESTION');
                        }).error(function (err) {
                            handlePostingError(err);
                        }).finally(function () {
                            questions.posting = false;
                        });
                    }
                    if (questions.postingIdentity === 'anonymous') {
                        $http.post('/api/posts/public/create', angular.toJson(questions.model)).success(function (data) {
                            if (data.status === 'SUCCESS') {
                                questions.showPostSuccess = true;
                                var timer = $timeout(function () {
                                    questions.showPostSuccess = false;
                                    $timeout.cancel(timer);
                                    timer = null;
                                }, 2000);

                                questions.closePostForm();
                                $scope.$broadcast('GET_NEWEST_QUESTION');
                            }
                        }).error(function (err) {
                            handlePostingError(err);
                        }).finally(function () {
                            questions.posting = false;
                        });
                    }
                }

                questions.showPostForm = function () {
                    questions.isPostFormShown = true;
                    mainSrv.checkLogin(function () {
                        questions.currentUser = mainSrv.getCurrentUser();
                        if (questions.currentUser) {
                            questions.postingIdentity = 'member';
                        } else {
                            questions.postingIdentity = 'anonymous';
                        }
                    });
                };
                questions.closePostForm = function () {
                    questions.isPostFormShown = false;
                };

                questions.getTopUsers = function (num) {
                    $http.get('/api/users/top/' + num).success(function (response) {
                        questions.topUsers = response.data;
                    });
                };

                //init
                questions.recommendedPosts = [];
                questions.getRecommendedPosts = function(){
                    var query = '/api/posts/public/random' + '?number=10';

                    $http.get(query).success(function (response) {
                        angular.forEach(response.data, function (post) {
                            questions.recommendedPosts.push(post);
                        });
                    });
                };

                questions.getRecommendedPosts();
                //questions.getTopUsers(10);

                $scope.questions = questions;
            }]);
})();