(function () {
  "use strict";
  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var EchartsJS = require("$:/plugins/Gk0Wk/echarts/echarts.min.js");
  var EChartsWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };
  EChartsWidget.prototype = new Widget();
  EChartsWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    var container = document.createElement('div');
    container.setAttribute('class', "gk0wk-echarts-body");
    container.style.width = '100%';
    container.style.height = '700px';
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
    if (this.chart) this.chart.dispose();
    this.chart = EchartsJS.init(container, 'dark');
    // var webkitDep = JSON.parse($tw.wiki.getTiddlerText('map.json'));
    var nodes = [];
    var links = [];
    $tw.utils.each($tw.wiki.filterTiddlers('[all[]!prefix[$:/]]'), function (tiddlerTitle) {
      nodes.push({ id: tiddlerTitle, name: tiddlerTitle });
      $tw.utils.each($tw.wiki.getTiddlerBacklinks(tiddlerTitle), function (anotherTiddlerTitle) {
        links.push({
          source: anotherTiddlerTitle,
          target: tiddlerTitle,
          label: {
            show: true,
            formatter: 'backlink'
          }
        });
      });
    });
    console.log({ nodes, links })
    this.chart.setOption({
      tooltip: {},
      series: [
        {
          name: 'Les Miserables',
          type: 'graph',
          layout: 'force',
          data: nodes,
          links: links,
          roam: true,
          label: {
            position: 'right',
            show: true
          },
          force: {
            repulsion: 100
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 10],
          edgeLabel: {
            fontSize: 5
          },
          lineStyle: {
            opacity: 0.9,
            width: 2,
            curveness: 0
          }
        }
      ]
    });
    var that = this;
    if (ResizeObserver) {
      var observer = new ResizeObserver(function (entries) {
        that.chart.resize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      });
      observer.observe(container);
    }
  };
  EChartsWidget.prototype.execute = function () {
    return;
  };
  EChartsWidget.prototype.refresh = function () {
    var changedAttributes = this.computeAttributes();
    if (Object.keys(changedAttributes).length > 0) {
      this.refreshSelf();
      return true;
    } else {
      return false;
    }
  };
  exports.echarts = EChartsWidget;
})();
