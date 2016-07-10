(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .controller('IndexController', ['apiService',
            function (apiService) {
                var vm = this;
                apiService.getProducts().then(function (response) {
                    vm.products = response.data;
                });
            }]);
}(angular));
