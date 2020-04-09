(function(cwApi) {
  "use strict";

  /**
   * Diagram : Vector
   */
  cwBehaviours.CwVectorDiagram.setup = function(properties, allItems, isSearching, exploded, callback) {
    /*jslint unparam:true*/
    var $container,
      fullScreen = properties.Behaviour.Options["full-screen"],
      rootItem,
      newLayoutId,
      i,
      diagram;

    function loadVectorDiagram($localContainer, localRootItem) {
      diagram = new cwApi.Diagrams.CwDiagramViewer($localContainer, fullScreen, properties);

      diagram.getVectorDiagram(localRootItem, function() {
        // loaded
        return callback && callback(null);
      });

      return diagram;
    }

    if (cwApi.isNull(allItems)) {
      $container = $("div." + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      return;
    }

    newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
    if (properties.PageType === 1 || properties.PageType === 2) {
      // add popout (=2)
      // object (single) page
      rootItem = allItems;

      if (allItems.nodeID === properties.NodeID) {
        $container = cwBehaviours.CwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        loadVectorDiagram($container, rootItem);
      } else {
        if (allItems.associations[properties.NodeID] !== undefined && allItems.associations[properties.NodeID].length > 0) {
          for (i = 0; i < allItems.associations[properties.NodeID].length; i += 1) {
            rootItem = allItems.associations[properties.NodeID][i];
            $container = cwBehaviours.CwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
            loadVectorDiagram($container, rootItem);
          }
        }
      }
    } else {
      // index page
      for (i = 0; i < allItems[properties.NodeID].length; i += 1) {
        rootItem = allItems[properties.NodeID][i];
        $container = cwBehaviours.CwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        loadVectorDiagram($container, rootItem);
      }
    }
  };

  /**
   * Diagram : CM diagram
   */
  cwBehaviours.CwCmDiagram.setup = function(properties, allItems, isUsingSearchFilter, exploded, callback) {
    /*jslint unparam:true*/
    var $container, rootItem, i, newLayoutId;

    function loadDiagramImage($container, rootItem) {
      $container.addClass("cm-image-diagram");
      var diagram = new cwApi.Diagrams.CwDiagramViewer($container, properties.Behaviour.Options["full-screen"], properties);
      diagram.loadImageDiagram(rootItem, function(err) {
        if (err) {
          $container.html($.i18n.prop("diagram_errorWhileDisplaying"));
        }

        function nothing() {
          return undefined;
        }
        diagram.camera = new cwApi.Diagrams.CwCanvasCamera(diagram.$canvas[0], diagram.json.diagram.size, nothing, diagram);
        diagram.ctx = diagram.$canvas[0].getContext("2d");
        diagram.reload();
        return callback && callback(err);
      });
    }

    if (cwApi.isNull(allItems)) {
      $container = $("div." + properties.NodeID);
      cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
      return;
    }

    newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
    if (properties.PageType === 1) {
      // single page
      rootItem = allItems;

      if (allItems.nodeID === properties.NodeID) {
        $container = cwBehaviours.CwCmDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        loadDiagramImage($container, rootItem);
      } else {
        for (i = 0; i < allItems.associations[properties.NodeID].length; i += 1) {
          rootItem = allItems.associations[properties.NodeID][i];
          $container = cwBehaviours.CwCmDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
          loadDiagramImage($container, rootItem);
        }
      }
    } else {
      // index page
      for (i = 0; i < allItems[properties.NodeID].length; i += 1) {
        rootItem = allItems[properties.NodeID][i];
        $container = cwBehaviours.CwCmDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
        loadDiagramImage($container, rootItem);
      }
    }
  };

  /**
   * Diagram : visualization
   */
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
      impactedItems.forEach(function(i) {
        impactedIds[i.object_id] = true;
      });
      dv.diagramShapes.forEach(function(ds) {
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

  cwBehaviours.CwAutomaticDiagram.setup = function(properties, allItems, isSearching, exploded, callback) {
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
    }

    newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
    if (properties.PageType === 1 || properties.PageType === 2) {
      // single page or popout
      automaticDiagramProperties.rootItem = allItems;
      $container = $("#cw-diagram-zone-" + automaticDiagramProperties.rootItem.object_id + "-" + newLayoutId);

      updateRootItem(automaticDiagramProperties, properties.LayoutOptions);

      loadAutomaticDiagram($container, automaticDiagramProperties, function(err, dv) {
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
})(cwAPI);
