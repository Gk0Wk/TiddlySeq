(function(){
	"use strict";
	if (typeof window !== 'undefined' && window.document) {
		var listLevel = [
			'', '* ', '** ', '*** ', '**** ', '***** ', '****** '
		];
		function getTOC() {
			var currentTiddlerName = $tw.wiki.filterTiddlers('[[$:/temp/focussedTiddler]get[text]]');
			// Check empty
			if (currentTiddlerName.length < 1) return;
			currentTiddlerName = currentTiddlerName[0];
			if (currentTiddlerName === "") return;
			if (currentTiddlerName === "CurrentTiddlerTOC") return;
			var currentTiddler = $tw.wiki.getTiddler(currentTiddlerName);
			if (!currentTiddler) return;
			var type = currentTiddler.fields.type;
			if (type && type !== "" && type !== "text/vnd.tiddlywiki" && type !== "text/x-markdown") return;
			var tocList = [];
			$tw.utils.each($tw.wiki.parseTiddler(currentTiddlerName).tree, function(node) {
				if (node.type !== "element") return;
				if (!/^h[1-6]$/.test(node.tag)) return;
				var children = node.children;
				if (!children || children.length == 0 || children[0].type !== 'text') return;
				tocList.push(listLevel[node.tag.charAt(1)] + children[0].text);
			});
			return $tw.wiki.renderText('text/html', 'text/vnd.tiddlywiki', tocList.join('\n'));
		}
		$tw.hooks.addHook('th-page-refreshed', function() {
			var tiddlerTOCNode = document.querySelector('#gk0wk-tiddler-toc-box');
			if (!tiddlerTOCNode) return;
			var toc = getTOC();
			tiddlerTOCNode.innerHTML = toc ? toc : "<div>TOC is empty.</div>";
		});
	}
})();
