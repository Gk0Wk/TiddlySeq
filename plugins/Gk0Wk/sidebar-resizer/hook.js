(function () {
  "use strict";
  if (typeof window !== "undefined" && window.document) {
    var sidebarResizerNode = null;
    var canResize = false;
    var body = document.querySelector("body");
    if (!body) return;

    function dragBegin(event) {
      canResize = true;
      if (window.PointerEvent) body.setPointerCapture(event.pointerId);
      // When drag begins, prevent text selecting (for event.preventDefault cannot work in Mozilla)
      body.style.useSelect = "none";
      body.style.MozUserSelect = "none";
    }

    function dragEnd(event) {
      if (canResize) {
        canResize = false;
        if (window.PointerEvent) body.releasePointerCapture(event.pointerId);
        body.style.useSelect = "auto";
        body.style.MozUserSelect = "auto";
      }
    }

    $tw.hooks.addHook("th-page-refreshed", function () {
      if (
        sidebarResizerNode &&
        sidebarResizerNode.ownerDocument.contains(sidebarResizerNode)
      )
        return;
      sidebarResizerNode = document.querySelector("#gk0wk-sidebar-resize-area");
      if (!sidebarResizerNode) return;
      canResize = false;

      // Hide Sidebar
      function hideSideBar(event) {
        $tw.wiki.setText("$:/state/sidebar", null, null, "no");
        dragEnd(event);
      }

      // Drag to resize
      function drag(event) {
        if (!canResize) return;
        if (!event) event = window.event;
        // Prevent event pass
        event.preventDefault(event);
        event.stopPropagation(event);
        event.stopImmediatePropagation(event);
        event.returnValue = false;
        var widthPercent = 100 - (event.clientX / window.innerWidth) * 100;
        if (widthPercent > 80) return false;
        if (window.innerWidth - event.clientX < 100) {
          $tw.wiki.setText(
            "$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth",
            null,
            null,
            30000 / window.innerWidth + "vw"
          );
          hideSideBar(event);
        } else {
          $tw.wiki.setText(
            "$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth",
            null,
            null,
            widthPercent + "vw"
          );
        }
        return false;
      }

      // Double click to hide sidebar
      sidebarResizerNode.addEventListener("dblclick", hideSideBar);
      // Detect whter PointerEvent is supported
      if (window.PointerEvent) {
        // PointerEvent = Mouse + Touch
        sidebarResizerNode.addEventListener("pointerdown", dragBegin);
        body.addEventListener("pointerup", dragEnd);
        body.addEventListener("blur", dragEnd);
        body.addEventListener("pointermove", drag, true);
      } else {
        // If not
        sidebarResizerNode.addEventListener("mousedown", dragBegin);
        body.addEventListener("mouseup", dragEnd);
        body.addEventListener("blur", dragEnd);
        body.addEventListener("mousemove", drag, true);
        sidebarResizerNode.addEventListener("touchstart", dragBegin);
        body.addEventListener("touchcancel", dragEnd);
        body.addEventListener("touchend", dragEnd);
        body.addEventListener("touchmove", drag, true);
      }
    });
  }
})();
