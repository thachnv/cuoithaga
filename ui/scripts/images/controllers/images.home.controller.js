(function () {
    'use strict';

    function ImageHomeCtrl($scope, $http) {
        var imageHome = {};
        imageHome.list = [];

        $http.get('/api/memes').success( function(response){
           imageHome.list = response.data;
        });

        $scope.imageHome = imageHome;
    }

    angular.module('KApp')
        .controller('ImageHomeCtrl', ['$scope', '$http', ImageHomeCtrl]);
})();
