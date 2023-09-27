import type { Widget } from 'tiddlywiki';

const { editTextWidgetFactory } = require('$:/core/modules/editor/factory.js');
const { SimpleEngine } = require('$:/core/modules/editor/engines/simple.js');
const { decode } = require('$:/plugins/Gk0Wk/drawio/base64.min.js');

$tw.utils.registerFileType('application/x-drawio', 'utf8', '.drawio', {
  flags: ['image'],
});
$tw.utils.registerFileType('application/vnd.drawio', 'utf8', '.drawio', {
  flags: ['image'],
});

const checkIfDarkMode = () =>
  $tw.wiki.getTiddler($tw.wiki.getTiddlerText('$:/palette')!)?.fields?.[
    'color-scheme'
  ] === 'dark';

interface IEditorFactoryOptions {
  widget: Widget;
  value: string;
  type: string;
  parentNode: HTMLElement;
  nextSibling: HTMLElement;
}

// 用于检测 iframe 是否被删除
const drawioEditorInstance: Set<DrawIOEditor> = new Set();
let drawioUnmountCheckTimer: NodeJS.Timer | undefined;
const registerInstance = (editor: DrawIOEditor) => {
  if (!$tw.browser || drawioUnmountCheckTimer !== undefined) {
    return;
  }
  drawioEditorInstance.add(editor);
  drawioUnmountCheckTimer = setInterval(() => {
    const deletingEdiget: DrawIOEditor[] = [];
    for (const editor of drawioEditorInstance) {
      if (
        editor.iframeNode === undefined ||
        !document.contains(editor.iframeNode)
      ) {
        deletingEdiget.push(editor);
      }
    }
    for (const editor of deletingEdiget) {
      drawioEditorInstance.delete(editor);
    }
    if (drawioEditorInstance.size < 1) {
      drawioUnmountCheckTimer = undefined;
      clearInterval(drawioUnmountCheckTimer);
    }
  }, 1000);
};

class DrawIOEditor {
  xml: string;

  iframeNode?: HTMLIFrameElement;

  unmount: () => void;

  constructor({
    widget,
    value,
    parentNode,
    nextSibling,
  }: IEditorFactoryOptions) {
    // SSR 模式下不渲染
    if (!$tw.browser) {
      parentNode.insertBefore(
        $tw.utils.domMaker('div', {
          document: widget.document,
          class: 'gk0wk-drawio-preview',
          style: {
            margin: '0',
            border: 'none',
            width: '100%',
            height: '100%',
          },
          innerHTML: value,
        }),
        nextSibling,
      );
      this.xml = '';
      this.unmount = () => null;
      return;
    }

    this.iframeNode = $tw.utils.domMaker('iframe', {
      document: widget.document,
      class: 'gk0wk-drawio-iframe',
      attributes: {
        frameborder: '0',
      },
      style: {
        margin: '0',
        border: 'none',
        width: '100%',
        minHeight: '700px',
        maxHeight: '90vh',
        height: '100%',
      },
    });
    parentNode.insertBefore(this.iframeNode, nextSibling);

    this.xml = value;
    let hasInited = false;
    // 嵌入模式 通信协议
    // See: https://www.drawio.com/doc/faq/embed-mode
    const receive = ({ data, source }: MessageEvent<string>) => {
      if (
        this.iframeNode?.contentWindow === null ||
        source !== this.iframeNode!.contentWindow
      ) {
        return;
      }
      const { event, ...payload } = JSON.parse(data);
      switch (event) {
        case 'init': {
          if (hasInited) {
            return;
          }
          hasInited = true;
          this.iframeNode!.contentWindow.postMessage(
            JSON.stringify({ action: 'load', xml: this.xml, autosave: 1 }),
            '*',
          );
          break;
        }
        case 'configure': {
          this.iframeNode!.contentWindow.postMessage(
            JSON.stringify({
              action: 'configure',
              config: {
                compressXml: true,
                enableCssDarkMode: true,
              },
            }),
            '*',
          );
          break;
        }
        case 'load':
        case 'save':
        case 'autosave': {
          this.iframeNode!.contentWindow.postMessage(
            JSON.stringify({
              action: 'export',
              format: 'xmlsvg',
              embedImages: true,
              keepTheme: true,
              twEditor: true,
            }),
            '*',
          );
          break;
        }
        case 'openLink': {
          const { href, target } = payload;
          window.open(href, target);
          break;
        }
        case 'export': {
          const { message, data } = payload;
          if (data && message.twEditor) {
            const newXml = decode(data.split(',', 2)[1]);
            if (newXml === this.xml) {
              return;
            }
            this.xml = newXml;
            (widget as any).saveChanges(newXml);
          }
          break;
        }
        default: {
          break;
        }
      }
    };

    // 主题
    const theme =
      $tw.wiki.getTiddlerText(
        checkIfDarkMode()
          ? '$:/plugins/Gk0Wk/drawio/config/theme-dark'
          : '$:/plugins/Gk0Wk/drawio/config/theme-light',
        '',
      ) || 'Kennedy';

    window.addEventListener('message', receive);
    this.iframeNode.setAttribute(
      'src',
      `https://embed.diagrams.net/?embed=1&ui=${theme}&spin=1&libraries=1&noExitBtn=1&saveAndExit=0&noSaveBtn=1&proto=json&protocol=json&configure=1`,
    );

    this.unmount = () => {
      window.removeEventListener('message', receive);
    };

    registerInstance(this);
  }

  loadXml(xml: string) {
    if (xml === this.xml) {
      return;
    }
    this.iframeNode?.contentWindow?.postMessage?.(
      JSON.stringify({ action: 'load', xml, autosave: 1 }),
      '*',
    );
  }

  resize(): void {
    // this.iframeNode.setAttribute('width', )
  }

  // 调整高度
  fixHeight(): void {
    this.resize();
  }

  // 获得焦点
  focus(): void {
    this.iframeNode?.focus?.();
  }

  // 给工具栏用的，没用
  createTextOperation() {
    return {
      text: '',
      selection: '',
      selStart: 0,
      selEnd: 0,
      cutStart: null,
      cutEnd: null,
      replacement: null,
      newSelStart: null,
      newSelEnd: null,
    };
  }

  // 同上
  executeTextOperation() {
    return this.xml;
  }

  // 条目内容更新
  updateDomNodeText(value: string) {
    this.loadXml(value);
  }

  // 设置内容, 一般是由代码(如子组件)通过调用来主动触发
  setText(value: string, _type: string) {
    this.loadXml(value);
  }
}

const engine = $tw.browser ? DrawIOEditor : SimpleEngine;
exports['edit-drawio'] = editTextWidgetFactory(engine, engine);
