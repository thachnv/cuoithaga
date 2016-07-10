(function () {
    'use strict';

    angular.module('KApp')
        .filter('emoticons', ['mainSrv', function (mainSrv) {
            var eList = mainSrv.getEmoticonsList();

            return function (input) {
                if (eList) {
                    if (input) {
                        var retVal = input;
                        for (var i = 0; i < eList.length; i++) {
                            var shortcut = eList[i].shortcut;
                            if (shortcut) {
                                retVal = retVal.split(shortcut).join('<img src=' + eList[i].path + '>');
                            }
                        }
                        return retVal;
                    }
                }
                return input;
            };
        }]);
})();