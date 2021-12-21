(function () {
  "use strict";
  var Widget = require("$:/core/modules/widgets/widget.js").widget;
  var EchartsJS = require("$:/plugins/Gk0Wk/echarts/echarts.min.js");
  var Categories = [
    {
      name: 'Focusing'
    },
    {
      name: 'History'
    },
    {
      name: 'Link To'
    },
    {
      name: 'Backlink From'
    },
    {
      name: 'Tag To'
    },
    {
      name: 'Tag By'
    },
    {
      name: 'Parent'
    },
  ];
  var TheBrainWidget = function (parseTreeNode, options) {
    this.initialise(parseTreeNode, options);
  };
  TheBrainWidget.prototype = new Widget();
  TheBrainWidget.prototype.render = function (parent, nextSibling) {
    this.parentDomNode = parent;
    this.computeAttributes();
    this.execute();
    var container = document.createElement('div');
    container.setAttribute('class', "gk0wk-echarts-body");
    container.style.width = '100%';
    container.style.height = '90vh';
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
    if (this.chart) this.chart.dispose();
    var chart = this.chart = EchartsJS.init(container, 'dark');
    if (ResizeObserver) {
      var observer = new ResizeObserver(function (entries) {
        chart.resize({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height,
        });
      });
      observer.observe(container);
    }
    var historyTiddlers = [];
    var updateMapView = function () {
      var focussedTiddler = $tw.wiki.getTiddlerText('$:/temp/focussedTiddler');
      if (focussedTiddler && focussedTiddler.startsWith('$:/')) return;
      var nodes = [];
      var edges = [];
      if (focussedTiddler && focussedTiddler !== '') {
        var nodeMap = {};

        // 当前关注的 Tiddler
        nodeMap[focussedTiddler] = true;
        nodes.push({
          name: focussedTiddler,
          // fixed: true,
          category: 0,
        });

        // 历史路径
        var nextTiddler = focussedTiddler;
        var historyMap = {};
        for (var i = historyTiddlers.length - 1; i >= 0; i--) {
          if (historyMap[tiddlerTitle]) break;
          var tiddlerTitle = historyTiddlers[i];
          edges.push({
            source: tiddlerTitle,
            target: nextTiddler,
            label: {
              show: true,
              formatter: 'history'
            }
          });
          historyMap[tiddlerTitle] = true;
          nextTiddler = tiddlerTitle;
          if (nodeMap[tiddlerTitle]) break;
          nodes.push({
            name: tiddlerTitle,
            category: 1,
          });
          nodeMap[tiddlerTitle] = true;
        }

        // 链接
        $tw.utils.each($tw.wiki.getTiddlerLinks(focussedTiddler), function (tiddlerTitle) {
          edges.push({
            source: focussedTiddler,
            target: tiddlerTitle,
            label: {
              show: true,
              formatter: 'link'
            }
          });
          if (nodeMap[tiddlerTitle]) return;
          nodes.push({
            name: tiddlerTitle,
            category: 2,
          });
          nodeMap[tiddlerTitle] = true;
        });

        // 反链
        $tw.utils.each($tw.wiki.getTiddlerBacklinks(focussedTiddler), function (tiddlerTitle) {
          edges.push({
            source: tiddlerTitle,
            target: focussedTiddler,
            label: {
              show: true,
              formatter: 'backlink'
            }
          });
          if (nodeMap[tiddlerTitle]) return;
          nodes.push({
            name: tiddlerTitle,
            category: 3,
          });
          nodeMap[tiddlerTitle] = true;
        });

        // 指向哪些tag
        $tw.utils.each($tw.wiki.getTiddler(focussedTiddler).fields.tags, function (tiddlerTitle) {
          if (!$tw.wiki.tiddlerExists(tiddlerTitle)) return;
          edges.push({
            source: focussedTiddler,
            target: tiddlerTitle,
            label: {
              show: true,
              formatter: 'tag'
            }
          });
          if (nodeMap[tiddlerTitle]) return;
          nodes.push({
            name: tiddlerTitle,
            category: 4,
          });
          nodeMap[tiddlerTitle] = true;
        });

        // 被谁作为 Tag
        $tw.utils.each($tw.wiki.getTiddlersWithTag(focussedTiddler), function (tiddlerTitle) {
          edges.push({
            source: tiddlerTitle,
            target: focussedTiddler,
            label: {
              show: true,
              formatter: 'tag'
            }
          });
          if (nodeMap[tiddlerTitle]) return;
          nodes.push({
            name: tiddlerTitle,
            category: 5,
          });
          nodeMap[tiddlerTitle] = true;
        });

        // 父条目
        var path = focussedTiddler.split('/');
        if (path.length > 1) {
          var parentTiddler = path.slice(0, -1).join('/');
          $tw.utils.each([parentTiddler, parentTiddler + '/'], function (tiddlerTitle) {
            edges.push({
              source: tiddlerTitle,
              target: focussedTiddler,
              label: {
                show: true,
                formatter: 'parent'
              }
            });
            if (nodeMap[tiddlerTitle]) return;
            nodes.push({
              name: tiddlerTitle,
              category: 6,
            });
            nodeMap[tiddlerTitle] = true;
          });
        }
      }
      var option = {
        tooltip: {},
        legend: [
          {
            data: Categories.map(function (a) {
              return a.name;
            })
          }
        ],
        series: [
          {
            name: 'The Brain View',
            type: 'graph',
            layout: 'force',
            nodes: nodes,
            edges: edges,
            categories: Categories,
            roam: true,
            label: {
              position: 'right',
              show: true
            },
            force: {
              repulsion: 50
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
      };
      chart.setOption(option);
      historyTiddlers.push(focussedTiddler);
      historyTiddlers.slice(-10);
    };
    // 去抖
    var timer;
    var tryUpdateMap = function () {
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        timer = undefined;
        updateMapView();
      }, $tw.utils.getAnimationDuration() + 10);
    };
    $tw.wiki.addEventListener('change', tryUpdateMap);
    tryUpdateMap();
  };
  TheBrainWidget.prototype.execute = function () {
    return;
  };
  TheBrainWidget.prototype.refresh = function () {
    var changedAttributes = this.computeAttributes();
    if (Object.keys(changedAttributes).length > 0) {
      this.refreshSelf();
      return true;
    } else {
      return false;
    }
  };
  exports['the-brain'] = TheBrainWidget;
})();
