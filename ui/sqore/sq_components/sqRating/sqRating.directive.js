(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .directive('sqRating', function () {
            return {
                restrict: 'E',
                require: 'ngModel',
                templateUrl: 'sq_components/sqRating/sqRating.template.html',
                link: function (scope, element, attr, ngModelController) {
                    scope.getValue = function () {
                        return ngModelController.$viewValue;
                    };
                    scope.getStyle = function () {
                        var val = ngModelController.$viewValue;
                        return {
                            width: isNaN(val) ? 0 : val * 20 + '%'
                        };
                    };
                }
            };
        });
}(angular));