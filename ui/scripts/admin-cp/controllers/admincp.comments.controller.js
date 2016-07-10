(function () {
    'use strict';
    angular.module('KApp')
        .controller('CommentsAdminCtrl', ['$scope', '$http', '$upload', '$timeout', 'ngTableParams', '$filter', '$parse', '$kUtil', 'toaster',
            function ($scope, $http, $upload, $timeout, NgTableParams, $filter, $parse, $kUtil, toaster) {
                var comments = {};
                /**
                 * Constants
                 */
                comments.VIEWING = 0;
                comments.CREATING = 1;
                comments.EDITING = 2;
                comments.DEFAULT_OBJ = {
                    content: ''
                };

                /**
                 * Initial variables
                 */
                comments.currentMode = comments.VIEWING;
                comments.list = [];
                comments.currentObj = angular.copy(comments.DEFAULT_OBJ);
                comments.languages = [
                    {key: 'en', display: 'English'},
                    {key: 'vi', display: 'Vietnamese'}
                ];
                /**
                 * Private methods
                 */
                function handleError(message, status){
                    toaster.pop('error', 'Error: '+status, message );
                }
                /**
                 * Methods
                 */
                comments.getAll = function () {
                    $http.get('/api/comments').success(function (response) {
                        comments.list = response.data;
                        comments.tableParams.reload();
                    }).error(handleError);
                };

                comments.tableParams = new NgTableParams(
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
                                $filter('orderBy')(comments.list, params.orderBy()) :
                                comments.list;

                            var filter = params.filter();
                            var finalData = params.filter() ? $kUtil.poweredFilter(sortedData, filter) : sortedData;

                            params.total(comments.list.length);

                            $defer.resolve(finalData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                        }
                    }
                );

                comments.editComment = function () {
                    $http.put('/api/comments', angular.toJson(comments.currentObj)).success(function () {
                        toaster.pop('success', 'Success', 'Updated comment successfully', 3000);
                        comments.changeMode(comments.VIEWING);
                        comments.getAll();
                    }).error(handleError);
                };

                comments.deleteComment = function (comment) {
                    $kUtil.showConfirmDialog($scope, 'Xác Nhận', 'Có chắc muốn xóa bình luận này không ?', function () {
                        $http.delete('/api/comments/delete/' + comment._id).success(function () {
                            comments.getAll();
                        }).error(handleError);
                    });
                };

                comments.changeMode = function (mode) {
                    comments.currentMode = mode;
                };

                comments.loadEditForm = function (comment) {
                    if (comment) {
                        comments.currentObj._id = comment._id;
                        comments.currentObj.content = comment.content;
                        comments.changeMode(comments.EDITING);
                    }
                };

                comments.getAll();
                $scope.comments = comments;
            }]);
})();