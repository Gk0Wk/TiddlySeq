import {
  HTMLTags,
  IParseTreeNode,
  IChangedTiddlers,
  IWidgetInitialiseOptions,
  IWikiASTNode,
} from 'tiddlywiki';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';

type HeaderTag = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

class PageTOCWidget extends Widget {
  private tocNodeTag: HTMLTags = 'div';

  private tocHeaderNodeTag: HTMLTags = 'p';

  private tocNodeClass: string = 'gk0wk-tiddlertoc-container';

  private tocHeaderNodeClassPrefix: string = 'gk0wk-tiddlertoc-';

  private tocTitle: string = '';

  private emptyMessage: string = '';

  private scrollMode: 'start' | 'center' | 'end' | 'nearest' = 'center';

  private includeHeaderMap: Record<HeaderTag, boolean> = {
    h1: true,
    h2: true,
    h3: true,
    h4: true,
    h5: true,
    h6: true,
  };

  initialise(parseTreeNode: IParseTreeNode, options: IWidgetInitialiseOptions) {
    super.initialise(parseTreeNode, options);
    this.computeAttributes();
  }

  execute() {
    this.tocTitle = this.getAttribute(
      'tiddler',
      this.getVariable('currentTiddler'),
    );
    this.tocNodeTag = this.getAttribute('tag', 'div') as any;
    if (($tw.config.htmlUnsafeElements as any).includes(this.tocNodeTag)) {
      this.tocNodeTag = 'div';
    }
    this.tocHeaderNodeTag = this.getAttribute('headerTag', 'p') as any;
    if (
      ($tw.config.htmlUnsafeElements as any).includes(this.tocHeaderNodeTag)
    ) {
      this.tocHeaderNodeTag = 'p';
    }
    this.tocNodeClass = this.getAttribute(
      'class',
      'gk0wk-tiddlertoc-container',
    );
    this.tocHeaderNodeClassPrefix = this.getAttribute(
      'headerClassPrefix',
      'gk0wk-tiddlertoc-',
    );
    this.emptyMessage = this.getAttribute('emptyMessage', '');
    this.includeHeaderMap.h1 = this.getAttribute('h1', 'yes') === 'yes';
    this.includeHeaderMap.h2 = this.getAttribute('h2', 'yes') === 'yes';
    this.includeHeaderMap.h3 = this.getAttribute('h3', 'yes') === 'yes';
    this.includeHeaderMap.h4 = this.getAttribute('h4', 'yes') === 'yes';
    this.includeHeaderMap.h5 = this.getAttribute('h5', 'yes') === 'yes';
    this.includeHeaderMap.h6 = this.getAttribute('h6', 'yes') === 'yes';
    this.scrollMode = this.getAttribute('scrollMode', 'center') as any;
    if (!['start', 'center', 'end', 'nearest'].includes(this.scrollMode)) {
      this.scrollMode = 'center';
    }
  }

  render(parent: Node, nextSibling: Node | null) {
    this.parentDomNode = parent as any;
    this.execute();

    // 递归检测
    if (this.parentWidget!.hasVariable('page-toc-recursion-detection', 'yes')) {
      this.domNodes.push(
        parent.appendChild(this.document.createTextNode('[Page TOC]') as any),
      );
      return;
    }
    this.setVariable('page-toc-recursion-detection', 'yes');

    // 渲染目录
    const tocNode = $tw.utils.domMaker(this.tocNodeTag, {
      class: this.tocNodeClass,
    });
    this.domNodes.push(tocNode);

    try {
      const toc = this.getTOCInfo();
      if (!toc || toc.headers.length === 0) {
        tocNode.insertBefore(
          $tw.utils.domMaker(this.tocHeaderNodeTag, {
            class: `${this.tocHeaderNodeClassPrefix}empty`,
            text: this.emptyMessage,
          }),
          nextSibling,
        );
      } else {
        for (let i = 0, len = toc.headers.length; i < len; i++) {
          const { tag, text, count } = toc.headers[i];
          const headerNode = $tw.utils.domMaker(this.tocHeaderNodeTag, {
            class: `${this.tocHeaderNodeClassPrefix}${tag}`,
            text,
          });
          if ($tw.browser) {
            // eslint-disable-next-line @typescript-eslint/no-loop-func
            headerNode.addEventListener('click', () => {
              const target = document
                .querySelector(
                  `.tc-tiddler-frame[data-tiddler-title="${toc.title.replace(
                    '"',
                    '\\"',
                  )}"]`,
                )
                ?.querySelectorAll?.(`.tc-tiddler-body > ${tag}`)?.[count];
              if (!target) {
                return;
              }
              switch (this.scrollMode) {
                case 'center':
                case 'nearest': {
                  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
                  target.scrollIntoView({
                    behavior: 'smooth',
                    block: this.scrollMode,
                  });
                  break;
                }
                default: {
                  target.scrollIntoView({
                    behavior: 'auto',
                    block: this.scrollMode,
                  });
                  if (this.scrollMode === 'end') {
                    document.body.scrollTop += 100;
                    if (document.scrollingElement) {
                      document.scrollingElement.scrollTop += 100;
                    }
                  } else {
                    document.body.scrollTop -= 100;
                    if (document.scrollingElement) {
                      document.scrollingElement.scrollTop -= 100;
                    }
                  }
                }
              }
            });
          }
          tocNode.appendChild(headerNode);
        }
      }
    } catch (e) {
      console.error(e);
      tocNode.textContent = String(e);
    }
    parent.insertBefore(tocNode, nextSibling);
  }

  refresh(changedTiddlers: IChangedTiddlers) {
    const changedAttributes = this.computeAttributes();
    if (
      $tw.utils.count(changedAttributes) > 0 ||
      Object.hasOwnProperty.call(changedAttributes, this.tocTitle)
    ) {
      this.refreshSelf();
      this.refreshChildren(changedTiddlers);
      return true;
    }
    return this.refreshChildren(changedTiddlers);
  }

  getTOCInfo() {
    // Check empty
    if (this.tocTitle === '') {
      return undefined;
    }
    const currentTiddler = $tw.wiki.getTiddler(this.tocTitle);
    if (!currentTiddler) {
      return undefined;
    }
    const type = currentTiddler.fields.type || 'text/vnd.tiddlywiki';
    if (type !== 'text/vnd.tiddlywiki' && type !== 'text/x-markdown') {
      return undefined;
    }
    const headers: { tag: HeaderTag; count: number; text: string }[] = [];
    const headersCount: Record<HeaderTag, number> = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
    };
    const root = $tw.wiki.parseTiddler(this.tocTitle).tree;
    if (root.length === 0) {
      return undefined;
    }
    let contents = root;
    // Parse params
    while (['set', 'importvariables'].includes(contents[0]?.type)) {
      contents = (contents[0] as IWikiASTNode).children ?? [];
    }
    $tw.utils.each([...contents], node => {
      if (node.type !== 'element') {
        return;
      }
      if (this.includeHeaderMap[(node as any).tag as HeaderTag] !== true) {
        return;
      }
      // Render contents of header
      contents.length = 1;
      contents[0] = node;
      const container = $tw.fakeDocument.createElement('div');
      $tw.wiki.makeWidget({ tree: root }).render(container, null);
      headers.push({
        tag: (node as any).tag,
        count: headersCount[(node as any).tag as HeaderTag]++,
        text: container.textContent || '',
      });
    });
    return {
      title: this.tocTitle,
      headers,
    };
  }
}

exports['page-toc'] = PageTOCWidget;
