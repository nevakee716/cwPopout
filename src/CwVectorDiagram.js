/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */
/*global cwAPI, cwBehaviours, jQuery */
(function (cwApi, $) {
  "use strict";

  var cwVectorDiagram = function () {
    return undefined;
  };

  cwVectorDiagram.getDiagramContainerZoneID = function (itemId, layoutId) {
    return "cw-diagram-zone-" + itemId + "-" + layoutId;
  };

  cwVectorDiagram.getDiagramContainerZone = function (itemId, layoutId) {
    var containerId = cwVectorDiagram.getDiagramContainerZoneID(itemId, layoutId);
    return $("#" + containerId);
  };

  cwVectorDiagram.setup = function (properties, allItems, isSearching, exploded, callback) {
    /*jslint unparam:true*/

    var $container,
      fullScreen = properties.Behaviour.Options["full-screen"],
      rootItem,
      newLayoutId,
      i,
      diagram;

    function loadVectorDiagram($localContainer, localRootItem) {
      diagram = new cwApi.Diagrams.CwDiagramViewer($localContainer, fullScreen, properties);

      diagram.getVectorDiagram(localRootItem, function () {
        // loaded
        return callback && callback(null);
      });

      return diagram;
    }

    function lookForNode(items, nodeID) {
      if (items.associations[nodeID] !== undefined) {
        return items.associations[nodeID];
      } else {
        for (var key in items.associations) {
          if (items.associations.hasOwnProperty(key)) {
            for (var i = 0; i < items.associations[key].length; i += 1) {
              var a = lookForNode(items.associations[key][i], nodeID);
              if (a !== null) return a;
            }
          }
        }
      }
      return null;
    }

    if (cwApi.isNull(allItems)) {
      $container = $("div." + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      return;
    }

    let nodeIDs = Object.keys(cwApi.getViewsSchemas()[properties.PageName].NodesByID);
    nodeIDs.splice(nodeIDs.indexOf(properties.NodeID), 1);
    let items = $.extend(true, {}, allItems);

    newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);

    if (items.objectTypeScriptName === "diagram") {
      $container = cwVectorDiagram.getDiagramContainerZone(items.object_id, newLayoutId);
      cwAPI.customLibs.diagramViewerByNodeIDAndID[items.nodeID + "_" + items.object_id] = loadVectorDiagram($container, items);
      return;
    }
    if (items.hasOwnProperty("associations")) items = items.associations;
    if (cwApi.customLibs.utils.manageHiddenNodes) cwApi.customLibs.utils.manageHiddenNodes(items, nodeIDs);

    if (properties.PageType === 1 || properties.PageType === 2) {
      // object (single) page
      rootItem = items;

      if (items.nodeID === properties.NodeID) {
        $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        cwAPI.customLibs.diagramViewerByNodeIDAndID[items.nodeID + "_" + rootItem.object_id] = loadVectorDiagram($container, rootItem);
      } else {
        if (items.associations === undefined) items.associations = items;
        if (items.associations[properties.NodeID] != undefined && items.associations[properties.NodeID].length > 0) {
          for (i = 0; i < items.associations[properties.NodeID].length; i += 1) {
            rootItem = items.associations[properties.NodeID][i];
            $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
            $container.closest("div.popout .cwLayoutList").css("width", "100%");
            cwAPI.customLibs.diagramViewerByNodeIDAndID[properties.NodeID + "_" + rootItem.object_id] = loadVectorDiagram($container, rootItem);
          }
        } else {
          // allow to load diagram in lower level
          items.associations[properties.NodeID] = lookForNode(items, properties.NodeID);
          if (items.associations[properties.NodeID] != undefined && items.associations[properties.NodeID].length > 0) {
            for (i = 0; i < items.associations[properties.NodeID].length; i += 1) {
              rootItem = items.associations[properties.NodeID][i];
              $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
              $container.closest("div.popout .cwLayoutList").css("width", "100%");
              cwAPI.customLibs.diagramViewerByNodeIDAndID[properties.NodeID + "_" + rootItem.object_id] = loadVectorDiagram($container, rootItem);
            }
          }
        }
      }
    } else {
      // index page
      if (items.length === undefined && items[properties.NodeID]) items = items[properties.NodeID];
      for (let i = 0; i < items.length; i += 1) {
        rootItem = items[i];
        $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        loadVectorDiagram($container, rootItem);
      }
    }
  };

  function updateRootItem(automaticDiagramProperties, layoutOptions) {
    var split;
    if (layoutOptions.DisplayPropertyScriptName) {
      split = layoutOptions.DisplayPropertyScriptName.split("/");
      automaticDiagramProperties.rootItem = {
        object_id: split[1],
      };
      automaticDiagramProperties.automaticName = split[0];
      automaticDiagramProperties.heatMapNodeId = split[2];
    }
  }

  function colorizeHeatMap(dv, allItems, automaticDiagramProperties) {
    if (automaticDiagramProperties.heatMapNodeId) {
      var impactedItems,
        impactedIds,
        nodeSchema = cwApi.ViewSchemaManager.getNodeSchemaByIdForCurrentView(automaticDiagramProperties.heatMapNodeId);
      impactedItems = allItems.associations[automaticDiagramProperties.heatMapNodeId];
      impactedIds = {};
      impactedItems.forEach(function (i) {
        impactedIds[i.object_id] = true;
      });
      dv.diagramShapes.forEach(function (ds) {
        if (
          nodeSchema.ObjectTypeScriptName.toLowerCase() === ds.shape.cwObject.objectTypeScriptName &&
          impactedIds[ds.shape.objectId] !== undefined
        ) {
          ds.shape.isSelectedForEditor = true;
          ds.shape.isSelectedForEditorProperties = {
            backgroundColor: "#009688",
          };
        }
      });
    }
  }

  cwBehaviours.CwAutomaticDiagram.setup = function (properties, allItems, isSearching, exploded, callback) {
    /*jslint unparam:true*/
    var automaticDiagramProperties = {},
      fullScreen,
      i,
      $container,
      newLayoutId;
    automaticDiagramProperties.automaticName = properties.Behaviour.Options["automatic-diagram-name"];
    automaticDiagramProperties.rootItem = null;
    fullScreen = false;

    if (cwApi.isNull(allItems)) {
      $container = $("div." + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      return;
    }

    function loadAutomaticDiagram($container, automaticDiagramProperties, callback) {
      var diagram;
      diagram = new cwApi.Diagrams.CwDiagramViewer($container, fullScreen, properties);
      diagram.loadAutomaticDiagram(automaticDiagramProperties.automaticName, automaticDiagramProperties.rootItem.object_id, callback);
      return diagram;
    }

    newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
    if (properties.PageType === 1) {
      // single page
      automaticDiagramProperties.rootItem = allItems;
      $container = $("#cw-diagram-zone-" + automaticDiagramProperties.rootItem.object_id + "-" + newLayoutId);

      updateRootItem(automaticDiagramProperties, properties.LayoutOptions);

      cwAPI.customLibs.diagramViewerByNodeIDAndID[
        properties.LayoutOptions.LayoutID + "_" + automaticDiagramProperties.rootItem.object_id
      ] = loadAutomaticDiagram($container, automaticDiagramProperties, function (err, dv) {
        colorizeHeatMap(dv, allItems, automaticDiagramProperties);
      });
    } else {
      // index page
      for (i = 0; i < allItems[properties.NodeID].length; i += 1) {
        automaticDiagramProperties.rootItem = allItems[properties.NodeID][i];
        $container = $("#cw-diagram-zone-" + automaticDiagramProperties.rootItem.object_id + "-" + newLayoutId);
        loadAutomaticDiagram($container, automaticDiagramProperties);
      }
    }
  };
  if (cwAPI.customLibs === undefined) {
    cwAPI.customLibs = {};
  }
  if (cwAPI.customLibs.diagramViewerByNodeIDAndID === undefined) {
    cwAPI.customLibs.diagramViewerByNodeIDAndID = {};
  }

  cwBehaviours.CwVectorDiagram = cwVectorDiagram;
})(cwAPI, jQuery);
