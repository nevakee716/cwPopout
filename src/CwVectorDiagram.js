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
                        for(var i=0;i < items.associations[key].length; i+=1) {
                            var a = lookForNode(items.associations[key][i],nodeID);
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

        let nodeIDs = Object.keys(cwApi.getViewsSchemas()[properties.PageName].NodesByID);
        nodeIDs.splice(nodeIDs.indexOf(properties.NodeID), 1);
        let items = $.extend(true, {}, allItems);
        if(items.hasOwnProperty("associations")) items = items.associations;
        if(cwApi.customLibs.utils.manageHiddenNodes) cwApi.customLibs.utils.manageHiddenNodes(items,nodeIDs)

        newLayoutId = cwApi.getNewIdWithLayoutAndExplosion(properties.LayoutOptions.LayoutID, exploded);
        if (properties.PageType === 1 || properties.PageType === 2) {
            // object (single) page
            rootItem = items;

            if (items.nodeID === properties.NodeID) {
                $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                loadVectorDiagram($container, rootItem);
            } else {
                if(items.associations === undefined) items.associations = items;
                if (items.associations[properties.NodeID] !== undefined && items.associations[properties.NodeID].length > 0) {
                    for (i = 0; i < items.associations[properties.NodeID].length; i += 1) {
                        rootItem = items.associations[properties.NodeID][i];
                        $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                         $container.closest("div.popout .cwLayoutList").css('width', '100%');
                        loadVectorDiagram($container, rootItem);
                    }
                } else { // allow to load diagram in lower level
                    items.associations[properties.NodeID] = lookForNode(items,properties.NodeID);
                    if (items.associations[properties.NodeID] !== undefined && items.associations[properties.NodeID].length > 0) {
                        for (i = 0; i < items.associations[properties.NodeID].length; i += 1) {
                            rootItem = items.associations[properties.NodeID][i];
                            $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                             $container.closest("div.popout .cwLayoutList").css('width', '100%');
                            loadVectorDiagram($container, rootItem);
                        }
                    };
                }

            }
        } else {
            // index page    
            if(items.length === undefined && items[properties.NodeID]) items = items[properties.NodeID];
            for (let i = 0; i < items.length; i += 1) {
                rootItem = items[i];
                $container = cwVectorDiagram.getDiagramContainerZone(rootItem.object_id, newLayoutId);
                loadVectorDiagram($container, rootItem);
            }
        }

    };

    cwBehaviours.CwVectorDiagram = cwVectorDiagram;

}(cwAPI, jQuery));