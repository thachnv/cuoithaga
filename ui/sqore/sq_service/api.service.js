(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .factory('apiService', ['$http', 'sqConstant', function ($http, sqConstant) {
            var service = {};
            /**
             * Call api and return promise
             */
            service.getProducts = function () {
                return $http.get(sqConstant.apiUrl.getProducts);
            };

            return service;
        }]);
}(angular));