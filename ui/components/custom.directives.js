'use strict';

(function () {
    angular.module('KApp')
        .directive('showDialog', ['$http', '$compile', '$parse', function ($http, $compile, $parse) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {
                    var onShow;
                    if (attr.onShow) {
                        onShow = $parse(attr.onShow)(scope);
                    }
                    element.bind('click', function () {
                        if (typeof onShow === 'function') {
                            onShow();
                        }
                        $http.get(attr.showDialog).success(function (data) {
                            var template = $(data).appendTo('body');
                            $compile(template.contents())(scope);
                            template.modal('show');

                            template.on('hidden.bs.modal', function () {
                                template.remove();
                            });
                        });

                    });
                }

            };
        }])
        .directive('popOver', ['$http', '$compile', function ($http, $compile) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {

                    var superDiv = '<div style="position: fixed; top: 0; bottom: 0; left:0; right: 0; z-index:98"></div>';

                    $http.get(attr.popOver).success(function (data) {
                        var template = $compile(data)(scope);
                        $(element).popover({
                            placement: function () {
                                var eTop = $(element).offset().top; //get the offset top of the element
                                var top = eTop - $(window).scrollTop(); //position of the ele w.r.t window

                                if (top < 500) {
                                    return 'bottom';
                                }

                                return 'top';
                            },
                            container: 'body',
                            title: attr.popOverTitle,
                            template: template,
                            content: function () {
                                return $compile(template.find('.popover-content').html())(scope);
                                //return $compile(template.find('.popover-content').html())(scope);
                            },
                            html: true,
                            trigger: 'manual'
                        });

                        element.bind('click', function () {
                            element.popover('show');

                            var div = $(superDiv).appendTo('body');
                            var close = template.find('.popover-close');

                            div.on('click', function () {
                                div.remove();
                                element.popover('hide');
                                close.off('click');
                            });

                            close.on('click', function () {
                                if (div) {
                                    div.remove();
                                    element.popover('hide');
                                    close.off('click');
                                }
                            });
                        });
                    });
                }

            };
        }])
        .directive('lazyLoad', ['$window', '$document', '$parse', function ($window, $document, $parse) {
            return function (scope, element, attr) {
                var windowE = angular.element($window);
                var documentE = angular.element($document);

                windowE.bind('scroll', function () {

                    var offsetTop = element.offset().top;
                    var offsetBottom = documentE.height() - element.height() - offsetTop;
                    var fixedFooterHeight = scope[attr.fixedFooterHeight];
                    if (!fixedFooterHeight) {
                        fixedFooterHeight = 0;
                    }

                    //Load when user see the tail of the element
                    if (windowE.scrollTop() + windowE.height() >= documentE.height() - offsetBottom + fixedFooterHeight && !$parse(attr.isLoading)(scope)) {
                        scope.$apply(attr.lazyLoad);
                    }
                });
            };
        }])
        .directive('bindCkeditor', ['$timeout', function ($timeout) {
            return {
                restrict: 'A',
                require: '?ngModel',
                link: function (scope, element, attr, ngModel) {

                    var config = {};

                    var mini = attr.bindCkeditor === 'mini';
                    var size = Number(attr.bindCkeditor);

                    if (attr.bindCkeditor !== 'mini') {
                        config.toolbar = [
                            {
                                name: 'document',
                                groups: ['mode', 'document', 'doctools'],
                                items: ['Source', '-', 'Save', 'NewPage', 'Preview', 'Print', '-', 'Templates']
                            },
                            {
                                name: 'basicstyles',
                                groups: ['basicstyles', 'cleanup'],
                                items: ['Bold', 'Italic', 'Underline', 'Strike', 'Subscript', 'Superscript', '-', 'RemoveFormat']
                            },
                            {
                                name: 'paragraph',
                                groups: ['list', 'indent', 'blocks', 'align', 'bidi'],
                                items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BidiLtr', 'BidiRtl', 'Language']
                            },
                            {name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize']}
                            //{name: 'insert', items: ['Image']}

                        ];
                    } else {
                        config.toolbar = [];
                    }

                    config.enterMode = CKEDITOR.ENTER_BR;
                    config.removePlugins = 'elementspath';
                    config.resize_enabled = false;
                    config.uiColor = '#3071a9';
                    config.skin = 'office2013';
                    config.extraPlugins = 'confighelper,autogrow';
                    //config.filebrowserBrowseUrl = '/api/files/upload';
                    //config.filebrowserUploadUrl = '/api/files/images/upload';
                    //config.filebrowserImageBrowseUrl = '/api/files/upload';
                    //config.filebrowserImageUploadUrl = '/api/files/images/upload';
                    //config.filebrowserWindowWidth = 800;
                    //config.filebrowserWindowHeight = 500;
                    config.image_previewText = 'Nội dung của bạn';
                    config.language = 'vi';

                    //window.opener.CKEDITOR.tools.callFunction(function(a){
                    //    console.log(a);
                    //},url);


                    if (!isNaN(size) && size > 0) {
                        config.height = size;
                        config.autoGrow_minHeight = size;
                    }

                    if (mini) {
                        config.height = 70;
                        config.autoGrow_minHeight = 70;
                        config.removePlugins = 'toolbar,elementspath';
                        config.resize_enabled = false;
                    }

                    var ck = CKEDITOR.replace(element[0], config);

                    if (!ngModel) {
                        return;
                    }


                    ck.on('pasteState', function () {
                        scope.$apply(function () {
                            ngModel.$setViewValue(ck.getData());
                        });
                    });

                    ngModel.$render = function () {
                        ck.setData(ngModel.$viewValue);
                    };

                    scope.$on('$destroy', function () {
                        ck.removeAllListeners();
                        CKEDITOR.remove(ck);
                    });
                }
            };
        }])
        .directive('fixOnScroll', ['$window', '$timeout', function ($window, $timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attr) {

                    $timeout(function () {
                        var windowE = angular.element($window);
                        var topValue = Number(attr.fixOnScroll);
                        var offsetTop = element.offset().top;

                        windowE.bind('scroll', function () {
                            if (windowE.scrollTop() >= offsetTop - element.outerHeight()) {
                                element.css('position', 'fixed');
                                element.css('top', topValue);
                            }
                            if (windowE.scrollTop() <= offsetTop - element.outerHeight()) {
                                element.css('position', 'static');
                            }
                        });
                    }, 1000);
                }
            };
        }])
        .directive('imgEdit', ['$timeout', function ($timeout) {
            return {
                restrict: 'A',
                scope: {
                    imgSrc: '=',
                    texts: '=',
                    output: '='
                },
                link: function (scope, element) {

                    var image = new Image();
                    var stage;
                    var texts = [];
                    var borders = [];

                    image.onload = function () {
                        var canvas = element[0];
                        var newWidth = image.width * (600 / image.width);
                        var newHeight = image.height * (600 / image.width);
                        canvas.width = newWidth;
                        canvas.height = newHeight;
                        stage = new createjs.Stage(canvas);

                        var img = new createjs.Bitmap(event.target);
                        img.scaleX = img.scaleY = 600 / image.width;
                        stage.addChild(img);

                        if (texts.length > 0) {
                            for (var i = 0; i < texts.length; i++) {
                                if (texts[i].top) {
                                    texts[i].y = texts[i].top;
                                }
                                if (texts[i].bottom) {
                                    texts[i].y = stage.canvas.height - texts[i].bottom;
                                }
                                if (texts[i].left) {
                                    texts[i].x = texts[i].left;
                                }
                                if (texts[i].right) {
                                    texts[i].x = stage.canvas.width - texts[i].right;
                                }
                                stage.addChild(texts[i]);
                            }
                        }

                        stage.enableMouseOver(10);
                        stage.update();
                    };

                    function setOutPut() {
                        if (stage) {
                            $timeout(function () {
                                scope.output = stage.canvas.toDataURL('image/jpeg');
                            });
                        }
                    }

                    scope.$watch('texts', function (newVal) {
                        updateText(newVal);
                        setOutPut();
                    }, true);

                    scope.$watch('imgSrc', function (newVal) {
                        image.src = newVal;
                        setOutPut();
                    });

                    function updateText(textModels) {
                        if (stage) {
                            for (var i = 0; i < textModels.length; i++) {
                                var textModel = textModels[i];
                                if (!texts[i]) {
                                    texts[i] = new createjs.Text('', 'bold 40px Verdana', '#fff');

                                    //Determinate text position
                                    var pos = textModel.position;
                                    if (pos) {
                                        if (pos.top) {
                                            texts[i].y = pos.top;
                                            texts[i].top = pos.top;
                                        }
                                        if (pos.bottom) {
                                            texts[i].y = stage.canvas.height - pos.bottom;
                                            texts[i].bottom = pos.bottom;
                                        }
                                        if (pos.left) {
                                            texts[i].x = pos.left;
                                            texts[i].left = pos.left;
                                        }
                                        if (pos.right) {
                                            texts[i].x = stage.canvas.width - pos.right;
                                            texts[i].right = pos.right;
                                        }
                                    }

                                    //Text width
                                    var width = textModel.width;
                                    if (width) {
                                        texts[i].lineWidth = width;
                                    }

                                    //Others
                                    //texts[i].shadow = new createjs.Shadow('#000000', 0, 0, 10);
                                    texts[i].textAlign = 'center';
                                    texts[i].text = textModel ? textModel.content : 'Chữ ở trên';
                                    texts[i].cursor = 'pointer';

                                    borders[i] = angular.copy(texts[i]);
                                    borders[i].font = 'bold 40px Verdana';
                                    borders[i].outline = 1.5;
                                    borders[i].color = '#000';
                                    var container = new createjs.Container();
                                    container.addChild(texts[i], borders[i]);
                                    enableDrag(container);
                                    //enableDrag(texts[i]);
                                    stage.addChild(container);
                                } else {
                                    borders[i].text = texts[i].text = textModel ? textModel.content : 'Chữ ở dưới';
                                }
                            }
                            stage.update();
                        }
                    }

                    function enableDrag(item) {
                        item.addEventListener('mousedown', function (evt) {
                            var offset = {
                                x: item.x - evt.stageX,
                                y: item.y - evt.stageY
                            };
                            item.addEventListener('pressmove', function (ev) {

                                stage.addChild(item);

                                item.x = ev.stageX + offset.x;
                                item.y = ev.stageY + offset.y;
                                stage.update();
                            });
                        });

                        item.addEventListener('pressup', function () {
                            setOutPut();
                        });

                    }

                    function tick() {
                        if (stage) {
                            stage.update();
                        }
                    }

                    createjs.Ticker.setFPS(40);
                    createjs.Ticker.addEventListener('tick', tick);

                    //var canvas = element[0];
                    //var context = canvas.getContext('2d');
                    //
                    ////var imageSrc = $parse(attrs.imgSrc)(scope);
                    //var imageSrc = scope.imgSrc;
                    //
                    //
                    //function drawCanvas(img, textTop, textBottom) {
                    //    context.clearRect(0, 0, canvas.width, canvas.height);
                    //
                    //    /*Resize the image to 600 width and still keep aspect ratio*/
                    //    var newWidth = img.width * (600 / img.width);
                    //    var newHeight = img.height * (600 / img.width);
                    //
                    //    canvas.width = newWidth;
                    //    canvas.height = newHeight;
                    //    canvas.getContext('2d').drawImage(img, 0, 0, newWidth, newHeight);
                    //    //canvas.getContext('2d').drawImage(img, 0, 0, 600, 400);
                    //    context.fillStyle = 'white';
                    //    context.strokeStyle = 'black';
                    //    context.font = 'bold 40px Arial';
                    //    context.textAlign = 'center';
                    //
                    //    context.lineWidth = 6;
                    //
                    //    context.strokeText(textTop, canvas.width / 2, 50);
                    //    context.fillText(textTop, canvas.width / 2, 50);
                    //
                    //    context.strokeText(textBottom, canvas.width / 2, canvas.height - 50);
                    //    context.fillText(textBottom, canvas.width / 2, canvas.height - 50);
                    //
                    //    context.fill();
                    //
                    //    $timeout(function () {
                    //        scope.output = canvas.toDataURL('image/jpeg');
                    //    });
                    //}
                    //
                    //img.onload = function () {
                    //    //drawCanvas(this, $parse(attrs.textTop)(scope), $parse(attrs.textBottom)(scope));
                    //    drawCanvas(this, scope.textTop, scope.textBottom);
                    //};
                    //
                    //if (imageSrc) {
                    //    img.src = imageSrc;
                    //}
                    //
                    //scope.$watchGroup(['textTop', 'textBottom', 'imgSrc'], function (newVal) {
                    //    img.src = newVal[2];
                    //    drawCanvas(img, newVal[0], newVal[1]);
                    //});

                }
            };
        }])
        .directive('fileDrag', ['$timeout', function ($timeout) {
            return {
                restrict: 'A',
                scope: {
                    onFileSelect: '='
                },
                link: function (scope, element) {
                    //console.log(element)
                    function fileDragHover(e) {
                        e.stopPropagation();
                        e.preventDefault();
                        if (e.type === 'dragover') {
                            element.addClass('hover');
                        } else {
                            element.removeClass('hover');
                        }
                    }

                    function fileSelectHandler(e) {

                        // cancel event and hover styling
                        fileDragHover(e);

                        // fetch FileList object
                        var files = e.target.files || e.dataTransfer.files;

                        scope.onFileSelect(files);

                        //scope.file = files[0];

                    }

                    element[0].addEventListener('dragover', fileDragHover, false);
                    element[0].addEventListener('dragleave', fileDragHover, false);
                    element[0].addEventListener('drop', fileSelectHandler, false);

                }
            };
        }]);
})();