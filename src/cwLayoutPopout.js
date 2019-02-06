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
            var i = 0, o, rootNodeSchema, rootLayout, title, _views = {};
            rootNodeSchema = cwApi.ViewSchemaManager.getFirstRootNodeSchemaForView(schema);
            rootLayout = new cwApi.cwLayouts[rootNodeSchema.LayoutName](rootNodeSchema.LayoutOptions);
            title = rootLayout.getDisplayItem(data, true);

            cwApi.CwPopout.showPopout(title, undefined, popoutOptions);
            if (schema.Tab && schema.Tab.Tabs && schema.Tab.Tabs.length) {
              for (i = 0; i < schema.Tab.Tabs.length; i += 1) {
                let tab = schema.Tab.Tabs[i];
                o = [];
                cwApi.cwDisplayManager.outputSortedChildren(o, schema, tab.SortedChildren, data);
                _views[tab.Id] = {
                  htmlContent: o.join(''),
                  id: tab.Id,
                  name: tab.Name,
                  isSelected: i === 0 ? true : false
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
                loader.registerEditableScope($scope);
                
                $scope.editMode = false;
                $scope.viewName = diagramPopout;
                $scope.views = _views;
                $scope.hasTabs = i > 0;
                $scope.canUpdate = data.accessRights.CanUpdate === true;

                $scope.displayTrusted = function (text) {
                  return $sce.trustAsHtml(text);
                };

                $scope.displayTabContent = function (id) {
                  var k;
                  for (k in $scope.views) {
                    if ($scope.views.hasOwnProperty(k)) {
                      $scope.views[k].isSelected = (id == $scope.views[k].id);
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

                function addSaveTab(){
                  var tabId = $scope.updateManager.getTabId();
                  $scope.views[tabId] = {
                    htmlContent: $scope.updateManager.displayForm(),
                    id: tabId,
                    name: $.i18n.prop('editmode_updateSummary'),
                    isSelected: false,
                    isHidden: true
                  };
                }

                $scope.doCallback = function () {
                  if ($scope.TabLoaded && $scope.viewLoaded) {
                    cwApi.cwDisplayManager.enableBehaviours(schema, data, false);
                    if (callback === undefined) {
                      cwApi.cwSiteActions.doActionsForSingle(true);
                    } else {
                      return callback && callback();
                    }
                    if ($scope.canUpdate && cwApi.isUndefined($scope.updateManager)) {
                      var editManager = new cwApi.cwEditProperties.cwEditPropertyManager($('#popout-content-container'), data, 'cwLayoutSinglePage');
                      $scope.updateManager = new cwApi.customLibs.cwLayoutExecuteSequence.saveEngine(editManager, true);
                      addSaveTab();
                    }
                  }
                };

                $scope.saveChanges = function(){
                  var k, id = $scope.updateManager.getTabId(), tab = $scope.views[id];
                  tab.isHidden = false;
                  for (k in $scope.views) {
                    if ($scope.views.hasOwnProperty(k) && $scope.views[k].isSelected) {
                      $scope.selectedTab = k;
                      break;
                    }
                  }
                  $scope.displayTabContent(id);
                  $scope.updateManager.saveItem(function(){
                    cwApi.cwDiagramPopoutHelper.openDiagramPopout(cwObject, diagramPopout, callback, popoutOptions);
                  });
                };

                $scope.cancelEditMode = function () {
                  console.log('cancel edit mode');
                  // delete le tab qu'on a eventuellement créé
                  $scope.editMode = false;
                  if ($scope.selectedTab){
                    $scope.displayTabContent($scope.selectedTab);
                  }
                  $scope.updateManager.editManager.cancelEditMode();
                  $scope.views[$scope.updateManager.getTabId()].isHidden = true;
                };

                $scope.goToEditMode = function () {
                  $scope.updateManager.editManager.setPropertiesEditMode();
                  /* $scope.updateManager.editManager.associationManager.showDeleteIconsAndSetActions();
                  $scope.updateManager.editManager.associationManager.setAssociateToExistingActions();
                  $scope.updateManager.editManager.associationManager.showCreateTargetObjectAndSetActions();
                  $scope.updateManager.editManager.associationManager.unHideAssociationsBoxes(); */
                  $scope.updateManager.editManager.unHidePropertiesGroups();
                  $scope.updateManager.editManager.switchHiddenTabsToVisible();
                  $scope.updateManager.editManager.hideDOMElementsForEditMode();
                  $scope.updateManager.init();
                  $scope.editMode = true;
                };

              });
            });
          }
        }
      });
    }
  };

}(cwAPI));