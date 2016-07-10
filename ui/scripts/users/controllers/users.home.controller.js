'use strict';

angular.module('KApp')
    .controller('UserHomeCtrl', ['$scope', '$http', 'mainSrv', function ($scope, $http, mainSrv) {
        var user = {};

        mainSrv.checkLogin(function () {
            user.currentUser = mainSrv.getCurrentUser();
        });

        $scope.user = user;

    }]);