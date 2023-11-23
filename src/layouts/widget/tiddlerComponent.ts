import type { Widget } from 'tiddlywiki';
import type { GoldenLayout, Stack } from 'golden-layout';
import { addWidget, renderCaption } from './tiddlerRefresh';

export const tiddlerComponentFactoryFunction: (
  widget: Widget,
) => GoldenLayout.ComponentFactoryFunction =
  widget => (container, componentState) => {
    const title = (componentState as any).title as string;
    container.element.innerHTML = '';
    container.element.className = (componentState as any).className
      ? `lm_content ${(componentState as any).className}`
      : 'lm_content';
    container.setTitle(renderCaption(title, (componentState as any).caption));
    const t = $tw.wiki.makeTranscludeWidget(
      (componentState as any).template ?? title,
      {
        document,
        parentWidget: widget,
        recursionMarker: 'yes',
        field: (componentState as any).field,
        importPageMacros: true,
        variables: {
          currentTiddler: title,
        },
      },
    );

    // 捕获跳转
    t.addEventListener('tm-navigate', ({ navigateTo }) => {
      if (container.parent.parentItem.isStack) {
        const stack = container.parent.parentItem as Stack;
        stack.addComponent('tiddler', {
          ...(componentState as any),
          field: 'text',
          title: navigateTo,
        });
      }
    });

    container.element.addEventListener('click', event => {
      if (event.target instanceof HTMLAnchorElement) {
        event.preventDefault();
        if (container.parent.parentItem.isStack) {
          const stack = container.parent.parentItem as Stack;
          stack.addComponent('iframe', {
            source: event.target.href,
          });
        }
      }
    });

    // 渲染
    t.render(container.element, null);
    addWidget(container, t);
  };
