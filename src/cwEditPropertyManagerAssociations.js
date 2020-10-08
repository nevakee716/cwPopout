/* Copyright © 2012-2017 erwin, Inc. - All rights reserved */

/*global cwAPI:true, jQuery:true */

(function (cwApi, $) {
  "use strict";

  var cwEditPropertyManagerAssociations = function (editPropertyManager) {
    this.editPropertyManager = editPropertyManager;
    this.associations = [];
  };

  cwEditPropertyManagerAssociations.prototype.showCreateTargetObjectAndSetActions = function () {
    var i, editAssociation, schemaNode, nodeId, node;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      nodeId = editAssociation.jQueryPropertyAssoBox.attr("data-node-id");

      // If item is null this is a creation page so remove option to add
      if (!cwApi.isNull(this.editPropertyManager.item)) {
        schemaNode = cwApi.ViewSchemaManager.getNodeSchemaByIdForCurrentView(this.editPropertyManager.item.nodeID);

        node = schemaNode.AssociationsTargetObjectTypes[nodeId];
        if (
          !cwApi.isUndefined(node) &&
          cwApi.mm.canCreateObject(node.targetScriptName) &&
          node.intersectionObjectScriptName !== null &&
          cwApi.mm.canCreateObject(node.intersectionObjectScriptName.toLowerCase())
        ) {
          editAssociation.jQueryPropertyAssoBox.find(".cw-create-target-item").removeClass("cw-hidden");
        }
        this.setCreateTargetObjectActions();
      }
    }
  };

  cwEditPropertyManagerAssociations.prototype.setMandatoryAssociationDOM = function (nodeId, associationBox) {
    var associationType = cwApi.getAssociationType(nodeId);
    if (associationType && associationType.isMandatoryAssociation) {
      var element = associationBox.find(".cw-property-title-displayname");
      var initialValue = element.text();
      element.text(initialValue + "*");
    }
  };

  cwEditPropertyManagerAssociations.prototype.unHideAssociationsBoxes = function () {
    var i, editAssociation;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      editAssociation.jQueryPropertyAssoBox.removeClass("cw-hidden");
    }
  };

  cwEditPropertyManagerAssociations.prototype.hideDeleteIcons = function () {
    var i, editAssociation;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      editAssociation.jQueryPropertyAssoBox.find(".cw-association-delete-item").addClass("cw-hidden");
    }
  };

  cwEditPropertyManagerAssociations.prototype.hideCreateTargetObject = function () {
    var i, editAssociation;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      editAssociation.jQueryPropertyAssoBox.find(".cw-create-target-item").addClass("cw-hidden");
    }
  };

  cwEditPropertyManagerAssociations.prototype.hideAddAssociations = function () {
    var i, editAssociation;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      editAssociation.jQueryPropertyAssoBox.find(".cw-edit-mode-association-autocomplete").addClass("cw-hidden");
      editAssociation.jQueryPropertyAssoBox.find(".cw-edit-mode-association-search").addClass("cw-hidden");
    }
  };

  function removeItem($e, updateSelect) {
    cwApi.CwPendingEventsManager.setEvent("AssociationRemoveItem");
    var itemId, $select, $opt, $searchResult, $disabled;
    itemId = $e.attr("data-item-id");
    if (updateSelect === true) {
      if (cwApi.isGlobalSearchEnabled() === true) {
        $searchResult = $e.parents(".property-box-asso").find(".cw-edit-mode-association-search-results");
        $disabled = $searchResult.find('li[data-object-id="' + itemId + '"]');
        $disabled.removeClass("deactive-result").addClass("active-result");
      } else {
        $select = $e.parents(".property-box-asso").find("select");
        $opt = $select.find('option[value="' + itemId + '"]');
        $opt.removeAttr("selected");
        $select.trigger("chosen:updated");
      }
    }
    $e.addClass("animated bounceOutDown");
    setTimeout(function () {
      $e.remove();
      cwApi.CwPendingEventsManager.deleteEvent("AssociationRemoveItem");
    }, 1000);
  }

  cwEditPropertyManagerAssociations.prototype.showDeleteIconsAndSetActions = function () {
    var deleteIcons, mainContainer, i, icon, canDelete, $li;
    mainContainer = this.editPropertyManager.mainContainer;

    if (!cwApi.isUndefined(mainContainer)) {
      deleteIcons = mainContainer.find(".cw-association-delete-item");
    } else {
      deleteIcons = $(".cw-association-delete-item");
    }

    function removeFirstItem() {
      var $e = $(this).parents(".cw-item:first");
      removeItem($e, true);
    }

    for (i = 0; i < deleteIcons.length; i += 1) {
      icon = $(deleteIcons[i]);
      canDelete = $(icon.parents("li")[0]).attr("data-intersection-candelete");

      $li = $(icon.parents("li")[0]);
      //Listbox - list box || Listbox - List
      if ($li.parents(".property-box").length > 1 || $li.parents("li.cw-item").length > 0) {
        canDelete = false;
      }

      if (canDelete === "true" || canDelete === "undefined") {
        icon.show();
        icon.off("click.delete");
        icon.on("click.delete", removeFirstItem);
      }
    }
  };

  cwEditPropertyManagerAssociations.prototype.loadAssociationsFromDOM = function (mainContainer) {
    var associationsDom, that, $propertyAssoBox;

    if (!cwApi.isUndefined(mainContainer)) {
      associationsDom = mainContainer.find(".property-box-asso");
    } else {
      associationsDom = $(".property-box-asso");
    }

    that = this;
    associationsDom.each(function (i, propertyAssoBox) {
      $propertyAssoBox = $(propertyAssoBox);
      that.associations.push(new cwApi.cwEditProperties.cwEditPropertyAssociation($propertyAssoBox));
    });
  };

  cwEditPropertyManagerAssociations.prototype.getValuesForAssociations = function (saveIN) {
    var i, editAssociation, asso;
    for (i = 0; i < this.associations.length; i += 1) {
      editAssociation = this.associations[i];
      asso = editAssociation.getAssociationValue();
      // if(!cwApi.isUndefined(saveIN.associations[asso.nodeId])){
      //     saveIN.associations[asso.nodeId].items = saveIN.associations[asso.nodeId].items.concat(asso.items)
      // }else{
      //     saveIN.associations[asso.nodeId] = asso;
      // }
      saveIN.associations[asso.nodeId] = asso;
    }
  };

  function getAssociationToLoad($assoBox) {
    var targetOt, nodeId, sourceId;

    targetOt = $assoBox.attr("data-target-scriptname");
    nodeId = $assoBox.attr("data-node-id");
    sourceId = $assoBox.attr("data-source-id");
    if (!cwApi.cwEditProperties.canAddAssociationInput(nodeId)) {
      return null;
    }

    return {
      nodeId: nodeId,
      targetObjectTypeScriptName: targetOt,
      sourceId: sourceId,
    };
  }

  var loadedItems = {};
  var loadingInProgress = {};
  var waitingForUpdates = {};

  function addToWaitingForUpdate(objectTypeScriptName, callback) {
    if (cwApi.isUndefined(waitingForUpdates[objectTypeScriptName])) {
      waitingForUpdates[objectTypeScriptName] = [callback];
    } else {
      waitingForUpdates[objectTypeScriptName].push(callback);
    }
  }

  function updateWaitingForUpdateList(objectTypeScriptName, json) {
    if (!cwApi.isUndefined(waitingForUpdates[objectTypeScriptName])) {
      for (var i = 0; i < waitingForUpdates[objectTypeScriptName].length; i++) {
        var callback = waitingForUpdates[objectTypeScriptName][i];
        callback(json);
      }
      delete waitingForUpdates[objectTypeScriptName];
    }
  }

  function getItems(assoToLoad, callback) {
    var otName = assoToLoad.targetObjectTypeScriptName;
    const random = cwApi.getRandomNumber();
    if (!cwApi.isUndefined(loadedItems[otName])) {
      return callback(loadedItems[otName]);
    }
    if (!cwApi.isUndefined(loadingInProgress[otName])) {
      return addToWaitingForUpdate(otName, callback);
    }
    var url = cwApi.getLiveServerURL() + "page/" + otName + "AllNames?" + random;
    loadingInProgress[otName] = true;
    $.getJSON(url, function (json) {
      loadedItems[otName] = json;
      updateWaitingForUpdateList(otName, json);
      delete loadingInProgress[otName];
      return callback(json);
    });
  }

  function setOptionListToSelect($select, json, itemsById, alreadyAssociatedItems) {
    var o, list, i, item, markedForDeletion;
    o = ["<option></option>"];
    list = json[Object.keys(json)[0]];
    for (i = 0; i < list.length; i++) {
      item = list[i];
      itemsById[item.object_id] = item;
      markedForDeletion = cwApi.isObjectMarkedForDeletion(item) ? ' class="markedForDeletion"' : "";
      o.push("<option ", markedForDeletion, '" value="', item.object_id, '"');
      if (!cwApi.isUndefined(alreadyAssociatedItems[item.object_id])) {
        o.push(" selected");
      }
      o.push(">", item.name, "</option>");
    }
    $select.html(o.join(""));
  }

  function addOnClickSearchItem(obj, schema, item, ulContainer, showError) {
    var drawOneLayout;
    var itemOutput = [];
    if (cwApi.queryObject.isCreatePage())
      if (schema.LayoutDrawOneOptions !== null) {
        drawOneLayout = new cwApi.cwLayouts[schema.LayoutDrawOne](schema.LayoutDrawOneOptions);
      } else {
        drawOneLayout = new cwApi.cwLayouts.cwLayoutList(schema.LayoutOptions);
      }
    else {
      if (schema.LayoutDrawOneOptions !== null) {
        drawOneLayout = new cwApi.cwLayouts[schema.LayoutDrawOne](schema.LayoutDrawOneOptions, schema);
      } else {
        drawOneLayout = new cwApi.cwLayouts.cwLayoutList(schema.LayoutOptions, schema);
      }
    }

    var l = cwApi.cwEditProperties.getLayoutWithTemplateOptions(drawOneLayout);
    l.disableOutputChildren();

    l.drawOneMethod = drawOneLayout.drawOneMethod.bind(l);
    l.drawOneMethod(itemOutput, item, undefined, false);
    ulContainer.append(itemOutput.join(""));
    ulContainer.find("li").last().addClass("newly-added");
    if (showError) {
      var o = [];
      o.push(
        '<i class="cw-association-filtered-item fa fa-exclamation" title="',
        $.i18n.prop("editProperties_gs_associate_filter_warning"),
        '"></i>'
      );
      ulContainer.find("li").last().find("div").first().append(o.join(""));
    }
    obj.showDeleteIconsAndSetActions();
  }

  function checkFilter(values, property) {
    var showError = false;
    if (values.OperatorString === "=" && property !== values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === "!=" && property === values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === ">=" && property < values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === "<=" && property > values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === ">" && property <= values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === "<" && property >= values.DisplayValue) {
      showError = true;
    } else if (values.OperatorString === "IN") {
      if (property === "__|UndefinedValue|__") property = "Undefined"; // Hack for undefined look ups
      if (values.DisplayValue.indexOf(property) === -1) showError = true;
    }
    return showError;
  }

  function isWarning(filters, properties) {
    var showError = false;
    Object.keys(filters).some(function (key) {
      var property = properties[key.toLowerCase()];
      filters[key].some(function (values) {
        showError = checkFilter(values, property);
        return showError;
      });
      return showError;
    });
    return showError;
  }

  function getCreateObjectDefaultProperties(name, filters, objectScriptName) {
    var newObject = {};

    for (var i = 0; i < Object.keys(filters).length; i++) {
      var propertyScriptName = Object.keys(filters)[i].toLowerCase();
      var property = cwApi.mm.getProperty(objectScriptName, Object.keys(filters)[i]);
      switch (property.type) {
        case "Lookup":
          newObject[propertyScriptName] = "__|UndefinedValue|__";
          break;
        case "Date":
          newObject[propertyScriptName] = moment(Date.now()).format("DD/MM/YYYY HH:MM:SS");
          break;
        case "Boolean":
          newObject[propertyScriptName] = false;
          break;
        case "Integer":
          newObject[propertyScriptName] = 0;
          break;
        case "Double":
          newObject[propertyScriptName] = 0;
          break;
        default:
          newObject[propertyScriptName] = "";
          break;
      }
    }

    newObject.name = name;
    newObject.datevalidated = "30/12/1899 00:00:00";
    newObject.whocreated = cwApi.currentUser.AdminUserId;
    newObject.whoowns = cwApi.currentUser.AdminUserId;
    newObject.whoupdated = cwApi.currentUser.AdminUserId;

    return newObject;
  }

  function createAssociationObject(name, nodeId, container, obj) {
    var objectId = 0;
    var html = [];
    var newItem = {
      name: name,
      object_id: objectId,
      is_new: true,
      properties: {
        name: name,
      },
      nodeID: nodeId,
    };

    var view = cwApi.getCurrentView();

    var nodeSchema =
      cwAPI.CwPopout.isOpen() && cwApi.customLibs.popoutOpen
        ? cwApi.customLibs.popoutOpen.NodesByID[nodeId]
        : cwApi.ViewSchemaManager.getNodeSchemaById(view.cwView, nodeId);

    newItem.objectTypeScriptName = nodeSchema.ObjectTypeScriptName;

    var layoutName = nodeSchema.LayoutDrawOne;
    var l = new cwApi.cwLayouts.cwLayoutList(
      {
        NodeID: nodeId,
      },
      cwAPI.CwPopout.isOpen() ? cwApi.customLibs.popoutOpen : undefined
    );
    if (!cwApi.isUndefined(cwApi.cwLayouts[layoutName].drawOne)) {
      l.drawOneMethod = cwApi.cwLayouts[layoutName].drawOne.bind(l);
    }
    l.drawOneMethod(html, newItem, undefined, false);
    container.append(html.join(""));
    container.find("li").last().addClass("newly-added");
    if (!cwApi.isObjectEmpty(nodeSchema.Filters)) {
      var showError = isWarning(nodeSchema.Filters, getCreateObjectDefaultProperties(name, nodeSchema.Filters, nodeSchema.ObjectTypeScriptName));
      if (showError) {
        var o = [];
        o.push(
          '<i class="cw-association-filtered-item fa fa-exclamation" title="',
          $.i18n.prop("editProperties_gs_associate_filter_warning"),
          '"></i>'
        );
        container.find("li").last().find("div").first().append(o.join(""));
        cwApi.notificationManager.addNotification($.i18n.prop("EditModeAssociateItemFiltered"), "error");
      }
    }
    obj.showDeleteIconsAndSetActions();
  }

  cwEditPropertyManagerAssociations.prototype.setActionsOnAddToExistingLink = function ($assoBox, assoToLoad) {
    var that,
      $a,
      $select,
      $ulContainer,
      alreadyAssociatedItems,
      itemsById,
      $searchInput,
      $resultContainerGS,
      $loadingGS,
      $noResultGS,
      $resultsGS,
      $searchOffline,
      $addAssociationGS,
      $emptySearchNoObjects,
      currentSearchPage,
      alreadyAssociatedItemsGS,
      objName,
      isEmptySearchOn,
      isHoveringResults,
      isElementSelected;
    that = this;
    $a = $assoBox.find("a.cw-associate-to-existing-item");
    $a.removeClass("cw-hidden");
    this.setMandatoryAssociationDOM(assoToLoad.nodeId, $assoBox);

    $a.on("click", function () {
      cwApi.CwPendingEventsManager.setEvent("SetActionsOnAddToExistingLink");
      $select = $assoBox.find("select.cw-edit-mode-association-autocomplete");
      $select.toggleClass("cw-hidden");
      $select.next("div.chosen-container").toggleClass("cw-hidden");

      if (!$select.hasClass("cw-hidden")) {
        $ulContainer = $("ul.cw-list." + assoToLoad.nodeId);
        alreadyAssociatedItems = {};

        $ulContainer.children(".cw-item").each(function (i, li) {
          alreadyAssociatedItems[$(li).attr("data-item-id")] = true;
        });

        // is no more hidden
        getItems(assoToLoad, function (json) {
          itemsById = {};
          setOptionListToSelect($select, json, itemsById, alreadyAssociatedItems);
          $select.removeAttr("disabled");
          $select.chosen({
            no_results_text: $.i18n.prop("EditModeAssociateNoItemFound"),
            display_selected_options: false,
          });

          $select.off("change");
          $select.on(
            "change",
            onSelectChange.bind({
              $ulContainer: $ulContainer,
              assoToLoad: assoToLoad,
              itemsById: itemsById,
              editAassociationManager: that,
            })
          );
        });
      }

      cwApi.CwPendingEventsManager.deleteEvent("SetActionsOnAddToExistingLink");
    });

    // Global Search Based association
    $searchInput = $assoBox.find("input.cw-edit-mode-association-search");
    $searchInput.removeClass("cw-hidden").val("");
    $resultContainerGS = $searchInput.next("div.cw-edit-mode-association-search-result");
    $resultContainerGS.hide();
    $loadingGS = $resultContainerGS.find("div.loading-label");
    $noResultGS = $resultContainerGS.find("div.no-results");
    $emptySearchNoObjects = $resultContainerGS.find("div.empty-search-no-objects");
    $searchOffline = $resultContainerGS.find("div.search-ofline");
    $resultsGS = $resultContainerGS.find("ul.cw-edit-mode-association-search-results");
    $ulContainer = $("ul.cw-list." + assoToLoad.nodeId);
    $addAssociationGS = $searchInput.prev(".gs-create-new-assocation");
    currentSearchPage = 1;
    isEmptySearchOn = false;
    isHoveringResults = false;
    isElementSelected = false;

    function resetSearchBox() {
      $resultContainerGS.hide();
      $searchInput.val("");
      $addAssociationGS.hide();
      currentSearchPage = 1;
      isHoveringResults = false;
      isElementSelected = false;
    }

    var timer;
    var previousSearchInput = "";
    var atEnd = false;
    var globalSearchAssociate = function () {
      var isSearchEmpty = false;
      if ($searchInput.val() === "") {
        $addAssociationGS.hide();
        isSearchEmpty = true;
      }
      objName = $searchInput.val();
      $resultContainerGS.show();
      if (!cwAPI.queryObject.isCreatePage() && !isSearchEmpty) {
        var schemaNode = cwApi.ViewSchemaManager.getNodeSchemaByIdForCurrentView(that.editPropertyManager.item.nodeID);
        var node = schemaNode.AssociationsTargetObjectTypes[assoToLoad.nodeId];
        if (
          !cwApi.isUndefined(node) &&
          cwApi.mm.canCreateObject(node.targetScriptName) &&
          node.intersectionObjectScriptName !== null &&
          cwApi.mm.canCreateObject(node.intersectionObjectScriptName.toLowerCase())
        ) {
          $addAssociationGS.attr("title", $.i18n.prop("editProperties_createAssociationTarget", objName));
          $addAssociationGS.show();
        }
      }
      $noResultGS.hide();
      $emptySearchNoObjects.hide();
      $searchOffline.hide();
      if ((!isSearchEmpty && objName !== previousSearchInput) || isEmptySearchOn) currentSearchPage = 1;
      if (currentSearchPage === 1) $resultsGS.hide();
      $loadingGS.show();
      getItems(assoToLoad, function (json) {
        itemsById = {};
        var list = json[Object.keys(json)[0]];
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          itemsById[item.object_id] = item;
        }
      });
      cwApi.CwRest.Diagram.getExistingObjects(
        objName, //searchingString
        currentSearchPage, //PageNumber
        assoToLoad.targetObjectTypeScriptName, //objectType
        null, //categoryId
        function (isSuccess, results) {
          if (isSuccess) {
            $loadingGS.hide();
            atEnd = results.length < 5; // no more pages
            if (results.length === 0) {
              if (currentSearchPage === 1) {
                $resultsGS.hide();
                if (isSearchEmpty) {
                  $emptySearchNoObjects.show();
                } else {
                  $noResultGS.show();
                  $noResultGS.find("span").text(objName);
                }
              }
            } else {
              var o = [];
              alreadyAssociatedItemsGS = {};

              $ulContainer.children(".cw-item").each(function (i, li) {
                alreadyAssociatedItemsGS[$(li).attr("data-item-id")] = true;
              });

              results.forEach(function (element, index, array) {
                if (!cwApi.isUndefined(alreadyAssociatedItemsGS[element.ObjectId])) {
                  o.push(
                    '<li class="deactive-result gs-association-result" data-object-id="',
                    element.ObjectId,
                    '" title="',
                    $.i18n.prop("editProperties_gs_associate_disabled"),
                    '">',
                    element.Name,
                    "</li>"
                  );
                } else {
                  o.push(
                    '<li class="active-result gs-association-result" data-object-id="',
                    element.ObjectId,
                    '" title="',
                    element.Name,
                    '">',
                    element.Name,
                    "</li>"
                  );
                }
              });
              $resultsGS.show();
              if (currentSearchPage === 1) {
                $resultsGS.html(o.join(""));
              } else {
                $resultsGS.append(o.join(""));
              }
              $noResultGS.hide();
              $emptySearchNoObjects.hide();
              $resultsGS.find(".gs-association-result").off("click");
              var searchResultOnClick = function () {
                isElementSelected = true;
                if ($(this).hasClass("deactive-result")) return;
                var schema = cwApi.ViewSchemaManager.getNodeSchemaByIdForCurrentView(assoToLoad.nodeId);
                var extraPropertyNames = [];
                var objectId = $(this).attr("data-object-id");
                // var element = $(this);
                if (!cwApi.isObjectEmpty(schema.Filters)) {
                  Object.keys(schema.Filters).forEach(function (key) {
                    extraPropertyNames.push(key);
                  });
                  cwApi.CwRest.Diagram.getExistingObject(schema.ObjectTypeScriptName, objectId, extraPropertyNames, function (
                    isSuccess,
                    completeObj
                  ) {
                    if (isSuccess) {
                      var showError = isWarning(schema.Filters, completeObj.properties);

                      if (showError) {
                        cwApi.notificationManager.addNotification($.i18n.prop("EditModeAssociateItemFiltered"), "error");
                      }
                      addOnClickSearchItem(that, schema, itemsById[objectId], $ulContainer, showError);
                      resetSearchBox();
                    }
                  });
                } else {
                  addOnClickSearchItem(that, schema, itemsById[objectId], $ulContainer, false);
                  resetSearchBox();
                }
              };
              $resultsGS.find(".gs-association-result").off("mousedown").on("mousedown", searchResultOnClick);
              currentSearchPage += 1;
              isEmptySearchOn = false;
            }
          } else {
            $resultsGS.hide();
            $loadingGS.hide();
            $searchOffline.show();
          }
          previousSearchInput = $searchInput.val();
        }
      );
    };

    $resultsGS.off("mouseover");
    $resultsGS.on("mouseover", function () {
      isHoveringResults = true;
    });

    $resultsGS.off("mouseout");
    $resultsGS.on("mouseout", function () {
      isHoveringResults = false;
    });

    $searchInput.off("focus");
    $searchInput.on("focus", function () {
      isEmptySearchOn = true;
      atEnd = false;
      timer && clearTimeout(timer);
      timer = setTimeout(globalSearchAssociate, 500);
    });

    $searchInput.off("blur");
    $searchInput.on("blur", function () {
      if (isHoveringResults === false) {
        resetSearchBox();
      } else if (isElementSelected === false) {
        $searchInput.focus();
      }
    });

    // search on key up event and escape(EsC) to close
    $searchInput.off("keyup");
    $searchInput.on("keyup", function (e) {
      if (e.keyCode === 27) {
        resetSearchBox();
        return;
      }
      if ($(this).val() === "") {
        isEmptySearchOn = true;
      } else {
        isEmptySearchOn = false;
      }
      atEnd = false;
      timer && clearTimeout(timer);
      timer = setTimeout(globalSearchAssociate, 500);
    });

    // load more on scroll
    $addAssociationGS.off("mousedown");
    $addAssociationGS.on("mousedown", function (e) {
      e.preventDefault();

      // Item is not yet created so has no id
      var name = $searchInput.val();
      createAssociationObject(name, assoToLoad.nodeId, $ulContainer, that);

      if (name.trim() !== "") {
        resetSearchBox();
      }
    });

    $resultsGS.off("scroll");
    $resultsGS.on("scroll", function () {
      var top = this.scrollTop;
      var offsetHeight = this.offsetHeight;
      var scrollHeight = this.scrollHeight;
      if (top + offsetHeight >= scrollHeight) {
        //Hit bottom
        if (atEnd) return;
        if ($searchInput.val() === "") globalSearchAssociate(true);
        else globalSearchAssociate(false);
      }
    });

    // End Global Search Based association
  };

  function addOnChangeItem(schema, obj, itemId, showError) {
    var drawOneLayout;
    var itemOutput = [];

    if (cwApi.queryObject.isCreatePage())
      if (schema.LayoutDrawOneOptions !== null) {
        drawOneLayout = new cwApi.cwLayouts[schema.LayoutDrawOne](schema.LayoutDrawOneOptions);
      } else {
        drawOneLayout = new cwApi.cwLayouts.cwLayoutList(schema.LayoutOptions);
      }
    else {
      if (schema.LayoutDrawOneOptions !== null) {
        drawOneLayout = new cwApi.cwLayouts[schema.LayoutDrawOne](schema.LayoutDrawOneOptions, schema);
      } else {
        drawOneLayout = new cwApi.cwLayouts.cwLayoutList(schema.LayoutOptions, schema);
      }
    }

    var l = cwApi.cwEditProperties.getLayoutWithTemplateOptions(drawOneLayout);
    l.disableOutputChildren();

    l.drawOneMethod = drawOneLayout.drawOneMethod.bind(l);
    l.drawOneMethod(itemOutput, obj.itemsById[itemId], undefined, false);
    obj.$ulContainer.append(itemOutput.join(""));
    obj.$ulContainer.find("li").last().addClass("newly-added");
    if (showError) {
      var o = [];
      o.push(
        '<i class="cw-association-filtered-item fa fa-exclamation" title="',
        $.i18n.prop("editProperties_gs_associate_filter_warning"),
        '"></i>'
      );
      obj.$ulContainer.find("li").last().find("div").first().append(o.join(""));
    }
    obj.editAassociationManager.showDeleteIconsAndSetActions();
  }

  function onSelectChange(evt, params) {
    if (params.selected) {
      var extraPropertyNames = [];
      var itemId = params.selected;
      var schema = cwApi.ViewSchemaManager.getNodeSchemaByIdForCurrentView(this.assoToLoad.nodeId);
      var that = this;
      if (!cwApi.isObjectEmpty(schema.Filters)) {
        Object.keys(schema.Filters).forEach(function (key) {
          extraPropertyNames.push(key);
        });
        cwApi.CwRest.Diagram.getExistingObject(schema.ObjectTypeScriptName, itemId, extraPropertyNames, function (isSuccess, completeObj) {
          if (isSuccess) {
            var showError = isWarning(schema.Filters, completeObj.properties);
            if (showError) {
              cwApi.notificationManager.addNotification($.i18n.prop("EditModeAssociateItemFiltered"), "error");
            }
            addOnChangeItem(schema, that, itemId, showError);
          }
        });
      } else {
        addOnChangeItem(schema, this, itemId, false);
      }
    }
  }

  cwEditPropertyManagerAssociations.prototype.setAssociateToExistingActions = function () {
    var that = this;
    $(".property-box-asso").each(function (i, assoBox) {
      var $assoBox;
      $assoBox = $(assoBox);
      var assoToLoad = getAssociationToLoad($assoBox);
      if (assoToLoad === null) {
        // can't use this association type
        return;
      }
      that.setActionsOnAddToExistingLink($assoBox, assoToLoad);
    });
  };

  cwEditPropertyManagerAssociations.prototype.setCreateTargetObjectActions = function (mainContainer) {
    var that = this;
    if (cwApi.isUndefined(mainContainer)) {
      mainContainer = "";
    }

    $(mainContainer + " .cw-association-add-item").on("click.delete", function () {
      var objectName, nodeId, containerId, associationKey, output;

      objectName = $(this).attr("data-object-name");
      containerId = $(this).attr("data-ul-container-id");
      nodeId = $(this).attr("data-nodeid");
      associationKey = $(this).attr("data-ul-container-id");

      function checkNameIsNotEmpty(name) {
        if (name.trim() === "") {
          return true;
        } else {
          return false;
        }
      }

      if ($("#cw-add-association-dialog-" + associationKey).length > 0) {
        output = [];

        cwApi.CwPopout.show($.i18n.prop("editProperties_create", objectName));
        output.push('<form action="#" class="form-create">');
        output.push("<h3>", $.i18n.prop("editProperties_createAssociationTarget", objectName), "</h3>");
        output.push($("#cw-add-association-dialog-" + associationKey).html());
        output.push(
          '<p><button id="btn_createAssociation" type="button" class="btn-primary">' +
            $.i18n.prop("editProperties_createAssociationTargetCreate") +
            "</button></p>"
        );
        output.push("</form>");
        cwApi.CwPopout.setContent(output.join(""));

        $("#btn_createAssociation").on("click", function (e) {
          var name, view, nodeSchema, l, layoutName, objectId, html, newItem, $ul;

          e.preventDefault();

          // Item is not yet created so has no id
          name = $("#cw-add-association-name-" + associationKey).val();
          $ul = $("ul." + containerId);

          if (checkNameIsNotEmpty(name) === false) {
            createAssociationObject(name, nodeId, $ul, that);
            cwApi.CwPopout.hide();
          } else {
            $(".form-create").addClass("validation_error");
          }
        });
      }
    });
  };

  cwApi.cwEditProperties.cwEditPropertyManagerAssociations = cwEditPropertyManagerAssociations;
})(cwAPI, jQuery);
