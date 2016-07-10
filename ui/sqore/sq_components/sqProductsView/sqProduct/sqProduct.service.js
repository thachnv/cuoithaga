(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .factory('sqProductService', ['$http', 'sqConstant', function ($http, sqConstant) {
            var service = {};

            service.getPrimaryImage = function (product) {
                if (!product.primaryImage) {
                    var images = product.images;
                    for (var i = 0, len = images.length; i < len; i++) {
                        if (images[i].type === sqConstant.imageType.primary) {
                            //cache the primary image so that next time we won't need to find it again
                            product.primaryImage = images[i];
                            return images[i];
                        }
                    }
                } else {
                    return product.primaryImage;
                }
            };

            service.formatMoney = function (number) {
                return number.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1' +
                        sqConstant.thousandSeparator) + ' ' + sqConstant.moneyUnit;
            };

            return service;
        }]);
}(angular));