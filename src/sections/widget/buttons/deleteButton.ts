import type { SectionEditorWidget } from '../widget';

let buttonContent: string | undefined;

export const DeleteButton = (
  widget: SectionEditorWidget,
  sectionId: string,
) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/delete-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'delete',
    },
    innerHTML: buttonContent,
  });
  button.addEventListener('click', () => {
    if (widget.editingSection) {
      return;
    }
    // 弹出确认框
    // eslint-disable-next-line no-alert
    if (confirm('确定删除？')) {
      const section = widget.getSection(sectionId);
      if (!section) {
        return;
      }
      const { start, end, tiddler } = section;
      const { fields } = $tw.wiki.getTiddler(tiddler)!;
      const { text } = fields;
      const newText = `${text.substring(0, start).trim()}\n\n${text
        .substring(end)
        .trim()}`;
      $tw.wiki.addTiddler(new $tw.Tiddler(fields, { text: newText }));
    }
  });
  return button;
};
