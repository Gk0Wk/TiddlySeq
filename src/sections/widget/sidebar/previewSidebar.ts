import { AddButton } from '../buttons/addButton';
import { DeleteButton } from '../buttons/deleteButton';
import { EditButton } from '../buttons/editButton';
import { MenuButton } from '../buttons/menuButton';
import { SectionEditorWidget } from '../widget';

export const PreviewSidebarLeft = (
  widget: SectionEditorWidget,
  sectionId: string,
) => {
  const container = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-preview-sidebar',
    attributes: {
      side: 'left',
    },
  });
  container.appendChild(MenuButton(widget, sectionId));
  container.appendChild(AddButton(widget, sectionId));
  return container;
};

export const PreviewSidebarRight = (
  widget: SectionEditorWidget,
  sectionId: string,
) => {
  const container = $tw.utils.domMaker('div', {
    class: 'gk0wk-section-editor-preview-sidebar',
    attributes: {
      side: 'right',
    },
  });
  container.appendChild(EditButton(widget, sectionId));
  container.appendChild(DeleteButton(widget, sectionId));
  return container;
};
