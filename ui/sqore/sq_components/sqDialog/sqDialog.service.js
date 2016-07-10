(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .factory('sqDialogService', ['$rootScope', '$http', '$compile', '$controller', '$timeout', function ($rootScope, $http, $compile, $controller, $timeout) {
            var service = {},
                dialogScope,
                isDialogShowing = false;

            function DialogModel() {
                this.templateUrl = '';
                this.scopeVariables = {};
            }

            DialogModel.prototype.setTemplateUrl = function (templateUrl) {
                this.templateUrl = templateUrl;
                return this;
            };
            DialogModel.prototype.setScopeVariable = function (key, value) {
                this.scopeVariables[key] = value;
                return this;
            };
            DialogModel.prototype.setController = function (controller) {
                this.controller = controller;
                return this;
            };

            function clearDialog() {
                //Clear overlay with animation
                var overlayElement = angular.element('#overlay');
                overlayElement.css('opacity', 0);
                $timeout(overlayElement.remove.bind(overlayElement), 500);

                //Clear the old scope
                if (dialogScope) {
                    dialogScope.$destroy();
                    dialogScope = null;
                }

                //Clear the dialog content element
                angular.element('#product-detail').remove();
                angular.element('body').removeClass('stop-scrolling');
                isDialogShowing = false;
            }

            function createOverLay() {
                var overlayElement = angular.element('<div id="overlay" class="overlay" ></div>');
                overlayElement.on('click', clearDialog);
                angular.element('body').append(overlayElement);
                $timeout(function () {
                    overlayElement.css('opacity', 0.7);
                });
                //prevent scrolling while tje dialog is active
                angular.element('body').addClass('stop-scrolling');
            }

            service.dialogModelBuilder = function () {
                return new DialogModel();
            };

            service.showDialog = function (dialogModel) {
                //Clear the old dialog (if any)
                clearDialog();

                if (dialogModel.templateUrl) {
                    $http.get(dialogModel.templateUrl, {cache: true}).then(function (template) {
                        dialogScope = $rootScope.$new();

                        if (dialogModel.controller) {
                            //Extends the scope
                            $controller(dialogModel.controller, {$scope: dialogScope});
                        }

                        //Init scope variables (if any)
                        angular.forEach(dialogModel.scopeVariables, function (value, key) {
                            dialogScope[key] = value;
                        });

                        var compiledElement = $compile(template.data)(dialogScope);
                        createOverLay();
                        angular.element('body').append(compiledElement);
                        isDialogShowing = true;
                    });
                }
            };

            service.checkDialogShowing = function () {
                return isDialogShowing;
            };

            service.setCurrentDialogScopeVariable = function (key, value) {
                if (dialogScope) {
                    dialogScope[key] = value;
                }
            };

            return service;
        }]);
}(angular));