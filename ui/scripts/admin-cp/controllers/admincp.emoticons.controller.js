(function () {
    'use strict';

    angular.module('KApp')
        .controller('EmoCtrl', ['$scope', '$http', '$upload', 'ngTableParams', '$filter', '$kUtil', 'toaster', '$q', function ($scope, $http, $upload, NgTableParams, $filter, $kUtil, toaster, $q) {
            var emo = {};
            var files;

            /**
             * Private methods
             */
            function handleError(message, status) {
                toaster.pop('error', 'Error: ' + status, message);
            }

            emo.onFileSelect = function ($files) {
                files = $files;
            };

            emo.startUpload = function () {
                emo.uploading = true;
                var promises = [];

                angular.forEach(files, function (file) {
                    var promise = $upload.upload({
                        url: '/api/emoticons/upload',
                        method: 'post',
                        headers: {'my-header': 'my-header-value'},
                        data: {
                            myModel: '',
                            errorCode: 500,
                            errorMessage: 'An Error occur(custom)'
                        },
                        file: file,
                        fileFormDataName: 'myFile'
                    }).error(handleError);

                    promises.push(promise);
                });

                $q.all(promises).finally(function () {
                    emo.uploading = false;
                });
            };

            emo.tableParams = new NgTableParams(
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
                        var data = emo.list || [];
                        var sortedData = params.sorting() ?
                            $filter('orderBy')(data, params.orderBy()) :
                            data;

                        var filter = params.filter();
                        var finalData = params.filter() ? $kUtil.poweredFilter(sortedData, filter) : sortedData;

                        params.total(data.length);

                        $defer.resolve(finalData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    }
                }
            );

            emo.getAll = function () {
                $http.get('/api/emoticons').success(function (response) {
                    emo.list = response.data;
                    emo.tableParams.reload();
                }).error(handleError);
            };


            emo.deleteEmo = function (em) {
                $kUtil.showConfirmDialog($scope, 'Xác Nhận', 'Có chắc muốn xóa emo này không ?', function () {
                    $http.delete('/api/emoticons/' + em._id).success(function () {
                        toaster.pop('success', 'Success', 'Deleted emoticon successfully', 3000);
                        emo.getAll();
                    }).error(handleError);
                });
            };

            emo.updateEmo = function (em) {
                var requestData = {
                    id: em._id,
                    name: em.name,
                    shortcut: em.shortcut
                };
                $http.put('/api/emoticons', angular.toJson(requestData)).success(function () {
                    toaster.pop('success', 'Success', 'Updated emoticon successfully', 3000);
                    //emo.getAll();
                }).error(handleError);
            };

            emo.getAll();

            $scope.emo = emo;
        }]);
})();