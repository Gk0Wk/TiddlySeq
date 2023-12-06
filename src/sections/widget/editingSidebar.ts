import { CancelButton } from './cancelButton';
import { SaveButton } from './saveButton';
import { SectionEditorWidget, ISection } from './widget';

export const EditingSidebarRight = (
  widget: SectionEditorWidget,
  section: ISection,
) => {
  const container = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-editing-sidebar',
    attributes: {
      side: 'right',
    },
  });
  container.appendChild(SaveButton(widget, section));
  container.appendChild(CancelButton(widget, section));
  return container;
};
