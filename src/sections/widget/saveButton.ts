import { SectionEditorWidget, ISection } from './widget';

let buttonContent: string | undefined;

export const SaveButton = (widget: SectionEditorWidget, section: ISection) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/done-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'save',
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
    const text = $tw.wiki.getTiddlerText(section.editingTiddler!)!;
    const tiddler = $tw.wiki.getTiddler(section.tiddler)!.fields;
    const newText = `${tiddler.text
      .substring(0, section.start)
      .trimEnd()}\n\n${text.trim()}\n\n${tiddler.text
      .substring(section.end)
      .trimStart()}`.trim();
    $tw.wiki.addTiddler(new $tw.Tiddler(tiddler, { text: newText }));
    $tw.wiki.deleteTiddler(section.editingTiddler!);
    delete widget.editingSection;
  });
  return button;
};
