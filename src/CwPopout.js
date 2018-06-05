/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI,$,document */

(function (cwApi) {
    "use strict";

    cwApi.CwPopout = (function () {
        var init, registerActions, outputError, setContent, outputMessage, setTitle, show, hide, toggle,
            registerElementForShow, popoutOptions, registerElementForHide, registerElementForToggle, clearContent, isOpen, showPopout, onClose, scrollContentToTop, outputLoading, transitionTime, intervalDuringAnimationTime, intervalMoving,
            registerForToggleExpand, expandPopout, collapsePopout;

        transitionTime = 350;
        intervalDuringAnimationTime = 25;

        popoutOptions = {
            disableScrollToTop: false,
            fixedPosition: false
        };

        init = function () {
            if ($('.content > .popout').length > 0) {
                return false;
            }
            var o;
            o = [];
            o.push('<div class="popout"><div class="panel-expander panel-expander-expand" style="transform: translate3d(0px, -50%, 0px);transition: transform 300ms ease;"></div>');
            o.push('<div class="popout-top"><ul class="popout-top-container">');
            o.push('<li class="popout-title"><div class="popout-title-div"></div></li>');
            o.push('<li class="popout-title-options">');
            o.push('<a href="#" class="btn btn-close-panel no-text"><i class="fa fa-times"></i></a>');
            o.push('<div class="popout-top-buttons" id="popout-top-buttons"></div>');
            o.push('</li>');
            o.push('</ul></div>');
            o.push('<div id="popout-content" class="popout-content">');
            o.push('</div>');
            o.push('</div>');
            $('#content').prepend(o.join(''));
            registerActions();
        };

        registerActions = function () {
            registerElementForHide('.popout-top .btn-close-panel');
            registerForToggleExpand('.panel-expander-expand');
            cwApi.transitionEndsOnce($('.popout'), function () {
                cwApi.diagramManager.redrawDiagramsInDom($('.page-content'));
            });
        };

        registerForToggleExpand = function(identifier){
            $(document).off('click', identifier).on('click', identifier, function(e){
                e.preventDefault();
                if ($('.popout').hasClass('popout-expanded')){
                    collapsePopout();
                } else {
                    expandPopout();
                }
            });
        }

        collapsePopout = function(){
            $('.popout').removeClass('popout-expanded');
        };

        expandPopout = function(){
            $('.popout').addClass(' popout-expanded');
        };
        
        registerElementForToggle = function (identifier, title, callback) {
            $(document).off('click', identifier).on('click', identifier, function (e) {
                e.preventDefault();
                toggle(title);
                if (cwApi.isFunction(callback)) {
                    callback();
                }
            });
        };

        registerElementForShow = function (identifier, title, callback) {
            $(document).off('click', identifier).on('click', identifier, function (e) {
                e.preventDefault();
                showPopout(title, callback);
            });
        };

        function updateOptions(options) {
            options = options || {};
            popoutOptions.disableScrollToTop = options.disableScrollToTop || false;
            popoutOptions.fixedPosition = options.fixedPosition || false;
        }

        showPopout = function (title, callback, options) {
            updateOptions(options);
            show(title);
            if (cwApi.isFunction(callback)) {
                callback();
            }
        };

        registerElementForHide = function (identifier, callback) {
            $(document).off('click', identifier).on('click', identifier, function (e) {
                cwApi.CwPendingEventsManager.setEvent("PopoutCloseBtn");
                e.preventDefault();
                hide();
                setTimeout(function () {
                    cwApi.CwPendingEventsManager.deleteEvent("PopoutCloseBtn");
                }, transitionTime);
                if (cwApi.isFunction(callback)) {
                    callback(null);
                }
            });
        };


        function refreshElementsInPopoutContent() {
            var $popoutContent = $('.popout-content');
            // cwApi.cwDisplayManager.refreshCharts($popoutContent);
            cwApi.cwDisplayManager.refreshGauges($popoutContent);
        }

        function popoutShowed() {
            if (cwApi.CwPopout.isOpen() === false) {
                clearInterval(intervalMoving);
            }
            $('body').removeClass('cw-moving');
            $('body').addClass('popout-is-open');
            refreshElementsInPopoutContent();
            cwApi.CwPendingEventsManager.deleteEvent("ShowPopout");
            cwApi.pluginManager.execute('CwPopout.PopoutShowed');
        }

        function popoutHidden() {
            clearInterval(intervalMoving);
            $('body').removeClass('cw-moving');
            $('body').equalHeights();
            cwApi.pluginManager.execute('CwPopout.PopoutClosed');
        }

        function duringAnimation() {
            return undefined;
        }

        show = function (title) {
            $('.popout').attr('class', 'popout');

            if (popoutOptions.fixedPosition === true) {
                $('.popout').addClass('fixe-position');
            }

            cwApi.CwPendingEventsManager.setEvent("ShowPopout");
            $('body').addClass('popout-open');
            cwApi.CwPopout.setTitle(title);
            outputLoading();
            scrollContentToTop();
            if (cwApi.CwPopout.isOpen() === false) {
                intervalMoving = setInterval(duringAnimation, intervalDuringAnimationTime);
                $('body').addClass('cw-moving');
            }
            setTimeout(popoutShowed, transitionTime);
        };

        outputLoading = function () {
            var output = [];
            output.push(cwApi.getLoadingSpinnerHtml());
            cwApi.CwPopout.setContent(output.join(''));
        };

        scrollContentToTop = function (callback) {
            if (popoutOptions.disableScrollToTop === true) {
                return; // don't scroll to top
            }
            var scrolltop, duration;
            scrolltop = $(document).scrollTop();

            if (scrolltop > 0) {
                if (scrolltop < 50) {
                    duration = 100;
                } else {
                    duration = 400;
                }

                $('html, body').stop(true, true).animate({
                    scrollTop: 0
                }, duration, null, function () {
                    if (cwApi.isFunction(callback)) {
                        return callback();
                    }
                });
            } else {
                if (cwApi.isFunction(callback)) {
                    return callback();
                }
            }
        };

        hide = function () {
            cwApi.CwPendingEventsManager.setEvent("HidePopout");
            $('body').removeClass('popout-open');
            $('body').removeClass('popout-is-open');
            $('body').addClass('cw-moving');
            $('.popout').trigger('close');
            $('.popout').attr('class', 'popout');
            clearContent();
            scrollContentToTop();
            setTimeout(popoutHidden, transitionTime);
            intervalMoving = setInterval(duringAnimation, intervalDuringAnimationTime);
            cwApi.CwPendingEventsManager.timeoutDelete("HidePopout", transitionTime);
        };

        toggle = function (title) {
            if ($('body').hasClass('popout-open')) {
                hide();
            } else {
                show(title);
            }
        };

        setContent = function (content) {
            $('.popout .popout-content').html(content);
        };

        outputMessage = function (message) {
            var output = [];
            output.push('<form class="form-popout">');
            output.push('<h4 class="info-message">');
            output.push(message);
            output.push('</h4>');
            output.push('</form>');
            cwApi.CwPopout.setContent(output.join(''));
        };

        setTitle = function (title) {
            $('.popout-top .popout-title-div').html(title);
        };

        clearContent = function () {
            $('.popout .popout-top .popout-title-div').html('');
            $('.popout .popout-content').html('');
            $('.popout .popout-top .popout-top-buttons').html('');
        };

        isOpen = function () {
            return $('body').hasClass('popout-is-open');
        };

        onClose = function (callback) {
            $('.popout').on('close', callback);
        };

        outputError = function (error) {
            setTitle($.i18n.prop("error_error"));
            outputMessage(error);
            if (!isOpen) {
                show($.i18n.prop("error_error"));
            }
        };

        return {
            init: init,
            registerElementForShow: registerElementForShow,
            registerElementForToggle: registerElementForToggle,
            registerElementForHide: registerElementForHide,
            setContent: setContent,
            setTitle: setTitle,
            show: show,
            hide: hide,
            toggle: toggle,
            isOpen: isOpen,
            onClose: onClose,
            outputError: outputError,
            showPopout: showPopout,
            scrollContentToTop: scrollContentToTop
        };

    }());

}(cwAPI));