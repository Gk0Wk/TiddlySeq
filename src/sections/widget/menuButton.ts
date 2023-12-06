import { SectionEditorWidget } from './widget';

let buttonContent: string | undefined;

export const MenuButton = (widget: SectionEditorWidget, _sectionId: string) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/menu-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'menu',
    },
    innerHTML: buttonContent,
  });
  return button;
};
