import type { Stack } from 'golden-layout';

let registeredListener = false;

export const addNewTiddlerIcon = (stack: Stack, chinese = false) => {
  const button = $tw.utils.domMaker('div', {
    class: 'lm_add',
    attributes: {
      title: chinese ? '添加' : 'add',
    },
  });
  // 插入到开头
  stack.header.controlsContainerElement.insertBefore(
    button,
    stack.header.controlsContainerElement.firstChild,
  );
  button.addEventListener('click', event => {
    $tw.wiki.addTiddler({
      title: '$:/temp/Gk0Wk/layout/new-tiddler-info',
      text: '',
      'layout:title': '',
      'layout:field': 'text',
      'layout:template': '$:/core/ui/ViewTemplate/body',
      'layout:className': 'gk0wk-gl-tiddler-container',
    });
    ($tw as any).modal.display('$:/plugins/Gk0Wk/layouts/modals/add-tiddler', {
      event,
    });
  });

  if (registeredListener) {
    return;
  }
  registeredListener = true;
  $tw.rootWidget.addEventListener('gk0wk-layout-add-tiddler', () => {
    try {
      const tiddler = $tw.wiki.getTiddler(
        '$:/temp/Gk0Wk/layout/new-tiddler-info',
      )!.fields;
      const title = tiddler['layout:title'] as string;
      const className = tiddler['layout:className'] as string;
      const field = tiddler['layout:field'] as string;
      const template = tiddler['layout:template'] as string;
      if (!title) {
        return;
      }
      stack.addComponent('tiddler', {
        title,
        field,
        template,
        className,
      });
    } catch (e) {
      console.error(e);
    }
  });
};
