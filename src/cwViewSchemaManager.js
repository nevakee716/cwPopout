/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI, jQuery */

(function (cwApi, $) {
  "use strict";

  cwApi.ViewSchemaManager = (function () {
    var that = {},
      setSchema,
      getFirstRootNodeSchemaForCurrentView,
      getFirstRootNodeSchemaForView,
      getNodeSchemaById,
      getNode,
      getPageSchema,
      getCurrentViewSchema,
      pageExists,
      getAllPropertiesGroupFromANode,
      getPropertyGroup,
      getNodeSchemaByIdForCurrentView,
      getPropertyGroupForCurrentView;
    that.schemas = {};

    cwApi.getViewsSchemas = function () {
      return that.schemas;
    };

    function loadSchema(callback) {
      if (cwApi.isModelSelectionPage() === false) {
        var url;
        url =
          cwApi.getSiteMediaPath() +
          "metamodel/schema." +
          cwApi.getSelectedLanguage() +
          "." +
          cwApi.getJSONExtention() +
          "?" +
          cwApi.getDeployNumber();
        $.getJSON(url, function (schema) {
          that.schemas = schema.Schema;
          cwApi.cwConfigs.Pages = schema.Pages;
          cwApi.cwConfigs.MenuLinks = schema.MenuLinks;
          return callback && callback();
        });
      } else {
        that.schemas = cwApi.cwConfigs.ViewsSchemas;
        return callback && callback();
      }
    }

    setSchema = function (pageName, schema) {
      that.schemas[pageName] = schema;
    };

    getNodeSchemaById = function (pageName, nodeId) {
      return that.schemas[pageName].NodesByID[nodeId];
    };

    getPageSchema = function (pageName) {
      return that.schemas[pageName];
    };

    pageExists = function (pageName) {
      return !cwApi.isUndefined(that.schemas[pageName]);
    };

    getPropertyGroup = function (schema, propertyGroupId) {
      var pg = schema.PropertyGroupsById[propertyGroupId];
      pg.view = schema.ViewName;
      return pg;
    };

    getNode = function (schema, nodeId) {
      return schema.NodesByID[nodeId];
    };

    getCurrentViewSchema = function () {
      var view, schema;
      view = cwApi.getCurrentView();
      if (cwApi.isUndefined(view)) {
        view = cwApi.cwConfigs.Pages.home;
      }
      if (cwApi.isUndefined(view)) {
        return null;
      }
      schema = getPageSchema(view.cwView);
      return schema;
    };

    getFirstRootNodeSchemaForCurrentView = function () {
      var currentViewSchema = getCurrentViewSchema();
      if (currentViewSchema.RootNodesId.length > 0) {
        return currentViewSchema.NodesByID[currentViewSchema.RootNodesId[0]];
      }
    };

    getFirstRootNodeSchemaForView = function (viewSchema) {
      if (viewSchema.RootNodesId.length > 0) {
        return viewSchema.NodesByID[viewSchema.RootNodesId[0]];
      }
    };

    getPropertyGroupForCurrentView = function (propertyGroupId) {
      var view, schema;
      view = cwApi.getCurrentView();
      schema = getPageSchema(view.cwView);
      return schema.PropertyGroupsById[propertyGroupId];
    };

    getAllPropertiesGroupFromANode = function (nodeSchema) {
      var values = [],
        keys,
        i,
        k,
        pg;
      keys = Object.keys(nodeSchema.PropertiesGroups);
      for (i = 0; i < keys.length; i += 1) {
        k = keys[i];
        pg = nodeSchema.PropertiesGroups[k];
        values = values.concat(pg.properties);
      }
      return values;
    };

    getNodeSchemaByIdForCurrentView = function (nodeId) {
      var view = cwApi.getCurrentView();
      if (cwApi.isUndefined(view)) {
        return undefined;
      }
      // if popout open try to look for the node id inside
      if (cwApi.customLibs && cwAPI.CwPopout.isOpen() && cwApi.customLibs.popoutOpen && cwApi.customLibs.popoutOpen.NodesByID[nodeId])
        return cwApi.customLibs.popoutOpen.NodesByID[nodeId];
      else return getNodeSchemaById(view.cwView, nodeId);
    };

    return {
      loadSchema: loadSchema,
      setSchema: setSchema,
      getNodeSchemaById: getNodeSchemaById,
      getPageSchema: getPageSchema,
      pageExists: pageExists,
      getAllPropertiesGroupFromANode: getAllPropertiesGroupFromANode,
      getNodeSchemaByIdForCurrentView: getNodeSchemaByIdForCurrentView,
      getPropertyGroupForCurrentView: getPropertyGroupForCurrentView,
      getPropertyGroup: getPropertyGroup,
      getNode: getNode,
      getCurrentViewSchema: getCurrentViewSchema,
      getFirstRootNodeSchemaForCurrentView: getFirstRootNodeSchemaForCurrentView,
      getFirstRootNodeSchemaForView: getFirstRootNodeSchemaForView,
    };
  })();
})(cwAPI, jQuery);
