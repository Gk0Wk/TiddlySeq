(function() {
    "use strict";
    var Widget = require("$:/core/modules/widgets/widget.js").widget;
    var PageTOCWidget = function(parseTreeNode, options) {
        this.initialise(parseTreeNode, options);
    };

    function getTOCInfo(tiddler) {
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
        $tw.utils.each($tw.wiki.parseTiddler(tiddler).tree, function(node) {
            if (node.type !== "element") return;
            if (!/^h[1-6]$/.test(node.tag)) return;
            var children = node.children;
            if (!children || children.length == 0) return;
            var text = [];
            for (var i = 0, len = children.length; i < len; i++) {
                try {
                    var child = children[i];
                    switch (child.type) {
                        case 'text':
                            text.push(child.text);
                            break;
                        case 'link':
                            text.push(child.children.length > 0 ? child.children[0].text : child.to.value);
                            break;
                    }
                } catch (e) {
                    console.error(e);
                }
            }
            headers.push({
                tag: node.tag,
                count: headersCount[node.tag]++,
                text: text.join(''),
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
            var toc = getTOCInfo(this.tocTitle);
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
                        headerNode.addEventListener('click', function() {
                            try {
                                var tiddlerFrameNode = document.querySelector('.tc-tiddler-frame[data-tiddler-title="' + toc.title + '"]');
                                if (tiddlerFrameNode === undefined) return;
                                var headerInfo = toc.headers[parseInt(this.getAttribute("index"))];
                                if (headerInfo === undefined) return;
                                var _headerNode = tiddlerFrameNode.querySelectorAll('.tc-tiddler-body > ' + headerInfo.tag)[headerInfo.count];
                                if (_headerNode === undefined) return;
                                _headerNode.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'center',
                                });
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
