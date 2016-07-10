(function (angular) {
    'use strict';
    angular
        .module('SqoreAssignmentApp')
        .constant('sqConstant', {
            apiUrl: {
                getProducts: 'data/products.json'
            },
            imageType: {
                primary: 'primary',
                model: 'model',
                detail: 'detail'
            },
            thousandSeparator: ',',
            moneyUnit: 'kr'
        });
}(angular));