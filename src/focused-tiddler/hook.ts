import type { IChangedTiddlersMeta } from 'tiddlywiki';

let topOffset = 71;
const updateTopOffset = () => {
  topOffset = Number(
    $tw.wiki
      .getTiddlerText('$:/plugins/Gk0Wk/focused-tiddler/top-offset', '71')
      .trim(),
  );
  if (!Number.isSafeInteger(topOffset)) {
    topOffset = 71;
  }
};
const check = () => {
  const tiddlers = document.querySelectorAll(
    '.tc-story-river > .tc-tiddler-frame',
  );
  if (tiddlers.length === 0) {
    update(null);
    return;
  }
  for (let i = tiddlers.length - 1; i >= 0; i--) {
    if (tiddlers[i].getBoundingClientRect().top > 100) {
      continue;
    }
    update(tiddlers[i]);
    return;
  }
  update(tiddlers[0]);
};
let previousFocusedDom: Element | null = null;
const update = (dom: Element | null) => {
  if (dom === previousFocusedDom) {
    return;
  }
  const title =
    dom === null
      ? undefined
      : (dom.getAttribute('data-tiddler-title') ??
          dom.querySelector('.tc-tiddler-title .tc-titlebar .tc-title')
            ?.textContent) ||
        undefined;
  $tw.wiki.addTiddler({ title: '$:/temp/focussedTiddler', text: title || '' });
  if (previousFocusedDom) {
    ($tw.utils as any).removeClass(previousFocusedDom, 'gk0wk-focused-tiddler');
  }
  if (dom) {
    ($tw.utils as any).addClass(dom, 'gk0wk-focused-tiddler');
  }
  previousFocusedDom = dom;
};

export const name = 'gk0wk-focused-tiddler';
export const platforms = ['browser'];
export const after = ['story'];
export const synchronous = true;
export const startup = () => {
  updateTopOffset();
  let timer: NodeJS.Timeout | undefined;
  window.addEventListener('scroll', () => {
    if (timer !== undefined) {
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      check();
    }, 250);
  });
  window.addEventListener('click', ({ target }) => {
    if (!document.querySelector('.tc-story-river')?.contains?.(target as any)) {
      return;
    }
    const tiddlers = document.querySelectorAll(
      '.tc-story-river > .tc-tiddler-frame',
    );
    for (let i = tiddlers.length - 1; i >= 0; i--) {
      if (tiddlers[i].contains(target as any)) {
        update(tiddlers[i]);
        return;
      }
    }
  });
  ($tw.wiki as any).addEventListener(
    'change',
    (tiddlers: Record<string, IChangedTiddlersMeta>) => {
      if (tiddlers['$:/plugins/Gk0Wk/focused-tiddler/top-offset']) {
        updateTopOffset();
      }
      if (tiddlers['$:/HistoryList'] || tiddlers['$:/StoryList']) {
        setTimeout(
          () => check(),
          (($tw.utils as any).getAnimationDuration() as number) + 100,
        );
      }
    },
  );
};
