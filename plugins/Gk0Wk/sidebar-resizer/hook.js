(function() {
    "use strict";
    if (typeof window !== 'undefined' && window.document) {
        var sidebarResizerNode = null;
        var canResize = false;
        $tw.hooks.addHook('th-page-refreshed', function() {
            if (sidebarResizerNode && sidebarResizerNode.ownerDocument.contains(sidebarResizerNode)) return;
            var body = document.querySelector('body');
            if (!body) return;
            sidebarResizerNode = document.querySelector('#gk0wk-sidebar-resize-area');
            if (!sidebarResizerNode) return;
            canResize = false;

            function hideSideBar() {
                $tw.wiki.setText('$:/state/sidebar', null, null, 'no');
                canResize = false;
            }

            function drag(event) {
                if (!canResize) return;
                var widthPercent = 100 - (event.clientX / window.innerWidth) * 100;
                if (widthPercent > 80) return;
                if ((window.innerWidth - event.clientX) < 100) {
                    $tw.wiki.setText('$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth', null, null, (30000 / window.innerWidth) + 'vw');
                    hideSideBar();
                    return;
                }
                $tw.wiki.setText('$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth', null, null, widthPercent + 'vw');
                event.preventDefault();
                event.stopPropagation();
            }
            body.addEventListener('dblclick', hideSideBar);
            if (window.PointerEvent) {
                function dragBegin(event) {
                    canResize = true;
                    body.setPointerCapture(event.pointerId);
                }

                function dragEnd(event) {
                    canResize = false;
                    body.releasePointerCapture(event.pointerId);
                }
                sidebarResizerNode.addEventListener('pointerdown', dragBegin);
                body.addEventListener('pointerup', dragEnd);
                body.addEventListener('blur', dragEnd);
                body.addEventListener('pointermove', drag, true);
            } else {
                function dragBegin() {
                    canResize = true;
                }

                function dragEnd() {
                    canResize = false;
                }
                sidebarResizerNode.addEventListener('mousedown', dragBegin);
                body.addEventListener('mouseup', dragEnd);
                body.addEventListener('blur', dragEnd);
                body.addEventListener('mousemove', drag, true);
                sidebarResizerNode.addEventListener('touchstart', dragBegin);
                body.addEventListener('touchcancel', dragEnd);
                body.addEventListener('touchend', dragEnd);
                body.addEventListener('touchmove', drag, true);
            }
        });
    }
})();
