(function () {
    'use strict';
    angular.module('myservices', [])
        .factory('mainSrv', ['$http', function ($http) {
            var currentUser = null;
            var emoticonsList = null;

            return {
                updateEmoticonsList: function () {
                    $http.get('/api/emoticons').success(function (response) {
                        emoticonsList = response.data;
                    });
                },
                getEmoticonsList: function () {
                    return emoticonsList;
                },
                setCurrentUser: function (user) {
                    currentUser = user;
                },
                getCurrentUser: function () {
                    return currentUser;
                },
                checkLogin: function (done) {
                    $http.get('/api/profile').success(function (response) {
                        if (response.status === 'ERROR') {
                            currentUser = null;
                        } else {
                            currentUser = response.data;
                        }
                    }).error(function(){
                        currentUser = null;
                    }).finally(function () {
                        done();
                    });
                }
            };
        }]);
})();
