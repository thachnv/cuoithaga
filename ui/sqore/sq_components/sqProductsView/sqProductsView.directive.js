(function (angular) {
    'use strict';

    angular
        .module('SqoreAssignmentApp')
        .directive('sqProductsView', ['sqDialogService', 'sqProductService', function (sqDialogService, sqProductService) {
            return {
                restrict: 'E',
                scope: true,
                templateUrl: 'sq_components/sqProductsView/sqProductsView.template.html',
                link: function (scope, element, attr) {

                    scope.currentSortProp = 'price';
                    scope.sortProps = [
                        {key: 'price', display: 'Price'},
                        {key: 'title', display: 'Title'}
                    ];
                    scope.imageSizes = {
                        small: 1,
                        large: 2
                    };
                    scope.currentImageSize = scope.imageSizes.large;

                    scope.sortOrders = {
                        asc: 1,
                        desc: 2
                    };
                    scope.currentSortOrder = scope.sortOrders.asc;

                    function showNextProductDetail(currentProductIdx) {
                        var nextProductIdx = currentProductIdx >= scope.productList.length - 1 ? 0 : currentProductIdx + 1,
                            nextProduct = scope.productList[nextProductIdx];
                        if (nextProduct && sqDialogService.checkDialogShowing()) {
                            sqDialogService.setCurrentDialogScopeVariable('product', nextProduct);
                            sqDialogService.setCurrentDialogScopeVariable('productIndex', nextProductIdx);
                            sqDialogService.setCurrentDialogScopeVariable('selectedImage', null);
                        }
                    }

                    function showPreviousProductDetail(currentProductIdx) {
                        var previousProductIdx = currentProductIdx <= 0 ? scope.productList.length - 1 : currentProductIdx - 1,
                            previousProduct = scope.productList[previousProductIdx];
                        if (previousProduct && sqDialogService.checkDialogShowing()) {
                            sqDialogService.setCurrentDialogScopeVariable('product', previousProduct);
                            sqDialogService.setCurrentDialogScopeVariable('productIndex', previousProductIdx);
                            sqDialogService.setCurrentDialogScopeVariable('selectedImage', null);
                        }
                    }

                    var productDetailDialogModel = sqDialogService
                        .dialogModelBuilder()
                        .setTemplateUrl('sq_components/sqProductsView/sqProduct/sqProduct.detail.template.html')
                        .setController('sqProductDetailController')
                        .setScopeVariable('showNextProduct', showNextProductDetail)
                        .setScopeVariable('showPreviousProduct', showPreviousProductDetail);

                    function showProductDetail(product, index) {
                        productDetailDialogModel.setScopeVariable('product', product);
                        productDetailDialogModel.setScopeVariable('productIndex', index);
                        sqDialogService.showDialog(productDetailDialogModel);
                    }

                    function sortProductList(prop, order) {
                        scope.productList.sort(function (a, b) {
                            if (a[prop] > b[prop]) {
                                return order === scope.sortOrders.desc ? -1 : 1;
                            }
                            if (a[prop] < b[prop]) {
                                return order === scope.sortOrders.desc ? 1 : -1;
                            }
                            // a must be equal to b
                            return 0;
                        });
                    }

                    scope.changeImageSize = function (size) {
                        scope.currentImageSize = size;
                    };

                    scope.onChangeSortProp = function () {
                        sortProductList(scope.currentSortProp, scope.currentSortOrder);
                    };
                    scope.changeSortOrder = function () {
                        scope.currentSortOrder =
                            scope.currentSortOrder === scope.sortOrders.asc ? scope.sortOrders.desc : scope.sortOrders.asc;
                        sortProductList(scope.currentSortProp, scope.currentSortOrder);
                    };
                    scope.onMouseOverProductImage = function (product, index) {
                        showProductDetail(product, index);
                    };

                    scope.formatMoney = sqProductService.formatMoney;
                    scope.getPrimaryImage = sqProductService.getPrimaryImage;

                    scope.$watch(attr.productList, function () {
                        scope.productList = scope.$eval(attr.productList);
                        if (scope.productList) {
                            sortProductList(scope.currentSortProp, scope.currentSortOrder);
                        }
                    });
                }
            };
        }]);
}(angular));