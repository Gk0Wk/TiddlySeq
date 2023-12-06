import type {
  IParseTreeNode,
  IWidgetInitialiseOptions,
  IChangedTiddlers,
} from 'tiddlywiki';
import jquery from 'jquery';
import {
  GoldenLayout,
  LayoutConfig,
  Stack,
  ComponentItem,
} from 'golden-layout';
import { removeWidget } from './tiddlerRefresh';
import { addNewTiddlerIcon } from './addNewTiddlerf';
import { tiddlerComponentFactoryFunction } from './tiddlerComponent';
import { iframeComponentFactoryFunction } from './iframeComponent';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';

if ($tw.browser && !(globalThis as any).$) {
  (globalThis as any).$ = jquery;
  (globalThis as any).jQuery = jquery;
}

const unsupportedFields: Set<string> = new Set([
  'title',
  'type',
  'tags',
  'creator',
  'created',
  'modifier',
  'modified',
]);
const widgets: Set<GoldenLayoutWidget> = new Set();
let instanceUnmountCheckTimer: NodeJS.Timer | undefined;
const isChinese = () =>
  $tw.wiki.getTiddler('$:/language')!.fields.text.includes('zh');

class GoldenLayoutWidget extends Widget {
  layout: GoldenLayout = undefined as any;

  container: HTMLDivElement = undefined as any;

  tiddler?: string;

  field: string = 'text';

  config?: LayoutConfig;

  onDestory: (() => void)[] = [];

  initialise(parseTreeNode: IParseTreeNode, options: IWidgetInitialiseOptions) {
    super.initialise(parseTreeNode, options);
    this.computeAttributes();
  }

  execute() {
    this.makeChildWidgets();
    this.tiddler = this.getAttribute('tiddler');
    this.field = this.getAttribute('field', 'text');
    if (unsupportedFields.has(this.field)) {
      this.field = 'text';
    }
    const text = this.getAttribute('config');
    if (text) {
      this.config = $tw.utils.parseJSONSafe(text, () => undefined);
    } else if (this.tiddler) {
      this.config = $tw.utils.parseJSONSafe(
        String($tw.wiki.getTiddler(this.tiddler)?.fields?.[this.field]) ?? '',
        () => undefined,
      );
    }
    this.config ??= $tw.utils.parseJSONSafe(
      $tw.wiki.getTiddlerText('$:/plugins/Gk0Wk/layouts/defaultConfig.json')!,
      () => undefined,
    );
    this.config ??= JSON.parse(
      $tw.wiki.getTiddler('$:/plugins/Gk0Wk/layouts')!.fields.text,
    ).tiddlers['$:/plugins/Gk0Wk/layouts/defaultConfig.json'];

    this.config!.header = {
      ...(this.config!.header ?? {}),
      ...(isChinese()
        ? {
            popout: '在新窗口打开',
            close: '关闭',
            maximise: '最大化',
            minimise: '最小化',
            tabDropdown: '其他页面',
          }
        : {
            popout: 'open in new window',
            close: 'close',
            maximise: 'maximise',
            minimise: 'minimise',
            tabDropdown: 'additional tabs',
          }),
    };
  }

  render(parent: Node, nextSibling: Node | null) {
    if (!$tw.browser || !parent) {
      return;
    }
    this.execute();
    const container = this.init();
    if (container) {
      this.domNodes.push(container);
      parent.insertBefore(container, nextSibling);
    }
    if (this.config) {
      try {
        this.layout.loadLayout(this.config);
      } catch (e) {
        console.error(e);
      }
    }
  }

  init() {
    const first = this.container === undefined;
    if (first) {
      this.container = $tw.utils.domMaker('div', {
        class: 'layouts-container',
        style: {
          height: '1000px',
        },
      });
    } else {
      this.container.innerHTML = '';
      this.layout?.destroy?.();
    }
    this.layout = new GoldenLayout(this.container);
    this.layout.on('stateChanged', () => {
      if (this.tiddler) {
        $tw.wiki.addTiddler(
          new $tw.Tiddler($tw.wiki.getTiddler(this.tiddler) ?? {}, {
            title: this.tiddler,
            [this.field]: JSON.stringify(
              LayoutConfig.fromResolved(this.layout.saveLayout()),
              undefined,
              2,
            ),
            type: 'application/json',
          }),
        );
      }
    });

    // 注册 添加 按钮
    this.layout.on('itemCreated', item => {
      if ((item.target as any).isStack) {
        addNewTiddlerIcon(item.target as Stack, isChinese());
      }
    });

    this.layout.on('beforeItemDestroyed', item => {
      // console.log('beforeItemDestroyed', item.target);
      if ((item.target as any).type === 'component') {
        removeWidget((item.target as ComponentItem).container);
      }
    });

    // 注册 tiddler 组件
    this.layout.registerComponentFactoryFunction(
      'tiddler',
      tiddlerComponentFactoryFunction(this),
    );
    this.layout.registerComponentFactoryFunction(
      'iframe',
      iframeComponentFactoryFunction(this),
    );

    // 检测 container 的大小变化
    const resize = () =>
      requestAnimationFrame(() => this.layout.updateRootSize());
    if ((globalThis as any).ResizeObserver) {
      const o = new ResizeObserver(resize);
      o.observe(this.container);
      this.onDestory.push(() => o.disconnect());
    } else {
      window.addEventListener('resize', resize);
      this.onDestory.push(() => window.removeEventListener('resize', resize));
    }

    if ($tw.browser && first) {
      widgets.add(this);
      instanceUnmountCheckTimer ??= setInterval(() => {
        const deletingWidget: GoldenLayoutWidget[] = [];
        for (const widget of widgets) {
          if (!document.contains(this.container)) {
            deletingWidget.push(widget);
            for (const unmount of widget.onDestory) {
              unmount();
            }
            this.layout.destroy();
          }
        }
        for (const w of deletingWidget) {
          widgets.delete(w);
        }
        if (widgets.size < 1) {
          clearInterval(instanceUnmountCheckTimer as any);
          instanceUnmountCheckTimer = undefined;
        }
      }, 1000);
    }

    return first ? this.container : undefined;
  }

  refresh(changedTiddlers: IChangedTiddlers) {
    const changedAttributes = this.computeAttributes();
    if (changedAttributes.tiddler || changedAttributes.config) {
      this.refreshSelf();
      return true;
    }
    return this.refreshChildren(changedTiddlers);
  }
}

exports['golden-layout'] = GoldenLayoutWidget;
