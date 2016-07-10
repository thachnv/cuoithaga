(function () {
    'use strict';

    angular
        .module('SqoreAssignmentApp')
        .controller('sqProductDetailController', ['$scope', 'sqProductService',
            function ($scope, sqProductService) {
                $scope.selectImage = function (image) {
                    $scope.selectedImage = image;
                };
                $scope.getPrimaryImage = sqProductService.getPrimaryImage;
                $scope.formatMoney = sqProductService.formatMoney;
            }]);
})();
