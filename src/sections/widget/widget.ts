import type {
  IParseTreeNode,
  IWidgetInitialiseOptions,
  IChangedTiddlers,
} from 'tiddlywiki';
import { split } from './split';
import { SectionBackground } from './sectionBackground';
import { PreviewSidebarLeft, PreviewSidebarRight } from './previewSidebar';

import { widget as Widget } from '$:/core/modules/widgets/widget.js';

export interface ISection {
  tiddler: string;
  start: number;
  end: number;
  container: HTMLElement;
  editor?: HTMLElement;
  editingTiddler?: string;
}

export class SectionEditorWidget extends Widget {
  public editingSection?: ISection;

  private tiddler: string = '';

  private widgets: Widget[] = [];

  private sections: Map<string, ISection> = new Map();

  initialise(parseTreeNode: IParseTreeNode, options: IWidgetInitialiseOptions) {
    super.initialise(parseTreeNode, options);
    this.computeAttributes();
  }

  execute() {
    this.makeChildWidgets();
    this.tiddler = this.getAttribute('tiddler', '');
  }

  render(parent: Node, nextSibling: Node | null) {
    this.execute();
    if (!parent || !this.tiddler) {
      return;
    }
    this.widgets.length = 0;
    $tw.utils.each(this.domNodes, e => e.remove());
    this.domNodes.length = 0;
    this.sections.clear();
    if (!$tw.browser) {
      const container = $tw.utils.domMaker('div', {});
      const t = $tw.wiki.makeTranscludeWidget(this.tiddler, {
        document,
        parentWidget: this,
        recursionMarker: 'yes',
        field: 'text',
        importPageMacros: true,
        variables: {
          currentTiddler: this.tiddler,
        },
      });
      t.render(container, null);
      // 让 container 中的所有子节点插入到 parent 中
      // eslint-disable-next-line @typescript-eslint/prefer-for-of
      for (let i = 0; i < container.children.length; i++) {
        this.domNodes.push(container.children[i]);
        parent.insertBefore(container.children[i], nextSibling);
      }
      return;
    }
    this.parentDomNode = parent as HTMLElement;
    const [, blocks, parser, tree] = split(this.tiddler);
    const treeBackup = [...tree];
    const time = Date.now();
    for (const [start, end, subtrees] of blocks) {
      const sectionId = `${this.tiddler}-${time}-${start}-${end}`;
      tree.length = 0;
      tree.push(...subtrees);
      const container = $tw.utils.domMaker('div', {
        class: 'gk0wk-section-preview',
        attributes: {
          start,
          end,
          tiddler: this.tiddler,
        },
      });
      this.sections.set(sectionId, {
        tiddler: this.tiddler,
        start,
        end,
        container,
      });
      const widget = $tw.wiki.makeWidget(parser, {
        parentWidget: this,
        document,
        variables: {
          currentTiddler: this.tiddler,
        },
      });
      widget.render(container, null);

      // 按钮和其他内容
      container.insertBefore(
        PreviewSidebarLeft(this, sectionId),
        container.firstChild,
      );
      container.insertBefore(
        PreviewSidebarRight(this, sectionId),
        container.firstChild,
      );
      container.insertBefore(SectionBackground(), container.firstChild);

      this.widgets.push(widget);
      this.domNodes.push(container);
      parent.insertBefore(container, nextSibling);

      container.setAttribute(
        'collapsed',
        container.clientHeight <= 30 ? 'yes' : 'no',
      );
    }
    tree.length = 0;
    tree.push(...treeBackup);
  }

  refresh(changedTiddlers: IChangedTiddlers) {
    const changedAttributes = this.computeAttributes();
    if (
      changedAttributes.tiddler ||
      changedAttributes.config ||
      changedTiddlers[this.tiddler]
    ) {
      const nextSibling = this.findNextSiblingDomNode();
      this.render(this.parentDomNode, nextSibling);
      return true;
    }
    let result = false;
    for (const child of this.widgets) {
      result = child.refresh(changedTiddlers) || result;
    }
    return result || this.refreshChildren();
  }

  getSection(sectionId: string) {
    return this.sections.get(sectionId);
  }
}
