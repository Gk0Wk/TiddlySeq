import { ComponentContainer } from 'golden-layout';
import type { Widget, IChangedTiddlers } from 'tiddlywiki';

const containerMap = new Map<ComponentContainer, Widget>();
const titleWidgetMap = new Map<string, Set<Widget>>();
const titleContainerMap = new Map<string, Set<ComponentContainer>>();

export const removeWidget = (container: ComponentContainer) => {
  if (container.componentType === 'tiddler') {
    const title = (container.initialState as any).title as string;
    const widget = containerMap.get(container);
    containerMap.delete(container);
    if (widget) {
      const widgetSet = titleWidgetMap.get(title);
      if (widgetSet) {
        widgetSet.delete(widget);
        if (widgetSet.size < 1) {
          titleWidgetMap.delete(title);
        }
      }
    }
    const containerSet = titleContainerMap.get(title);
    if (containerSet) {
      containerSet.delete(container);
      if (containerSet.size < 1) {
        titleContainerMap.delete(title);
      }
    }
  }
};

export const addWidget = (container: ComponentContainer, widget: Widget) => {
  startListenChange();
  const title = (container.initialState as any).title as string;
  let widgetSet = titleWidgetMap.get(title);
  if (!widgetSet) {
    widgetSet = new Set();
    titleWidgetMap.set(title, widgetSet);
  }
  widgetSet.add(widget);
  let containerSet = titleContainerMap.get(title);
  if (!containerSet) {
    containerSet = new Set();
    titleContainerMap.set(title, containerSet);
  }
  containerSet.add(container);
  containerMap.set(container, widget);
};

let inited = false;

export const renderCaption = (title: string, captionOverride?: string) => {
  if (captionOverride) {
    return captionOverride;
  }
  let caption = title;
  if ($tw.wiki.getTiddler(title)?.fields?.caption) {
    const t1 = $tw.wiki.makeTranscludeWidget(title, {
      document: $tw.fakeDocument,
      mode: 'inline',
      field: 'caption',
    });
    const t2 = $tw.fakeDocument.createElement('div');
    t1.render(t2, null);
    caption = t2.textContent ?? title;
  }
  return caption;
};

export const startListenChange = () => {
  if (inited) {
    return;
  }
  inited = true;
  // 节流 100ms, 第一次立即执行
  const throttle = 50;
  let timer: NodeJS.Timeout | undefined;
  let tmpChangedTiddlers: IChangedTiddlers | undefined;
  const refresh = (changed: IChangedTiddlers) => {
    for (const title in changed) {
      const widgetSet = titleWidgetMap.get(title);
      if (widgetSet) {
        for (const widget of widgetSet) {
          widget.refresh(changed);
        }
      }
      const containerSet = titleContainerMap.get(title);
      if (containerSet) {
        for (const container of containerSet) {
          container.setTitle(
            renderCaption(title, (container.initialState as any)?.caption),
          );
        }
      }
    }
  };

  $tw.wiki.addEventListener('change', changedTiddlers => {
    if (timer !== undefined) {
      // 说明已经有一个正在节流的定时器了，那么就把这次的变更合并进去
      if (tmpChangedTiddlers !== undefined) {
        tmpChangedTiddlers = {
          ...tmpChangedTiddlers,
          ...changedTiddlers,
        };
      } else {
        tmpChangedTiddlers = changedTiddlers;
      }
      return;
    }
    // 先做一次
    refresh(changedTiddlers);
    // 然后节流
    let count = 5;
    timer = setInterval(() => {
      if (count-- <= 0 && tmpChangedTiddlers === undefined) {
        clearInterval(timer);
        timer = undefined;
      }
      if (tmpChangedTiddlers !== undefined) {
        refresh(tmpChangedTiddlers);
        tmpChangedTiddlers = undefined;
        count = Math.min(5, count + 2);
      }
    }, throttle);
  });
};
