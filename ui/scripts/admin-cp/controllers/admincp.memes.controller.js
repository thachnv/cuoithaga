(function () {
    'use strict';

    angular.module('KApp')
        .controller('MemeManageCtrl', ['$scope', '$http', '$upload', 'ngTableParams', '$filter', '$kUtil', 'toaster', '$q', function ($scope, $http, $upload, NgTableParams, $filter, $kUtil, toaster, $q) {
            var meme = {};
            var files;

            /**
             * Private methods
             */
            function handleError(message, status){
                toaster.pop('error', 'Error: '+status, message );
            }

            meme.onFileSelect = function ($files) {
                files = $files;
            };

            meme.startUpload = function () {
                meme.uploading = true;
                var promises = [];

                angular.forEach(files, function (file) {
                    var promise = $upload.upload({
                        url: '/api/memes/upload',
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

                $q.all(promises).finally(function(){
                    meme.uploading = false;
                });
            };

            meme.tableParams = new NgTableParams(
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
                        var data = meme.list || [];
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

            meme.getAll = function () {
                $http.get('/api/memes').success(function (response) {
                    meme.list = response.data;
                    meme.tableParams.reload();
                }).error(handleError);
            };

            meme.deleteEmo = function (em) {
                $kUtil.showConfirmDialog($scope, 'Xác Nhận', 'Có chắc muốn xóa meme dùng này không ?', function () {
                    $http.delete('/api/memes/' + em._id).success(function () {
                        toaster.pop('success', 'Success', 'Deleted emoticon successfully', 3000);
                        meme.getAll();
                    }).error(handleError);
                });
            };

            meme.updateEmo = function (em) {
                var requestData = {
                    id: em._id,
                    name: em.name,
                    description: em.description,
                    topText: em.topText,
                    bottomText: em.bottomText
                };
                $http.put('/api/memes', angular.toJson(requestData)).success(function () {
                    toaster.pop('success', 'Success', 'Updated emoticon successfully', 3000);
                    //meme.getAll();
                }).error(handleError);
            };

            meme.getAll();

            $scope.meme = meme;
        }]);
})();