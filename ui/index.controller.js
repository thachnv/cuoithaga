(function () {
    'use strict';

    angular.module('KApp')
        .controller('IndexCtrl', ['$scope', '$http', '$location', '$window', 'mainSrv', '$route', '$routeParams', '$timeout', '$upload', '$sce',
            function ($scope, $http, $location, $window, mainSrv, $route, $routeParams, $timeout, $upload, $sce) {
                var index = {};

                var DEFAULT_REGISTER_INFO = {
                    username: '',
                    password: '',
                    confirmPassword: '',
                    email: ''
                };

                index.currentLoginInfo = {};
                index.currentRegisterInfo = angular.copy(DEFAULT_REGISTER_INFO);
                index.currentUser = null;

                function checkLogin() {
                    index.loading = true;
                    mainSrv.checkLogin(function () {
                        index.currentUser = mainSrv.getCurrentUser();
                        index.loading = false;
                    });
                }

                checkLogin();

                index.logout = function () {
                    $http.get('/api/logout').success(function () {
                        $scope.$broadcast('LOGGED_OUT');
                        $route.reload();
                        checkLogin();
                        mainSrv.setCurrentUser(null);
                    });
                };

                index.login = function () {
                    $http.post('/api/users/login', angular.toJson(index.currentLoginInfo)).success(function () {
                        index.currentLoginInfo = {};
                        checkLogin();
                    }).error(function () {
                        checkLogin();
                    });
                };

                index.signUp = function () {
                    $http.post('/api/users/signup', angular.toJson(index.currentRegisterInfo)).success(function () {
                        index.currentRegisterInfo = angular.copy(DEFAULT_REGISTER_INFO);
                        checkLogin();
                    }).error(checkLogin);
                };


                index.facebookLogin = function () {
                    $window.location.href = '/api/auth/facebook';
                };
                index.googleLogin = function () {
                    $window.location.href = '/api/auth/google';
                };

                index.title = 'Xả Stress';

                index.showPost = function () {
                    $scope.$broadcast('WANT_TO_POST');
                };

                /* Creating a post*/

                var DEFAULT_MODEL = {
                    title: '',
                    content: '',
                    media: null,
                    category: 'funny'
                };

                index.CATEGORY_TYPES = [
                    {
                        name: 'Vui Nhộn',
                        key: 'funny'
                    },
                    {
                        name: 'Gái Xinh',
                        key: 'girl'
                    },
                    {
                        name: 'Trai Đẹp',
                        key: 'boy'
                    }
                ];

                index.MEDIA_TYPES = {
                    YOUTUBE: 'youtube',
                    IMAGE: 'image'
                };

                index.currentPost = angular.copy(DEFAULT_MODEL);
                index.postingIdentity = 'member';
                index.postingMediaType = index.MEDIA_TYPES.IMAGE;

                index.checkLogin = function () {
                    mainSrv.checkLogin(function () {
                        index.currentUser = mainSrv.getCurrentUser();
                        if (index.currentUser) {
                            index.postingIdentity = 'member';
                        } else {
                            index.postingIdentity = 'anonymous';
                        }
                    });
                };


                function handlePostingError(error) {
                    index.postError = true;
                    index.postErrorMsg = error;
                    index.posting = false;
                    $('.modal').animate({
                        scrollTop: 0
                    }, 200);
                }

                index.dataUrls = [];
                var files;
                index.onFileSelect = function ($files) {
                    index.imgSrc = null;
                    files = $files;
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL($files[0]);

                    fileReader.onload = function (e) {
                        $timeout(function () {
                            index.dataUrls[0] = e.target.result;
                        });
                    };
                };

                function resetPostData() {
                    index.currentPost = angular.copy(DEFAULT_MODEL);
                    files = null;
                    index.dataUrls = [];
                    index.imgSrc = null;
                }

                index.showPostForm = function () {
                    index.showPostSuccess = false;
                };

                index.onShowingPostForm = function () {
                    index.checkLogin();
                    index.showPostForm();
                };

                function dataURItoBlob(dataURI) {
                    var binary = atob(dataURI.split(',')[1]);
                    var array = [];
                    for (var i = 0; i < binary.length; i++) {
                        array.push(binary.charCodeAt(i));
                    }
                    return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
                }

                index.post = function () {
                    if (!index.currentPost.title || index.currentPost.title.trim() === '') {
                        handlePostingError('Tiêu đề bài viết không thể để trống !');
                        return;
                    }
                    index.posting = true;
                    if (index.postingMediaType === index.MEDIA_TYPES.IMAGE) {
                        if ((files && files[0]) || index.imgSrc) {

                            var requestObj = {
                                url: '/api/files/images/upload',
                                method: 'post',
                                headers: {'my-header': 'my-header-value'},
                                data: {
                                    myModel: '',
                                    errorCode: 500,
                                    errorMessage: 'Error'
                                },
                                file: index.imgSrc ? dataURItoBlob(index.imgSrc) : files[0],
                                fileFormDataName: 'myFile'
                            };

                            if (index.imgSrc) {
                                requestObj.fileName = 'myFile.jpg';
                            }

                            $upload.upload(requestObj).then(function (response) {
                                var mediaInfo = response.data.data;
                                post(mediaInfo);
                            }, function (response) {
                                handlePostingError(response.data);
                            });
                        } else {
                            post();
                        }
                    } else {
                        if (index.youtubeRawUrl) {
                            var media = {
                                media_type: 'video/youtube',
                                youtubeId: getYouTubeId(index.youtubeRawUrl)
                            };
                            post(media);
                        } else {
                            post();
                        }
                    }
                };

                function post(mediaInfo) {
                    if (mediaInfo) {
                        index.currentPost.media = mediaInfo;
                    }

                    if (!mediaInfo && (!index.currentPost.content || index.currentPost.content.trim().length < 32)) {
                        handlePostingError('Bài viết không có hình ảnh phải có độ dài 32 ký tự trở lên !');
                        return;
                    }

                    if (index.postingIdentity === 'member') {
                        $http.post('/api/posts/member/create', angular.toJson(index.currentPost)).success(function () {
                            index.showPostSuccess = true;
                            index.postSuccessMsg = 'Đăng bài thành công.';

                            resetPostData();
                            $scope.$broadcast('GET_NEWEST_QUESTION');
                        }).error(function (err) {
                            handlePostingError(err);
                        }).finally(function () {
                            index.posting = false;
                        });
                    }
                    if (index.postingIdentity === 'anonymous') {
                        $http.post('/api/posts/public/create', angular.toJson(index.currentPost)).success(function (data) {
                            if (data.status === 'SUCCESS') {
                                index.showPostSuccess = true;
                                index.postSuccessMsg = 'Đăng bài thành công.';

                                $scope.$broadcast('GET_NEWEST_QUESTION');
                            }
                            resetPostData();
                        }).error(function (err) {
                            handlePostingError(err);
                        }).finally(function () {
                            index.posting = false;
                        });
                    }
                }

                function getYouTubeId(url) {
                    var ID = '';
                    url = url.replace(/(>|<)/gi, '').split(/(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/);
                    if (url[2] !== undefined) {
                        ID = url[2].split(/[^0-9a-z_]/i);
                        ID = ID[0];
                    }
                    else {
                        ID = url;
                    }
                    return ID;
                }

                $scope.$watch('index.youtubeRawUrl', function (newVal) {
                    if (newVal) {
                        index.youtubeUrl = $sce.trustAsResourceUrl('https://www.youtube.com/embed/' + getYouTubeId(newVal));
                    }
                });

                //index.youtubeLink = $sce.trustAsResourceUrl('https://www.youtube.com/embed/eVTXPUF4Oz4');
                /* End creating a post*/

                index.toHomePage = function(){
                    $location.url('/');
                    $route.reload();
                };

                mainSrv.updateEmoticonsList();

                $scope.$on('TITLE_CHANGED', function (obj, post) {
                    index.title = post;
                });

                $scope.$on('VIEW_MODE_CHANGED', function (obj, viewMode) {
                    index.currentViewMode = viewMode;
                });

                $scope.$on('LOGGED_IN', function () {
                    index.currentUser = mainSrv.getCurrentUser();
                    //index.currentUser.info = data;
                });

                //bind to scope
                $scope.index = index;
            }]);
})();
