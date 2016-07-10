(function () {
    'use strict';

    var kt = {};

    kt.millisecondsToSeconds = function (milliseconds) {
        milliseconds = milliseconds / 1000;
        return Math.floor(milliseconds % 60);
    };

    kt.millisecondsToMinutes = function (milliseconds) {
        milliseconds = milliseconds / 1000;
        milliseconds /= 60;
        return Math.floor(milliseconds % 60);
    };

    kt.millisecondsToHours = function (num) {
        num = num / 1000;
        num /= 60;
        num /= 60;
        return Math.floor(num % 24);
    };

    kt.millisecondsToDays = function (num) {
        num = num / 1000;
        num /= 60;
        num /= 60;
        num /= 24;
        return Math.floor(num);
    };

    function isFunction(f) {
        return typeof f === 'function';
    }

    function multiSort(list, order, fields) {

        function sort(a, b) {
            for (var i = 0, len = fields.length; i < len; i++) {
                var aVal = isFunction(a[fields[i]]) ? a[fields[i]](a) : a[fields[i]];
                var bVal = isFunction(b[fields[i]]) ? b[fields[i]](b) : b[fields[i]];

                if (aVal === bVal && i !== len - 1) {
                    continue;
                } else if (aVal !== bVal && i !== len - 1) {
                    return (aVal < bVal) ? -1 : 1;
                }

                return (aVal < bVal) ? -1 : (aVal > bVal) ? 1 : 0;
            }
        }

        order = order ? order : 'asc';

        list.sort(function (a, b) {
            if (order === 'asc') {
                return sort(a, b);
            } else {
                return sort(b, a);
            }
        });
    }


    kt.multiSort = multiSort;

    kt.isFunction = isFunction;

    window.kt = kt;
})();