(function () {
    'use strict';

    angular.module('KApp')
        .controller('RolesManageCtrl', ['$scope', '$http', '$upload', '$timeout', function ($scope, $http, $upload, $timeout) {
            var roles = {
                VIEWING: 0,
                CREATING: 1,
                EDITING: 2,
                RESOURCES: [
                    {
                        name: 'Post',
                        key: 'post'
                    },
                    {
                        name: 'Comment',
                        key: 'comment'
                    },
                    {
                        name: 'User',
                        key: 'user'
                    },
                    {
                        name: 'Role',
                        key: 'role'
                    },
                    {
                        name: 'Emoticons',
                        key: 'emoticon'
                    },
                    {
                        name: 'Memes',
                        key: 'meme'
                    }
                ],
                PERMISSIONS: [
                    {
                        name: 'Create',
                        key: 'c'
                    },
                    {
                        name: 'Update',
                        key: 'u'
                    },
                    {
                        name: 'Delete',
                        key: 'd'
                    },
                    {
                        name: 'Read',
                        key: 'r'
                    }
                ],
                REQUEST_OBJ_DEFAULT: {
                    'name': 'admin1',
                    'permissions': [
                        {
                            'resourceName': 'post',
                            'can': [
                                {
                                    action: 'create',
                                    allow: true
                                },
                                {
                                    action: 'update',
                                    allow: true
                                },
                                {
                                    action: 'delete',
                                    allow: true
                                },
                                {
                                    action: 'read',
                                    allow: true
                                },
                                {
                                    action: 'update_mine',
                                    allow: true
                                },
                                {
                                    action: 'delete_mine',
                                    allow: true
                                },
                                {
                                    action: 'read_mine',
                                    allow: true
                                },
                                {
                                    action: 'read_aio',
                                    allow: true
                                }
                            ]
                        }
                    ]
                }
            };


            function getAll() {
                $http.get('/api/roles').success(function (response) {
                    roles.list = response.data;
                });
            }

            function getPermissions(role, resourceName) {
                for (var i = 0; i < role.permissions.length; i++) {
                    if (role.permissions[i].resourceName === resourceName) {
                        var temp = '';
                        for(var j = 0; j < role.permissions[i].can.length; j++){
                            if(role.permissions[i].can[j].allow){
                                temp += role.permissions[i].can[j].action + ', ';
                            }
                        }
                        if(temp !== ''){
                            return temp;
                        }
                    }
                }

                return 'N/A';
            }

            function changeMode(mode) {
                roles.currentMode = mode;
            }

            function createRole() {
                //console.log(angular.toJson(roles.currentRequestObj));
                $http.post('/api/roles', angular.toJson(roles.currentRequestObj)).success(function () {
                    changeMode(roles.VIEWING);
                    getAll();
                    roles.currentRequestObj = angular.copy(roles.REQUEST_OBJ_DEFAULT);
                });
            }

            function loadEditForm(role) {
                roles.currentRequestObj = angular.copy(role);
                changeMode(roles.EDITING);
            }

            function updateRole() {
                //console.log(angular.toJson(roles.currentRequestObj));
                $http.put('/api/roles', angular.toJson(roles.currentRequestObj)).success(function () {
                    changeMode(roles.VIEWING);
                    getAll();
                    roles.currentRequestObj = angular.copy(roles.REQUEST_OBJ_DEFAULT);
                });
            }

            function addResource() {
                var nextResourceName = '';

                roles.currentRequestObj.permissions.push({
                    'resourceName': nextResourceName,
                    'can': [
                        {
                            action: 'create',
                            allow: true
                        },
                        {
                            action: 'update',
                            allow: true
                        },
                        {
                            action: 'delete',
                            allow: true
                        },
                        {
                            action: 'read',
                            allow: true
                        },
                        {
                            action: 'update_mine',
                            allow: true
                        },
                        {
                            action: 'delete_mine',
                            allow: true
                        },
                        {
                            action: 'read_mine',
                            allow: true
                        },
                        {
                            action: 'read_aio',
                            allow: true
                        }
                    ]
                });
            }

            getAll();
            roles.currentRequestObj = angular.copy(roles.REQUEST_OBJ_DEFAULT);
            roles.currentMode = roles.VIEWING;
            roles.changeMode = changeMode;
            roles.getAll = getAll;
            roles.getPermissions = getPermissions;
            roles.createRole = createRole;
            roles.addResource = addResource;
            roles.loadEditForm = loadEditForm;
            roles.updateRole = updateRole;
            $scope.roles = roles;
        }]);
})();