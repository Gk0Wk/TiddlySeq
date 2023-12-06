import { EditingSidebarRight } from './editingSidebar';
import type { SectionEditorWidget } from './widget';

let buttonContent: string | undefined;

export const EditButton = (widget: SectionEditorWidget, sectionId: string) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/edit-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'edit',
    },
    innerHTML: buttonContent,
  });
  button.addEventListener('click', () => {
    if (widget.editingSection) {
      return;
    }
    const section = widget.getSection(sectionId);
    if (!section) {
      return;
    }
    const { start, end, tiddler, container } = section;
    widget.editingSection = section;
    container.style.display = 'none';
    const text = $tw.wiki.getTiddlerText(tiddler)!.substring(start, end);
    const editTitle = `$:/temp/Gk0Wk/section-editor/edit/${sectionId}`;
    $tw.wiki.addTiddler({
      title: editTitle,
      text,
    });
    const editorWidget = $tw.wiki.makeTranscludeWidget(
      '$:/core/ui/EditTemplate/body',
      {
        document,
        parentWidget: widget,
        field: 'text',
        importPageMacros: true,
        variables: {
          currentTiddler: editTitle,
        },
      },
    );
    editorWidget.render(container.parentElement!, container);
    const t = container.previousSibling as HTMLElement;
    t.style.position = 'relative';
    t.insertBefore(EditingSidebarRight(widget, section), t.firstChild);
    t.insertBefore(
      $tw.utils.domMaker('div', {
        class: 'gk0wk-section-editor-section-editing-background',
      }),
      t.firstChild,
    );
    section.editor = t;
    section.editingTiddler = editTitle;
  });
  return button;
};
