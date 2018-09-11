/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */
/*global cwAPI, cwBehaviours, jQuery */
(function (cwApi, $) {
    "use strict";

    var cwVectorDiagram = function () {
        return undefined;
    };

    cwVectorDiagram.getDiagramContainerZoneID = function (itemId, layoutId) {
        return 'cw-diagram-zone-' + itemId + '-' + layoutId;
    };

    cwVectorDiagram.getDiagramContainerZone = function (itemId, layoutId) {
        var containerId = cwVectorDiagram.getDiagramContainerZoneID(itemId, layoutId);
        return $('#' + containerId);
    };

    cwVectorDiagram.setup = function (properties, allItems, isSearching, exploded, callback) {
        /*jslint unparam:true*/

        var $container,
            fullScreen = properties.Behaviour.Options['full-screen'],
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


        function lookForNode(items,nodeID) {
            if(items.associations[nodeID] !== undefined) {
                return items.associations[nodeID];
            } else {
                for(var key in items.associations) {
                    if(items.associations.hasOwnProperty(key)) {
                        for(var i=0;i < allItems.associations[key].length; i+=1) {
                            var a = lookForNode(allItems.associations[key][i],nodeID);
                            if(a !== null) return a;
                        }
                    }
                }
            }
            return null;
        }



        if (cwApi.isNull(allItems)) {
            $container = $('div.' + properties.NodeID);
            cwApi.cwDisplayManager.setNoDataAvailableHtml($container);
            return;
        }

        newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
        if (properties.PageType === 1 || properties.PageType === 2) {
            // object (single) page
            rootItem = allItems;

            if (allItems.nodeID === properties.NodeID) {
                $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                loadVectorDiagram($container, rootItem);
            } else {
                if (allItems.associations[properties.NodeID] !== undefined && allItems.associations[properties.NodeID].length > 0) {
                    for (i = 0; i < allItems.associations[properties.NodeID].length; i += 1) {
                        rootItem = allItems.associations[properties.NodeID][i];
                        $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                        loadVectorDiagram($container, rootItem);
                    }
                } else { // allow to load diagram in lower level
                    allItems.associations[properties.NodeID] = lookForNode(allItems,properties.NodeID);
                    if (allItems.associations[properties.NodeID] !== undefined && allItems.associations[properties.NodeID].length > 0) {
                        for (i = 0; i < allItems.associations[properties.NodeID].length; i += 1) {
                            rootItem = allItems.associations[properties.NodeID][i];
                            $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                            loadVectorDiagram($container, rootItem);
                        }
                    };
                }
            }
        } else {
            // index page        
            for (i = 0; i < allItems[properties.NodeID].length; i += 1) {
                rootItem = allItems[properties.NodeID][i];
                $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                loadVectorDiagram($container, rootItem);
            }
        }

    };

    cwBehaviours.CwVectorDiagram = cwVectorDiagram;

}(cwAPI, jQuery));