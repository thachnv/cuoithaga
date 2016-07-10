(function () {
    'use strict';

    angular.module('KApp')
        .controller('PostsCtrl', ['$scope', '$http', '$upload', '$timeout', '$filter', '$kUtil', 'ngTableParams', 'toaster', function ($scope, $http, $upload, $timeout, $filter, $kUtil, NgTableParams, toaster) {


            var posts = {};
            /**
             * Constants
             */
            posts.VIEWING = 0;
            posts.CREATING = 1;
            posts.EDITING = 2;
            posts.CATEGORY_TYPES = [
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
            posts.DEFAULT_OBJ = {
                title: '',
                content: '',
                category: posts.CATEGORY_TYPES[0].key
            };
            /**
             * Initial variables
             */
            posts.currentMode = posts.VIEWING;
            posts.list = [];
            posts.currentObj = angular.copy(posts.DEFAULT_OBJ);
            posts.languages = [
                {key: 'en', display: 'English'},
                {key: 'vi', display: 'Vietnamese'}
            ];
            /**
             * Private methods
             */
            function handleError(message, status) {
                toaster.pop('error', 'Error: ' + status, message);
            }

            /**
             * Methods
             */
            posts.tableParams = new NgTableParams(
                {
                    page: 1,
                    count: 10,
                    sorting: {
                        rating: 'asc'
                    }
                },
                {
                    total: 0,
                    getData: function ($defer, params) {
                        var sortedData = params.sorting() ?
                            $filter('orderBy')(posts.list, params.orderBy()) :
                            posts.list;

                        var filter = params.filter();
                        var finalData = params.filter() ? $kUtil.poweredFilter(sortedData, filter) : sortedData;

                        params.total(posts.list.length);

                        $defer.resolve(finalData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                }
            );

            posts.getAll = function () {
                posts.loading = true;
                $http.get('/api/posts/manage/all').success(function (response) {
                    posts.list = response.data;
                    posts.tableParams.reload();
                }).error(handleError);
            };

            posts.addTranslation = function () {
                posts.requestData.data.push({
                    content: '',
                    summary: '',
                    title: '',
                    language: 'en'
                });
            };

            posts.editPost = function () {
                $http.put('/api/posts/manage/update', angular.toJson(posts.currentObj)).success(function () {
                    toaster.pop('success', 'Success', 'Updated question successfully', 3000);
                    posts.changeMode(posts.VIEWING);
                    posts.getAll();
                }).error(handleError);
            };

            posts.deletePost = function (post) {
                $kUtil.showConfirmDialog($scope, 'Xác Nhận', 'Có chắc muốn xóa bài này không ?', function () {
                    $http.delete('/api/posts/manage/delete/' + post._id).success(function () {
                        toaster.pop('success', 'Success', 'Deleted question successfully', 3000);
                        posts.changeMode(posts.VIEWING);
                        posts.getAll();
                    }).error(handleError);
                });
            };

            posts.banPost = function (post) {
                $http.get('/api/posts/manage/ban/' + post._id).success(function () {
                    toaster.pop('success', 'Success', 'Ban question successfully', 3000);
                    posts.changeMode(posts.VIEWING);
                    posts.getAll();
                }).error(handleError);
            };

            posts.allowPost = function (post) {
                $http.get('/api/posts/manage/allow/' + post._id).success(function () {
                    toaster.pop('success', 'Success', 'Allow question successfully', 3000);
                    posts.changeMode(posts.VIEWING);
                    posts.getAll();
                }).error(handleError);
            };

            posts.changeMode = function (mode) {
                posts.currentMode = mode;
            };

            posts.loadEditForm = function (post) {
                if (post) {
                    posts.currentObj._id = post._id;
                    posts.currentObj.title = post.title;
                    posts.currentObj.link = post.link;
                    posts.currentObj.content = post.content;
                    posts.changeMode(posts.EDITING);
                }
            };

            posts.getAll();
            //bind to scope
            $scope.posts = posts;
        }]);
})();