(function() {
    "use strict";
    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var PageTOCWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    function getTOCInfo(tiddler, includeHeaderMap) {
        // Check empty
        if (tiddler === "") return undefined;
        var currentTiddler = $tw.wiki.getTiddler(tiddler);
        if (!currentTiddler) return undefined;
        var type = currentTiddler.fields.type;
        if (type && type !== "" && type !== "text/vnd.tiddlywiki" && type !== "text/x-markdown") return undefined;
        var headers = [];
        var headersCount = {
            'h1': 0,
            'h2': 0,
            'h3': 0,
            'h4': 0,
            'h5': 0,
            'h6': 0,
        };
        var root = $tw.wiki.parseTiddler(tiddler).tree;
        var renderRoot = [],
            renderLeaf = renderRoot;
        // Parse params
        while (['set', 'importvariables'].indexOf(root[0].type) > -1) {
            renderRoot = [Object.assign({}, root[0], {
                children: renderRoot
            })];
            root = root[0].children;
        }
        $tw.utils.each(root, function(node) {
            if (node.type !== "element") return;
            if (includeHeaderMap[node.tag] !== true) return;
            // Clear and re-fill
            renderLeaf.splice(0, renderLeaf.length);
            renderLeaf.push.apply(renderLeaf, node.children);
            // Render contents of header
            var container = $tw.fakeDocument.createElement("div");
            $tw.wiki.makeWidget({
                tree: renderRoot
            }, {}).render(container, null);
            headers.push({
                tag: node.tag,
                count: headersCount[node.tag]++,
                text: container.textContent,
            });
        });
        return {
            title: tiddler,
            headers: headers,
        };
    }
    PageTOCWidget.prototype = new Widget();
    PageTOCWidget.prototype.render = function(parent, nextSibling) {
        this.parentDomNode = parent;
        if (this.parentWidget && this.parentWidget.hasVariable("page-toc-recursion-detection", "yes")) {
            parent.insertBefore(this.document.createTextNode('[Page TOC]'), nextSibling);
            return;
        }
        this.setVariable("page-toc-recursion-detection", "yes");
        this.computeAttributes();
        this.execute();
        this.makeRender(parent, nextSibling);
        this.renderChildren(parent, nextSibling);
    };
    PageTOCWidget.prototype.execute = function() {
        // Get our parameters
        this.tocTitle = this.getAttribute("tiddler", this.getVariable("currentTiddler"));
        this.tocNodeTag = this.getAttribute("tag", "div");
        if ($tw && $tw.config && $tw.config.htmlUnsafeElements && $tw.config.htmlUnsafeElements.indexOf(this.tocNodeTag) !== -1) this.tocNodeTag = 'div';
        this.tocHeaderNodeTag = this.getAttribute("headerTag", "p");
        if ($tw && $tw.config && $tw.config.htmlUnsafeElements && $tw.config.htmlUnsafeElements.indexOf(this.tocHeaderNodeTag) !== -1) this.tocHeaderNodeTag = 'p';
        this.tocNodeClass = this.getAttribute("class", "gk0wk-tiddlertoc-container");
        this.tocHeaderNodeClassPrefix = this.getAttribute("headerClassPrefix", "gk0wk-tiddlertoc-");
        this.emptyMessage = this.getAttribute("emptyMessage", "");
        this.includeHeaderMap = {
            h1: this.getAttribute("h1", "yes") === "yes",
            h2: this.getAttribute("h2", "yes") === "yes",
            h3: this.getAttribute("h3", "yes") === "yes",
            h4: this.getAttribute("h4", "yes") === "yes",
            h5: this.getAttribute("h5", "yes") === "yes",
            h6: this.getAttribute("h6", "yes") === "yes",
        };
        this.scrollMode = this.getAttribute("scrollMode", "center");
        if (["start", "center", "end", "nearest"].indexOf(this.scrollMode) === -1) this.scrollMode = "center";
        var info = this.wiki.getTextReferenceParserInfo(this.tocTitle, 'text', '', {});
        this.sourceText = info.sourceText;
        this.parserType = info.parserType;
    };

    PageTOCWidget.prototype.parserNeedsRefresh = function() {
        var parserInfo = this.wiki.getTextReferenceParserInfo(this.tocTitle, 'text', '', {});
        return (this.sourceText === undefined || parserInfo.sourceText !== this.sourceText || this.parserType === undefined || parserInfo.parserType !== this.parserType);
    };
    PageTOCWidget.prototype.refresh = function(changedTiddlers) {
        var changedAttributes = this.computeAttributes();
        if (($tw.utils.count(changedAttributes) > 0) || (changedTiddlers[this.tocTitle] && this.parserNeedsRefresh())) {
            this.refreshSelf();
            return true;
        } else {
            return this.refreshChildren(changedTiddlers);
        }
    };

    PageTOCWidget.prototype.makeRender = function(parent, nextSibling) {
        if (this.domNode && parent.contains && parent.contains(this.domNode)) {
            parent.removeChild(this.domNode);
        }
        var tocNode = this.document.createElement(this.tocNodeTag);
        this.domNode = tocNode;
        tocNode.className = this.tocNodeClass;
        try {
            var toc = getTOCInfo(this.tocTitle, this.includeHeaderMap);
            var headerNode;
            if (toc === undefined || toc.headers.length === 0) {
                headerNode = document.createElement(this.tocHeaderNodeTag);
                headerNode.className = this.tocHeaderNodeClassPrefix + 'empty';
                headerNode.innerText = this.emptyMessage;
                tocNode.appendChild(headerNode);
            } else {
                for (var i = 0, len = toc.headers.length; i < len; i++) {
                    var header = toc.headers[i];
                    headerNode = this.document.createElement(this.tocHeaderNodeTag);
                    headerNode.className = this.tocHeaderNodeClassPrefix + header.tag;
                    headerNode.innerText = header.text;
                    if (headerNode.setAttribute && headerNode.addEventListener) {
                        headerNode.setAttribute('index', i.toString());
                        var scrollMode = this.scrollMode;
                        headerNode.addEventListener('click', function() {
                            try {
                                var tiddlerFrameNode = document.querySelector('.tc-tiddler-frame[data-tiddler-title="' + toc.title + '"]');
                                if (tiddlerFrameNode === undefined) return;
                                var headerInfo = toc.headers[parseInt(this.getAttribute("index"))];
                                if (headerInfo === undefined) return;
                                var _headerNode = tiddlerFrameNode.querySelectorAll('.tc-tiddler-body > ' + headerInfo.tag)[headerInfo.count];
                                if (_headerNode === undefined) return;
                                if (scrollMode === 'center' || scrollMode === 'nearest') {
                                    _headerNode.scrollIntoView({
                                        behavior: 'smooth',
                                        block: scrollMode,
                                    });
                                } else {
                                    // Position fix
                                    _headerNode.scrollIntoView({
                                        behavior: 'instant',
                                        block: scrollMode,
                                    });
                                    if (tscrollMode === 'end') {
                                        document.body.scrollTop += 100;
                                        document.scrollingElement.scrollTop += 100;
                                    } else {
                                        document.body.scrollTop -= 100;
                                        document.scrollingElement.scrollTop -= 100;
                                    }
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        });
                    }
                    tocNode.appendChild(headerNode);
                }
            }
        } catch (e) {
            console.error(e);
            tocNode.innerText = String(e);
        }
        parent.insertBefore(tocNode, nextSibling);
    };
    exports['page-toc'] = PageTOCWidget;
})();
