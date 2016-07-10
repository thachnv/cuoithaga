(function () {
    'use strict';

    function UsersAdminCtrl($scope, $http, toaster, $kUtil, $filter, NgTableParams) {
        var users = {
            VIEWING: 0,
            CREATING: 1,
            EDITING: 2
        };

        var DEFAULT_REGISTER_INFO = {
            username: '',
            password: '',
            email: '',
            displayName: ''
        };

        function handleError(message, status) {
            toaster.pop('error', 'Error: ' + status, message);
        }

        var tableParams = new NgTableParams(
            {
                page: 1,
                count: 10,
                sorting: {
                    rating: 'asc'
                }
            },
            {
                total: 0,
                getData: function ($defer, params) {
                    var data = users.list || [];
                    var sortedData = params.sorting() ? $filter('orderBy')(data, params.orderBy()) : data;
                    var filter = params.filter();
                    var finalData = params.filter() ? $kUtil.poweredFilter(sortedData, filter) : sortedData;

                    params.total(data.length);

                    $defer.resolve(finalData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
            }
        );

        function getAll() {
            $http.get('/api/users').success(function (response) {
                users.list = response.data;
                tableParams.reload();
            }).error(handleError);
        }

        function changeMode(mode) {
            users.currentMode = mode;
        }

        function getAllRoles() {
            $http.get('/api/roles').success(function (response) {
                users.rolesList = response.data;
            });
        }

        function loadEditForm(user) {
            users.currentUserObj = user;
            changeMode(users.EDITING);
        }

        function editUser() {
            var requestObj = {
                _id: users.currentUserObj._id,
                role: users.currentUserObj.role._id,
                local: users.currentUserObj.local ? {
                    email: users.currentUserObj.local.email,
                    name: users.currentUserObj.local.name,
                    username: users.currentUserObj.local.username
                } : null
            };

            $http.put('/api/users', angular.toJson(requestObj)).success(function () {
                toaster.pop('success', 'Success', 'Updated User successfully', 3000);
                getAll();
                changeMode(users.VIEWING);
            }).error(handleError);

        }

        function createUser() {
            $http.post('/api/users', angular.toJson(users.currentRegisterObj)).success(function () {
                toaster.pop('success', 'Success', 'Created User successfully', 3000);
                users.currentRegisterObj = angular.copy(DEFAULT_REGISTER_INFO);
                getAll();
                changeMode(users.VIEWING);
            }).error(handleError);
        }

        function deleteUser(user) {
            $kUtil.showConfirmDialog($scope, 'Xác Nhận', 'Có chắc muốn xóa người dùng này không ?', function () {
                $http.delete('/api/users/' + user._id).success(function () {
                    toaster.pop('success', 'Success', 'Deleted User successfully', 3000);
                    getAll();
                }).error(handleError);
            });
        }

        function resetEditingPassword() {
            users.editingPassword = false;
            users.currentUserObj.password = '';
        }

        function changePassword() {
            if (users.currentUserObj.password) {
                var requestObj = {
                    _id: users.currentUserObj._id,
                    password: users.currentUserObj.password
                };
                $http.put('/api/users/password', angular.toJson(requestObj)).success(function () {
                    resetEditingPassword();
                }).error(handleError);
            }
        }

        getAll();
        getAllRoles();

        users.currentMode = users.VIEWING;
        users.tableParams = tableParams;
        users.currentRegisterObj = angular.copy(DEFAULT_REGISTER_INFO);

        users.changeMode = changeMode;
        users.getAll = getAll;
        users.loadEditForm = loadEditForm;
        users.editUser = editUser;
        users.createUser = createUser;
        users.deleteUser = deleteUser;
        users.changePassword = changePassword;
        users.resetEditingPassword = resetEditingPassword;

        $scope.users = users;
    }

    angular
        .module('KApp')
        .controller('UsersAdminCtrl', ['$scope', '$http', 'toaster', '$kUtil', '$filter', 'ngTableParams', UsersAdminCtrl]);
})();
