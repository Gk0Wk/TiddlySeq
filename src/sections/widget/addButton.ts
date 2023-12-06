import { EditingSidebarRight } from './editingSidebar';
import { SectionEditorWidget, ISection } from './widget';

let buttonContent: string | undefined;
// eslint-disable-next-line no-nested-ternary
const functionKey = $tw.browser
  ? /macintosh|mac os x/i.test(navigator.userAgent)
    ? 'metaKey'
    : 'ctrlKey'
  : 'ctrlKey';

export const AddButton = (widget: SectionEditorWidget, sectionId: string) => {
  buttonContent ??= $tw.wiki.renderText(
    'text/html',
    'text/vnd.tiddlywiki',
    '<$transclude $tiddler="$:/core/images/new-button" size="14px"/>',
    {
      parentWidget: widget,
      parseAsInline: true,
    },
  );
  const button = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-button',
    style: {},
    attributes: {
      action: 'add',
    },
    innerHTML: buttonContent,
  });
  button.addEventListener('click', event => {
    if (widget.editingSection) {
      return;
    }
    const section = widget.getSection(sectionId);
    if (!section) {
      return;
    }
    const above = event[functionKey];
    const { start, end, tiddler, container } = section;
    widget.editingSection = section;
    const editTitle = `$:/temp/Gk0Wk/section-editor/edit/${tiddler}-${Date.now()}-${
      above ? start : end
    }-${above ? start : end}-new`;
    $tw.wiki.addTiddler({
      title: editTitle,
      text: '',
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
    editorWidget.render(
      container.parentElement!,
      above ? container : (container.nextSibling as HTMLElement),
    );
    const t = (
      above ? container.previousSibling : container.nextSibling
    ) as HTMLElement;
    t.style.position = 'relative';
    const newSection: ISection = {
      tiddler,
      start: above ? start : end,
      end: above ? start : end,
      container,
      editingTiddler: editTitle,
      editor: t,
    };
    t.insertBefore(EditingSidebarRight(widget, newSection), t.firstChild);
    t.insertBefore(
      $tw.utils.domMaker('div', {
        class: 'gk0wk-section-editor-section-editing-background',
      }),
      t.firstChild,
    );
    widget.editingSection = newSection;
  });
  return button;
};
