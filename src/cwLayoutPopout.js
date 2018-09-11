(function (cwApi) {
  "use strict";

  cwApi.cwDiagramPopoutHelper = {
    openDiagramPopout: function (cwObject, diagramPopout, callback, popoutOptions) {
      var jsonFile, schema, that = this;
      schema = cwApi.ViewSchemaManager.getPageSchema(diagramPopout);
      jsonFile = cwApi.getObjectViewJsonUrl(diagramPopout, cwObject.object_id);
      cwApi.getJSONFile(jsonFile, function (data) {
        if (cwApi.checkJsonCallback(data)) {
          if (cwApi.isFunction(cwCustomerSiteActions[diagramPopout])) {
            cwCustomerSiteActions[diagramPopout](cwObject, diagramPopout, data, that);
          } else {
            var i = 0, o, lastTab = 0,rootNodeSchema, rootLayout, title, _views = {};
            rootNodeSchema = cwApi.ViewSchemaManager.getFirstRootNodeSchemaForView(schema);
            rootLayout = new cwApi.cwLayouts[rootNodeSchema.LayoutName](rootNodeSchema.LayoutOptions);
            title = rootLayout.getDisplayItem(data, true);

            cwApi.CwPopout.showPopout(title, undefined, popoutOptions);
            if(cwApi.customLibs.popout.views[diagramPopout]) lastTab = cwApi.customLibs.popout.views[diagramPopout];
            if (schema.Tab && schema.Tab.Tabs && schema.Tab.Tabs.length) {
              for (i = 0; i < schema.Tab.Tabs.length; i += 1) {
                let tab = schema.Tab.Tabs[i];
                let selected = false;
                o = [];
                cwApi.cwDisplayManager.outputSortedChildren(o, schema, tab.SortedChildren, data);
                if(tab.Id === lastTab || lastTab === i) selected = true;
                _views[tab.Id] = {
                  htmlContent: o.join(''),
                  id: tab.Id,
                  name: tab.Name,
                  isSelected: selected
                };
              }
            } else {
              _views['tab0'] = {
                htmlContent: cwApi.cwDisplayManager.appendContentNoTab(schema, diagramPopout, data).join(''),
                id: 'tab0',
                name: 'tab0',
                isSelected: true
              };
            }

            cwApi.CwAsyncLoader.load('angular', function () {
              var loader = cwApi.CwAngularLoader, templatePath, $container = $('#popout-content'), templateLoaded = false;
              loader.setup();
              templatePath = cwApi.format('{0}/html/{1}/{2}.ng.html', cwApi.getCommonContentPath(), 'CwPopout', 'cwPopoutContent');
              loader.loadControllerWithTemplate('cwPopoutManager', $container, templatePath, function ($scope, $sce, $timeout) {
                $scope.viewName = diagramPopout;
                $scope.views = _views;
                $scope.nbOfViews = i;
                $scope.displayTrusted = function (text) {
                  return $sce.trustAsHtml(text);
                };

                $scope.displayTabContent = function (id) {
                  var k;
                  for (k in $scope.views) {
                    if ($scope.views.hasOwnProperty(k)) {
                      $scope.views[k].isSelected = (id == $scope.views[k].id);
                      cwApi.customLibs.popout.views[diagramPopout] = id;
                    }
                  }
                };

                $scope.$on('ngRepeatFinishedTab', function (e) {
                  $scope.TabLoaded = true;
                  $scope.doCallback();
                });
                $scope.$on('ngRepeatFinishedView', function (e) {
                  $scope.viewLoaded = true;
                  $scope.doCallback();
                });

                $scope.doCallback = function () {
                  if ($scope.TabLoaded && $scope.viewLoaded) {
                    cwApi.cwDisplayManager.enableBehaviours(schema, data, false);
                    if (callback === undefined) {
                      cwApi.cwSiteActions.doActionsForSingle(true);
                    } else {
                      return callback && callback();
                    }
                  }
                };

              });
            });
          }
        }
      });
    }
  };

}(cwAPI));