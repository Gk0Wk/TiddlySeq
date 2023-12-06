import { SectionEditorWidget, ISection } from './widget';

let buttonContent: string | undefined;

export const CancelButton = (
  widget: SectionEditorWidget,
  section: ISection,
) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/close-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'cancel',
    },
    innerHTML: buttonContent,
  });
  button.addEventListener('click', () => {
    if (widget.editingSection !== section) {
      return;
    }
    section.editor?.remove();
    delete section.editor;
    section.container.style.display = '';
    $tw.wiki.deleteTiddler(section.editingTiddler!);
    delete widget.editingSection;
  });
  return button;
};
