if ($tw.browser) {
  let canResize = false;
  let sidebarResizerNode: HTMLElement | null = null;
  const { body } = document;

  const dragBegin = (event: PointerEvent | TouchEvent | MouseEvent) => {
    canResize = true;
    if (event instanceof PointerEvent) {
      body.setPointerCapture(event.pointerId);
    }
    // When drag begins, prevent text selecting (for event.preventDefault cannot work in Mozilla)
    body.style.userSelect = 'none';
    (body.style as any).MozUserSelect = 'none';
  };

  const dragEnd = (
    event: PointerEvent | TouchEvent | MouseEvent | FocusEvent,
  ) => {
    if (canResize) {
      canResize = false;
      if (event instanceof PointerEvent) {
        body.releasePointerCapture(event.pointerId);
      }
      body.style.userSelect = 'auto';
      (body.style as any).MozUserSelect = 'auto';
    }
  };

  $tw.hooks.addHook('th-page-refreshed', () => {
    if (sidebarResizerNode?.ownerDocument.contains(sidebarResizerNode)) {
      return;
    }
    sidebarResizerNode = document.querySelector('#gk0wk-sidebar-resize-area');
    if (!sidebarResizerNode) {
      return;
    }
    canResize = false;

    // Hide Sidebar
    function hideSideBar(event: PointerEvent | MouseEvent | TouchEvent) {
      $tw.wiki.setText('$:/state/sidebar', undefined, undefined, 'no');
      dragEnd(event);
    }

    // Drag to resize
    const drag = (
      event: PointerEvent | MouseEvent | TouchEvent = window.event as any,
    ): boolean | void => {
      if (!canResize || !event) {
        return undefined;
      }
      // Prevent event pass
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      event.returnValue = false;
      // throttle
      requestAnimationFrame(() => {
        const widthPercent =
          100 - ((event as any).clientX / window.innerWidth) * 100;
        if (widthPercent > 80) {
          return false;
        }
        if (window.innerWidth - (event as any).clientX < 100) {
          $tw.wiki.setText(
            '$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth',
            undefined,
            undefined,
            `${30000 / window.innerWidth}vw`,
          );
          hideSideBar(event);
        } else {
          $tw.wiki.setText(
            '$:/themes/tiddlywiki/vanilla/metrics/sidebarwidth',
            undefined,
            undefined,
            `${widthPercent}vw`,
          );
        }
        return undefined;
      });
      return false;
    };

    // Double click to hide sidebar
    sidebarResizerNode.addEventListener('dblclick', hideSideBar);
    // Detect whter PointerEvent is supported
    if (window.PointerEvent) {
      // PointerEvent = Mouse + Touch
      sidebarResizerNode.addEventListener('pointerdown', dragBegin);
      body.addEventListener('pointerup', dragEnd);
      body.addEventListener('blur', dragEnd);
      body.addEventListener('pointermove', drag, true);
    } else {
      // If not
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
