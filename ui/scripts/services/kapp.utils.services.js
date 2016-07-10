(function () {
    'use strict';
    angular.module('myservices')
        .factory('$kUtil', ['$http', '$filter', '$parse', '$compile', function ($http, $filter, $parse, $compile) {

            return {
                poweredFilter: function(data, filterObj){
                    return $filter('filter')(data, function (item) {
                        for (var prop in filterObj) {
                            if (filterObj.hasOwnProperty(prop)) {

                                var filterValue = filterObj[prop];
                                var associatedValue = $parse(prop)(item);

                                if (filterValue) {
                                    if (typeof associatedValue === 'undefined' || associatedValue === null) {
                                        return false;
                                    }
                                    if (associatedValue.toString().toLowerCase().indexOf(filterValue.toLowerCase()) < 0) {
                                        return false;
                                    }
                                }
                            }
                        }
                        return true;
                    });
                },
                showConfirmDialog: function(scope, header, content, _confirmCb){
                    var template = '/ui/templates/services/dialog/confirm.dialog.template.html';
                    var newScope = scope.$new();
                    newScope.header = header;
                    newScope.content = content;
                    newScope.confirmCb = _confirmCb;
                    var appendedTemplate;
                    var compiledTemplate;
                    $http.get(template).success(function(response){
                        appendedTemplate = angular.element(response).appendTo('body');
                        compiledTemplate = $compile(appendedTemplate)(newScope);
                        compiledTemplate.modal('show');

                        compiledTemplate.on('hidden.bs.modal', function () {
                            compiledTemplate.remove();
                            newScope.$destroy();
                        });

                    });
                }
            };
        }]);
})();
