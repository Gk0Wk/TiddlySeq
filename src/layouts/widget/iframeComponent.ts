import type { Widget } from 'tiddlywiki';
import type { GoldenLayout } from 'golden-layout';

export const iframeComponentFactoryFunction: (
  widget: Widget,
) => GoldenLayout.ComponentFactoryFunction =
  _widget => (container, componentState) => {
    const iframe = $tw.utils.domMaker('iframe', {
      attributes: {
        src: (componentState as any).source,
      },
      style: {
        width: '100%',
        height: '100%',
        border: 'none',
      },
    });
    container.element.innerHTML = '';
    container.element.className = (componentState as any).className
      ? `lm_content ${(componentState as any).className}`
      : 'lm_content';
    container.element.appendChild(iframe);
    // 当 iframe 加载就绪，设置标题
    iframe.addEventListener('load', () => {
      if (iframe.contentDocument) {
        container.setTitle(iframe.contentDocument.title);
      }
    });
    if ((componentState as any).caption) {
      container.setTitle((componentState as any).caption);
    } else if ((globalThis as any).URL) {
      const url = new (globalThis as any).URL((componentState as any).source);
      console.log(url);
      container.setTitle(url.pathname.split('/').pop() || url.hostname);
    } else {
      container.setTitle('Web Page');
    }
  };
