/*global cwAPI*/
(function (cwApi) {
  'use strict';
  var loader = cwApi.CwAngularLoader;
  if (cwApi.ngDirectives) {
    cwApi.ngDirectives.push(function () {
      loader.registerDirective('onFinishRender', function ($timeout) {
        return {
          restrict: 'A',
          link: function (scope, element, attr) {
            if (scope.$last === true) {
              $timeout(function () {
                scope.$emit(attr.onFinishRender);
              });
            }
          }
        };
      });
    });
  }

}(cwAPI));