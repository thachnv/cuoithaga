(function () {
    'use strict';

    angular.module('KApp')
        .controller('AdminCpCtrl', ['$scope', '$http', 'mainSrv', function ($scope, $http, mainSrv) {
            var adminCp = {};

            adminCp.currentMenu = {};
            adminCp.currentLoginInfo = {
                username: 'admin',
                password: ''
            };

            adminCp.menu = [
                {
                    id: 'usersMng',
                    title: 'Manage Users',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.users.template.html',
                    iconClass: 'fa fa-lg fa-group'
                },
                {
                    id: 'postMng',
                    title: 'Manage Questions',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.posts.template.html',
                    iconClass: 'fa fa-lg fa-edit'
                },
                {
                    id: 'cmtMng',
                    title: 'Manage Comments',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.comments.template.html',
                    iconClass: 'fa fa-lg fa-comment'
                },
                {
                    id: 'emoMng',
                    title: 'Manage Emoticons',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.emoticons.template.html',
                    iconClass: 'fa fa-lg fa-smile-o'
                },
                {
                    id: 'memeMng',
                    title: 'Manage Memes',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.memes.template.html',
                    iconClass: 'fa fa-lg fa-smile-o'
                },
                {
                    id: 'roleMng',
                    title: 'Manage Roles',
                    templateUrl: '/ui/scripts/admin-cp/templates/admincp.roles.template.html',
                    iconClass: 'fa fa-lg fa-group'
                }
            ];

            adminCp.currentMenu = adminCp.menu[0];


            adminCp.onMenuClick = function (menu) {
                adminCp.currentMenu = menu;
            };

            adminCp.checkLogin = function () {
                $http.get('/api/profile').success(function (response) {
                    if (response.status === 'SUCCESS') {
                        var info = response.data.info;
                        adminCp.isAdmin = info.root || info.role.name.indexOf('admin') > -1;
                        mainSrv.setCurrentUser(response.data);
                        $scope.$emit('LOGGED_IN', info);
                    } else {
                        adminCp.isAdmin = false;
                    }

                }).error(function (err) {
                    console.log(err);
                });
            };

            adminCp.login = function () {
                $http.post('/api/users/login', angular.toJson(adminCp.currentLoginInfo)).success(function () {
                    adminCp.currentLoginInfo = {};
                    adminCp.checkLogin();
                }).error(function () {
                    adminCp.checkLogin();
                });
            };

            adminCp.checkLogin();

            $scope.$on('LOGGED_OUT', adminCp.checkLogin);

            //Bind model to scope
            $scope.adminCp = adminCp;

        }]);
})();