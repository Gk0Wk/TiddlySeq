!function(e){"object"==typeof exports&&"object"==typeof module?e(require("../../lib/codemirror")):"function"==typeof define&&define.amd?define(["../../lib/codemirror"],e):e(CodeMirror)}(function(c){"use strict";var i={completeSingle:!1,closeOnPick:!0};c.defineInitHook(function(e){e.on("change",function(e,t){if((!e.state.completeActive||"function"==typeof e.showHint)&&"true"===$tw.wiki.getTiddlerText("$:/plugins/Gk0Wk/codemirror-mode-tiddlywiki5/config/realtime-hint").toLowerCase()){if("+input"===t.origin){if("text/vnd.tiddlywiki"===e.doc.modeOption){if(/[;,]$/.test(t.text[0]))return}else if(/[;,{}()[\]]$/.test(t.text[0]))return;if(""===t.text[0].trim()){if(!t.text[1])return;if(""===t.text[1].trim())return}}if("+delete"===t.origin){if(""===t.removed[0])return;if(t.to.ch<2)return;if(""===e.getDoc().getLine(t.to.line).substr(0,t.to.ch-1).trim())return}e.showHint(i)}})}),c.registerHelper("hint","tiddlywiki5",function(n){for(var e=n.getCursor(),t=n.getLine(e.line),i=e.ch,r=e.ch,o=[".","]","}",">"],d=["[","{","|",'"'];i;){var l=t.charAt(i-1);if(30<r-i||o.includes(l))return null;if(d.includes(l))break;i--}if(0==i)return null;var s=i!==r&&t.slice(i,r),f={from:c.Pos(e.line,i),to:c.Pos(e.line,r)};return f.list="$"==t.charAt(i)?$tw.wiki.filterTiddlers(`[all[tiddlers]search:title:literal[${s}]!prefix[$:/state]]`):$tw.wiki.filterTiddlers(`[all[tiddlers]!is[system]!is[shadow]search:title:literal[${s}]!prefix[$:/state]]`),"true"===$tw.wiki.getTiddlerText("$:/plugins/Gk0Wk/codemirror-mode-tiddlywiki5/config/hint-preview").toLowerCase()&&c.on(f,"select",function(e,t){var i=t.parentNode.id+"-hint-append",r=t.ownerDocument.getElementById(i),o=!r;o&&((r=t.ownerDocument.createElement("div")).id=i,r.className="CodeMirror-hints CodeMirror-hints-append "+n.options.theme,r.style.left=t.parentNode.offsetLeft+t.parentNode.offsetWidth+"px",r.style.top=t.parentNode.offsetTop+"px"),r.innerHTML=$tw.wiki.renderTiddler("text/html",e),o&&(c.on(f,"close",function(){t.ownerDocument.body.removeChild(r)}),t.ownerDocument.body.appendChild(r))}),f})});