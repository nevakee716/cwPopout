/* Copyright (c) 2012-2016 Casewise Systems Ltd (UK) - All rights reserved */

/*global cwAPI, jQuery, cwConfigurationEditorMapping */
(function (cwApi, $) {
  "use strict";
  var that, showPopoutContent;

  var engine = function (editManager, isInPopout) {
    this.editManager = editManager;
    this.item = editManager.item;
    this.isInPopout = isInPopout === true;
    that = this;
  };

  engine.prototype.getTabId = function () {
    return "save-tab";
  };

  engine.prototype.setContent = function (content) {
    $(".cw-diagram-popout-container ." + that.getTabId()).html(content);
  };

  engine.prototype.setTitle = function (title) {
    if (!this.isInPopout) {
      cwApi.CwPopout.setTitle(title);
    }
  };

  engine.prototype.init = function () {
    this.editManager.initialValues = this.editManager.getValues(true);
  };

  showPopoutContent = function (callback) {
    var object, objectName, newValues, action, objectId, objectTypeScriptName;

    object = that.editManager.item;
    objectName = "";
    objectId = undefined;
    objectTypeScriptName = undefined;
    newValues = that.editManager.getValues();

    objectId = object.object_id;
    objectTypeScriptName = object.objectTypeScriptName;
    if (!cwApi.isUndefined(object.IName)) {
      objectName = object.IName;
    } else if (!cwApi.isUndefined(object.name)) {
      objectName = object.name;
    }

    that.setContent(that.displayForm());
    that.setTitle($.i18n.prop("editmode_updateSummary") + " : " + that.item.displayName);
    action = cwApi.CwPendingChangeset.ActionType.Update;

    that.processChangesAndDisplay(
      1,
      action,
      that.editManager.initialValues,
      newValues,
      objectName,
      objectId,
      objectTypeScriptName,
      function (dueDate, submitCtrlCallback) {
        that.submitBtnClick(1, callback, dueDate, submitCtrlCallback);
      },
      callback
    );
  };

  engine.prototype.saveItem = function (callback) {
    var editManager = this.editManager;
    // change when already in popout --> add tab
    if (this.isInPopout) {
      showPopoutContent(callback);
    } else {
      cwApi.CwPopout.showPopout($.i18n.prop("editmode_changes"), function () {
        showPopoutContent(callback);
      });
    }
  };

  engine.prototype.displayForm = function () {
    var output = [];
    output.push('<form action="#" class="form-edit">');
    output.push('<div class="saveChanges">');
    output.push("</div>");
    output.push('<fieldset class="submit">');
    output.push("</fieldset>");
    output.push("</form>");
    return output.join("");
  };

  function outputChanges(html) {
    $("div.saveChanges").html(html);
  }

  function outputGenericError() {
    var o = [];
    cwApi.CwPendingChangesUi.outputError(
      o,
      $.i18n.prop("editmode_thereWasAnIssueWhichMeansTheChangesWereNotSavedPleaseContactYourAdministrator"),
      false
    );
    outputChanges(o.join(""));
  }

  function handleSaveError(response, unsetEditMode, isApprovalMode) {
    var changesetWithErrors, pendingChangesWithErrors, isPendingChangesError;
    isPendingChangesError = !(cwApi.isUndefined(response.pendingChanges) || cwApi.isNull(response.pendingChanges));
    that.setTitle($.i18n.prop("editmode_errorSummary"));

    if (isPendingChangesError) {
      pendingChangesWithErrors = new cwApi.CwPendingChanges();
      pendingChangesWithErrors.parseJson(response.pendingChanges);
      changesetWithErrors = pendingChangesWithErrors.getFirstChangeset();
    }

    if (unsetEditMode) {
      cwApi.cwEditProperties.unsetEditMode();
      $(document).on("pageLoaded", function () {
        if (that.isInPopout) {
          that.setContent(buildPopoutOutput());
          if (isPendingChangesError) {
            outputChanges(changesetWithErrors.toErrorSummaryHtml(isApprovalMode));
          } else {
            outputGenericError();
          }
          $(document).off("pageLoaded");
        } else {
          cwApi.CwPopout.showPopout($.i18n.prop("editmode_errorSummary"), function () {
            that.setContent(buildPopoutOutput());
            if (isPendingChangesError) {
              outputChanges(changesetWithErrors.toErrorSummaryHtml(isApprovalMode));
            } else {
              outputGenericError();
            }
            $(document).off("pageLoaded");
          });
        }
      });
    } else {
      that.setContent(buildPopoutOutput());
      if (isPendingChangesError) {
        outputChanges(changesetWithErrors.toErrorSummaryHtml(isApprovalMode));
      } else {
        outputGenericError();
      }
    }
  }

  engine.prototype.submitBtnClick = function (source, callback, dueDate, submitCtrlCallback) {
    var changeset,
      $this,
      id,
      changeType,
      changeIndex,
      comment,
      that = this;
    changeset = cwApi.pendingChanges.getFirstChangeset();

    $(".form-edit textarea").each(function () {
      $this = $(this);
      id = $this.attr("id");
      comment = $this.val();
      changeIndex = $this.data("cw-index");
      changeType = $this.data("cw-changetype");
      changeset.updateCommentForChange(changeIndex, changeType, comment);
    });

    if (!cwApi.cwEditProperties.cwEditPropertyMemo.isHTMLContent(comment)) {
      cwApi.pendingChanges.sendAsChangeRequest(
        dueDate,
        function (response, loginLoaded) {
          if (cwApi.statusIsKo(response)) {
            if (!loginLoaded) {
              try {
                var unsetEditMode = source === editSource.ObjectPage && changeset.action !== cwApi.CwPendingChangeset.ActionType.Create;
                handleSaveError(response, unsetEditMode, false);

                if (changeset.action === cwApi.CwPendingChangeset.ActionType.Update) {
                  cwApi.notificationManager.addNotification($.i18n.prop("editmode_someOfTheChangesWereNotUpdated"), "error");
                } else if (changeset.action === cwApi.CwPendingChangeset.ActionType.Create) {
                  cwApi.notificationManager.addNotification($.i18n.prop("editmode_thereWasAnIssueWhichMeansTheObjectWasNotCreated"), "error");
                }
              } catch (e) {
                document.location.reload();
              }
            }
          } else {
            if (response.changesInReview) {
              cwApi.notificationManager.addNotification($.i18n.prop("editmode_yourChangesHaveBeenSentForReview"));
            } else {
              cwApi.notificationManager.addNotification($.i18n.prop("editmode_yourChangeHaveBeenSaved"));
            }
            submitCtrlCallback(true);
            that.hidePopout();
            cwApi.CwPendingEventsManager.deleteEvent("PopoutSaveSubmitBtnClick");
          }
          if (!cwApi.isUndefinedOrNull(callback) && cwApi.isFunction(callback)) {
            return callback(response);
          }
        },
        function (object) {
          that.setTitle($.i18n.prop("editmode_errorSummary"));
          that.setContent(buildPopoutOutput());
          cwApi.notificationManager.addNotification($.i18n.prop("editmode_someOfTheChangesWereNotUpdated"), "error");
          outputGenericError();
        }
      );
    } else {
      outputGenericError();
    }
  };

  engine.prototype.processChangesAndDisplay = function (
    source,
    action,
    sourceItem,
    targetItem,
    objectName,
    sourceItemId,
    sourceObjectTypeScriptName,
    submitMethod,
    finalCallback
  ) {
    this.processChanges(action, sourceItem, targetItem, objectName, sourceItemId, sourceObjectTypeScriptName);
    this.displayChanges(source, submitMethod, finalCallback);
  };

  engine.prototype.processChanges = function (action, sourceItem, targetItem, objectName, sourceItemId, sourceObjectTypeScriptName) {
    var changeset;
    cwApi.pendingChanges.clear();
    changeset = new cwApi.CwPendingChangeset(sourceObjectTypeScriptName, sourceItemId, objectName, true, action);
    changeset.checkMandatoryValues(sourceItem, targetItem);
    changeset.compareAndAddChanges(sourceItem, targetItem);
    cwApi.pendingChanges.addChangeset(changeset);
  };

  engine.prototype.displayChanges = function (source, submitMethod, callback) {
    var output, changeset, viewName, createSourceObjectId;
    output = [];
    changeset = cwApi.pendingChanges.getFirstChangeset();
    if (!changeset.mandatoryValueChange.areAllMandatoryValuesSet()) {
      if (!this.isInPopout) {
        cwApi.CwPopout.setTitle($.i18n.prop("editmode_warning"));
      }
      changeset.mandatoryValueChange.buildUnsetMandatoryValuesMessage(output, false, changeset.associationChanges.length);
      outputChanges(output.join(""));
    } else if (changeset.hasChanges()) {
      viewName = cwApi.replaceSpecialCharacters(this.item.objectTypeScriptName);
      changeset.approverList = [];

      changeset.fetchAndUpdateWithApprovers(viewName, createSourceObjectId, function () {
        output.push(changeset.toChangeSummaryHtml());
        outputChanges(output.join(""));
        cwApi.CwEditSubmit.outputSubmit(source, submitMethod);

        if (changeset.hasApprovers()) {
          registerActions();
        }
      });
    } else {
      if (!cwApi.isUndefinedOrNull(callback) && cwApi.isFunction(callback)) {
        return callback();
      }
      this.displayNoChangeMessage();
    }
  };

  engine.prototype.displayNoChangeMessage = function () {
    var output = [];
    cwApi.CwPendingChangesUi.outputInfoMessage(output, $.i18n.prop("diffManager_thereAreCurrentlyNoChangesToSave"));
    outputChanges(output.join(""));
  };

  /* engine.prototype.displayChangeOrderMessage = function (submitMethod){
    var $submitFieldset = $('fieldset.submit'), html = [],
      summaryText = $.i18n.prop('dashboard_execute_editmode_orderChanged'),
      buttonText = $.i18n.prop('editmode_submit'),
      processingText = $.i18n.prop('editmode_preparingYourChanges');;
    html.push(cwApi.workflow.ui.controls.CwSubmit.build(summaryText, buttonText, processingText, false, false, false, [], false, function (arg1, arg2) {
        submitMethod();
    }));
    $submitFieldset.html(html.join(''));
  }; */

  engine.prototype.hidePopout = function (arg) {
    if (!this.isInPopout) {
      cwApi.CwPopout.hide();
    }
  };

  if (!cwApi.customLibs) {
    cwApi.customLibs = {};
  }
  if (!cwApi.customLibs.cwLayoutExecuteSequence) {
    cwApi.customLibs.cwLayoutExecuteSequence = {};
    cwApi.customLibs.cwLayoutExecuteSequence.saveEngine = engine;
  }

  cwApi.getAssociationType = function (associationNodeId) {
    var tabSchema, rootNodeId, associationType;

    if (cwAPI.CwPopout.isOpen() && cwApi.customLibs.popoutOpen) {
      let schema = cwApi.customLibs.popoutOpen;
      return schema.NodesByID[schema.RootNodesId].AssociationsTargetObjectTypes[associationNodeId];
    }
    if (cwApi.getCurrentView().type === "Index" && cwApi.getCurrentView().HasTabs) {
      tabSchema = $.grep(cwApi.ViewSchemaManager.getCurrentViewSchema().Tab.Tabs, function (e) {
        return e.Id === cwTabManager.getCurrentTab();
      });
      rootNodeId = tabSchema[0].Nodes[0];
      associationType = cwApi.ViewSchemaManager.getCurrentViewSchema().NodesByID[rootNodeId].AssociationsTargetObjectTypes[associationNodeId];
    } else {
      associationType = cwApi.ViewSchemaManager.getFirstRootNodeSchemaForCurrentView().AssociationsTargetObjectTypes[associationNodeId];
    }
    return associationType;
  };
})(cwAPI, jQuery);
