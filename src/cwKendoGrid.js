(function (cwApi) {
  "use strict";

  function createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema) {
    var mainItemsWithKey, gridObject, iObjectTypeScriptName;
    mainItemsWithKey = {};
    mainItemsWithKey[properties.NodeID] = mainItems;
    iObjectTypeScriptName = nodeSchema.iObjectTypeScriptName;
    if (iObjectTypeScriptName !== null) {
      iObjectTypeScriptName = iObjectTypeScriptName.toLowerCase();
    }
    gridObject = new cwBehaviours.CwKendoGridIntersectionObject(properties, mainItemsWithKey, allitems, iObjectTypeScriptName, nodeSchema.ObjectTypeScriptName.toLowerCase(), nodeSchema, nodeSchema.AssociationTypeScriptName.toLowerCase());
    return gridObject;
  }

  cwBehaviours.CwKendoGrid.setup = function (properties, allitems, isSearchEngineEnabled) {
    cwApi.CwPendingEventsManager.setEvent("GridSetup");
    var dataSource, gridObject, nodeSchema, mainItems, isIntersection, propertyGroupString, $container;

    if (cwApi.isNull(allitems)) {
      $container = $('div.' + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      cwApi.CwPendingEventsManager.deleteEvent("GridSetup");
      return;
    }

    nodeSchema = cwApi.ViewSchemaManager.getNodeSchemaById(properties.PageName, properties.NodeID);
    isIntersection = properties.Behaviour.Options.is_intersection;
    propertyGroupString = "propertiesGroups";

    if (isIntersection) {
      propertyGroupString = "iPropertiesGroups";
      mainItems = allitems.associations[properties.NodeID];
      gridObject = createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema);
    } else if (properties.PageType === 1 || properties.PageType === 2) { // add handle of popout (=2)
      mainItems = allitems.associations[properties.NodeID];
      gridObject = createandGetIntersectionGrid(mainItems, properties, allitems, nodeSchema);
    } else {
      mainItems = allitems[properties.NodeID];
      gridObject = new cwBehaviours.CwKendoGrid(properties, allitems, nodeSchema);
    }

    gridObject.loadItemsByPageType(mainItems, properties.NodeID);

    if (!isIntersection) {
      propertyGroupString = "BOTH";
    }

    //if (gridObject.items.length > 0 && !isIntersection) {
    if (gridObject.items.length > 0) {
      //propertyGroupString = "BOTH";
      gridObject.loadHeader(propertyGroupString, nodeSchema, true);
    } else {
      nodeSchema.objectTypeScriptName = nodeSchema.ObjectTypeScriptName.toLowerCase();
      gridObject.loadHeaderForNoAssications(propertyGroupString, nodeSchema, true, properties.NodeID, isIntersection);
    }

    gridObject.isSearchEngineEnabled = isSearchEngineEnabled;
    dataSource = gridObject.loadData(propertyGroupString);

    kendo.culture(cwApi.cwConfigs.SelectedLanguage);
    cwApi.CwNumberSeparator.setupNumberSeperatorForKendoUi();

    gridObject.loadGrid(dataSource);

    dataSource._filter = cwApi.upgradedParseJSON(cwApi.CwLocalStorage.getGridFilterValues(properties.NodeID));
    dataSource.filter(dataSource._filter);
    cwApi.cwKendoGridFilter.addFilterTitle(gridObject.mainContainer);

    cwApi.gridStorage.push(gridObject);

    cwApi.CwPendingEventsManager.deleteEvent("GridSetup");
  };


}(cwAPI));