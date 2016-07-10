(function () {
    'use strict';

    function ImageEditCtrl($scope, $http, $timeout, $routeParams) {
        var image = {};

        //image.input = '/ui/images/icons/download.png';
        //image.textTop = 'Top ne';
        //image.textBottom = 'Bottom ne';

        var memeId = $routeParams.memeId;
        image.texts = [
            {
                content: '',
                position: {
                    top: 5,
                    left: 300
                },
                width: 580
            },
            {
                content: '',
                position: {
                    bottom: 100,
                    left: 300
                },
                width: 580
            }
        ];

        $http.get('/api/memes/' + memeId).success(function (response) {
            image.input = response.data.path;
            image.textTop = response.data.topText;
            image.textBottom = response.data.bottomText;
        });

        image.dataUrls = [];
        var files;
        image.onFileSelect = function ($files) {
            files = $files;
            var fileReader = new FileReader();
            fileReader.readAsDataURL($files[0]);

            fileReader.onload = function (e) {
                $timeout(function () {
                    image.input = e.target.result;
                });
            };
        };

        $scope.image = image;
    }

    angular.module('KApp')
        .controller('ImageEditCtrl', ['$scope', '$http', '$timeout', '$routeParams', ImageEditCtrl]);
})();
