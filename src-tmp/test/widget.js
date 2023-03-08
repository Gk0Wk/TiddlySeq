(function () {
  "use strict";
  function clearConf(conf) {
    if (conf.type === "component") {
      delete conf.componentState.widget;
      delete conf.componentState.dom;
    } else {
      $tw.utils.each(conf.content, function (child) {
        clearConf(child);
      });
    }
    return conf;
  }
  var GoldenLayout = undefined;
  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var PageTOCWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
    if ($tw.browser && !GoldenLayout) {
      console.log(window.$);
      GoldenLayout = require("$:/plugins/Gk0Wk/test/goldenlayout.min.js");
    }
  };
  PageTOCWidget.prototype = new Widget();
  PageTOCWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    this.makeRender(parent, nextSibling);
  };
  PageTOCWidget.prototype.execute = function () {
    // Get our parameters
    this.stateTiddler = this.getAttribute("state", undefined);
    if (
      $tw &&
      $tw.config &&
      $tw.config.htmlUnsafeElements &&
      $tw.config.htmlUnsafeElements.indexOf(this.tocNodeTag) !== -1
    )
      this.tocNodeTag = "div";
    this.containerDomClassName = this.getAttribute(
      "class",
      "gk0wk-test-container"
    );
  };
  PageTOCWidget.prototype.refresh = function (changedTiddlers) {
    var changedAttributes = this.computeAttributes();
    if (
      $tw.utils.count(changedAttributes) > 0 ||
      $tw.utils.count(changedTiddlers) > 0
    ) {
      if (
        $tw.utils.count(changedAttributes) === 1 &&
        $tw.utils.count(changedTiddlers) === 0 &&
        changedAttributes["class"] !== undefined
      ) {
        this.domNodes[0].className = this.getAttribute(
          "class",
          "gk0wk-test-container"
        );
        return false;
      } else {
        return true;
      }
    }
    return false;
  };
  PageTOCWidget.prototype.makeRender = function (parent, nextSibling) {
    var that = this;
    var containerNode = this.document.createElement("div");
    containerNode.className = this.containerDomClassName;
    this.domNodes = [containerNode];
    try {
      var myLayout = (this.myLayout = new GoldenLayout(
        JSON.parse($tw.wiki.renderTiddler("text/plain", this.stateTiddler, {})),
        containerNode
      ));
      myLayout.registerComponent(
        "tiddlerComponent",
        function (container, componentState) {
          var tiddlerWidget = $tw.wiki.makeTranscludeWidget(
            componentState.title,
            {
              document: document,
              parentWidget: that,
              recursionMarker: "no",
              importPageMacros: true,
            }
          );
          var tiddlerContainer = document.createElement("div");
          tiddlerWidget.render(tiddlerContainer, undefined);
          container.getElement().append(tiddlerContainer);
          container.extendState({
            widget: tiddlerWidget,
            dom: tiddlerContainer,
          });
          container.setTitle(componentState.title);
        }
      );
      myLayout.init();
      myLayout.on("stateChanged", function () {
        var a = JSON.stringify(clearConf(myLayout.toConfig()));
        console.log(a);
        $tw.wiki.setText(that.stateTiddler, undefined, undefined, a);
      });
    } catch (e) {
      console.error(e);
      containerNode.innerText = String(e);
    }
    parent.insertBefore(containerNode, nextSibling);
  };
  exports["testss"] = PageTOCWidget;
})();
