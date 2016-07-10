(function () {
    'use strict';

    angular.module('KApp', ['ngRoute', 'ngSanitize', 'angularFileUpload', 'myservices', 'ngTable', 'toaster'])
        .config(['$routeProvider', '$locationProvider',
            function ($routeProvider, $locationProvider) {
                $routeProvider
                    .when('/admin-cp', {
                        templateUrl: '/ui/scripts/admin-cp/templates/admincp.template.html',
                        controller: 'AdminCpCtrl'
                    })
                    .when('/', {
                        templateUrl: '/ui/scripts/questions/templates/questions.home.template.html',
                        controller: 'QuestionHomeCtrl'
                    })
                    .when('/view/:questionId', {
                        templateUrl: '/ui/scripts/questions/templates/questions.home.template.html',
                        controller: 'QuestionHomeCtrl'
                    })
                    .when('/questions/:questionId', {
                        templateUrl: '/ui/scripts/questions/templates/questions.home.template.html',
                        controller: 'QuestionHomeCtrl'
                    })
                    .when('/profile', {
                        templateUrl: '/ui/scripts/users/templates/users.home.template.html',
                        controller: 'UserHomeCtrl'
                    })
                    .when('/che-anh', {
                        templateUrl: '/ui/scripts/images/templates/images.home.template.html',
                        controller: 'ImageHomeCtrl'
                    })
                    .when('/che-anh/:memeId', {
                        templateUrl: '/ui/scripts/images/templates/images.edit.template.html',
                        controller: 'ImageEditCtrl'
                    })
                    .when('/:viewMode', {
                        templateUrl: '/ui/scripts/questions/templates/questions.home.template.html',
                        controller: 'QuestionHomeCtrl'
                    })
                    .otherwise({
                        redirectTo: '/'
                    });
                $locationProvider.html5Mode(true);
            }]);
})();