/* eslint-disable max-lines */
/* eslint-disable @typescript-eslint/lines-between-class-members */
import {
  HTMLTags,
  IParseTreeNode,
  IWidgetInitialiseOptions,
  IChangedTiddlers,
} from 'tiddlywiki';
import nodeMenuPlugin from './plugins/node-menu';
import { i18nMap, LocaleType, LocaleItem } from './i18n';
import { opml } from './opml';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import './style.less';

let initIcon = false;

const throttle = <T extends (...args: any) => any>(fn: T, waitFor: number) => {
  let timeout: NodeJS.Timeout | null = null;
  return (...args: Parameters<T>) => {
    if (timeout === null) {
      timeout = setTimeout(() => {
        clearTimeout(timeout!);
        timeout = null;
        fn(...(args as any[]));
      }, waitFor);
    }
  };
};

// 判断导图所使用的语言
const getLocale = (): LocaleType => {
  const l = $tw.wiki.getTiddler('$:/language')!.fields.text.toLowerCase();
  const k = {
    'zh-cn': 'zh_CN',
    'zh-hans': 'zh_CN',
    'zh-hant': 'zh_TW',
    'zh-hk': 'zh_TW',
    'zh-tw': 'zh_TW',
  }[l];
  if (k) {
    return k as LocaleType;
  }
  if (l.indexOf('zh') > -1) {
    return 'zh_CN';
  } else if (l.indexOf('ja')) {
    return 'ja';
  } else if (l.indexOf('pt')) {
    return 'pt';
  } else if (l.indexOf('ru')) {
    return 'ru';
  } else {
    return 'en';
  }
};

let MindElixir!: new (options: Options) => MindElixirInstance;
let data2Xmind!: (data: any) => Promise<Blob>;
let data2Html!: (data: any) => Promise<Blob>;
let data2Opml!: (data: any) => string;
let opml2Data!: (opml: string) => any;

// 非网页环境下会出错
if (typeof window !== 'undefined') {
  // eslint-disable-next-line prefer-destructuring
  data2Xmind = require('@mind-elixir/export-xmind').data2Xmind;
  // eslint-disable-next-line prefer-destructuring
  data2Html = require('@mind-elixir/export-html').data2Html;
  MindElixir = require('$:/plugins/Gk0Wk/mindmap-elixir/elixir.min.js');
  (globalThis as any).MindElixir = MindElixir;

  const { parse, stringify } = opml;
  data2Opml = stringify;
  opml2Data = parse;
}

class ElixirWidget extends Widget {
  // Options
  public draggable!: boolean;
  public contextMenu!: boolean;
  public toolBar!: boolean;
  public nodeMenu!: boolean;
  public keypress!: boolean;
  public locale!: LocaleType | 'auto';
  public overflowHidden!: boolean;
  public allowUndo!: boolean;

  // Style
  public primaryLinkStyle!: '1' | '2';
  public gap!: number;
  public rootRadius!: number;
  public mainRaidus!: number;
  public topicPadding!: number;
  public rootColor!: string;
  public rootBgColor!: string;
  public mainColor!: string;
  public mainBgColor!: string;
  public color!: string;
  public bgColor!: string;
  public palettes!: string[];

  // Other
  private containerNodeTag: HTMLTags = 'div';
  private containerNodeClass: string = '';
  private containerHeight: string = '300px';
  private containerWidth: string = '100%';

  // Context
  private elixirInstance?: MindElixirInstance;
  private stateTiddler: string = '';
  private stateTiddlerField: string = '';
  private locale_: LocaleType = 'en';

  // Other
  private optionsButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/options-button',
  )!;
  private exportButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/export-button',
  )!;
  private themeButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/palette',
  )!;
  private saveTiddler!: (reinit?: boolean) => void;
  private _parent!: Node;
  private _nextSibling: Node | null = null;

  initialise(parseTreeNode: IParseTreeNode, options: IWidgetInitialiseOptions) {
    super.initialise(parseTreeNode, options);
    this.computeAttributes();
    this.saveTiddler = throttle(
      (reinit = false) => this._saveTiddler(reinit),
      500,
    );
  }

  execute() {
    this.containerNodeTag = this.getAttribute('component', 'div') as HTMLTags;
    this.containerNodeClass = this.getAttribute('class', '');
    this.stateTiddler = this.getAttribute(
      'tiddler',
      this.getVariable('currentTiddler'),
    );
    this.stateTiddlerField = this.getAttribute('field', 'text');
    this.containerHeight = this.getAttribute('height', '300px');
    this.containerWidth = this.getAttribute('width', '100%');
    this.locale_ = getLocale();
  }

  render(parent: Node, nextSibling: Node | null) {
    if (!$tw.browser) {
      return;
    }
    this._parent = parent;
    this._nextSibling = nextSibling;
    this.execute();

    // 清楚之前的渲染结果(针对刷新设置后重新渲染的情况)
    try {
      this.domNodes.forEach(node => node.parentNode?.removeChild?.(node));
    } catch {}
    this.domNodes = [];

    // 如果 tiddler 和 field 对应了当前条目的文本字段，就会造成覆盖，这种情况是不被允许的
    if (
      this.stateTiddlerField === 'text' &&
      this.getVariable('currentTiddler') === this.stateTiddler
    ) {
      const container = $tw.utils.domMaker(this.containerNodeTag, {
        class: `gk0wk-mind-elixir-container ${this.containerNodeClass}`,
        style: {
          height: this.containerHeight,
          width: this.containerWidth,
          background: 'red',
          color: 'white',
        },
        text: i18nMap[this.locale_].overrideWarning,
      });
      parent.insertBefore(container, nextSibling);
      this.domNodes.push(container);
      return;
    }

    // 加载/创建数据
    let dataAndOptions = {
      options: {} as Record<string, any>,
    } as any;
    try {
      dataAndOptions = JSON.parse(
        $tw.wiki.getTiddler(this.stateTiddler)?.fields?.[
          this.stateTiddlerField
        ] as any,
      );
    } catch {}

    // Configure
    this.draggable = dataAndOptions.options?.draggable ?? true;
    this.contextMenu = dataAndOptions.options?.contextMenu ?? true;
    this.toolBar = dataAndOptions.options?.toolBar ?? true;
    this.nodeMenu = dataAndOptions.options?.nodeMenu ?? true;
    this.keypress = dataAndOptions.options?.keypress ?? true;
    this.locale = dataAndOptions.options?.locale ?? 'auto';
    this.overflowHidden = dataAndOptions.options?.overflowHidden ?? false;
    this.allowUndo = dataAndOptions.options?.allowUndo ?? false;
    this.primaryLinkStyle = dataAndOptions.options?.primaryLinkStyle ?? '1';
    // Style
    this.loadTheme(dataAndOptions.data?.theme ?? {});
    this.locale_ = this.locale === 'auto' ? this.locale_ : this.locale;

    // Data Loading
    const data =
      dataAndOptions.data ?? (MindElixir as any).new(i18nMap[this.locale_].new);
    data.theme = this.genTheme();

    // 渲染导图
    const container = $tw.utils.domMaker(this.containerNodeTag, {
      class: `gk0wk-mind-elixir-container ${this.containerNodeClass}`,
      style: {
        height: this.containerHeight,
        width: this.containerWidth,
      },
    });
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
    this.elixirInstance = new MindElixir({
      el: container,
      data: undefined as any,
      locale: this.locale_,
      draggable: this.draggable,
      contextMenu: this.contextMenu,
      toolBar: this.toolBar,
      keypress: this.keypress,
      allowUndo: this.allowUndo,
      overflowHidden: this.overflowHidden,
      primaryLinkStyle: this.primaryLinkStyle,
      contextMenuOption: {
        link: true,
        focus: true,
      },
    } as any);
    if (this.nodeMenu) {
      (this.elixirInstance as any).install(nodeMenuPlugin);
    }
    (this.elixirInstance as any).init(data);

    // 导图变更时保存
    this.elixirInstance.bus.addListener('operation', (operation: any) => {
      if (
        {
          insertSibling: true,
          addChild: true,
          removeNode: true,
          moveNode: true,
          finishEdit: true,
          reshapeNode: true,
        }[operation.name as string]
      ) {
        this.saveTiddler();
      }
    });
    (globalThis as any).i = this.elixirInstance;

    // 添加其他菜单的按钮
    const toolbar = container.querySelector(
      '.map-container > .mind-elixir-toolbar.rb',
    )!;
    toolbar.append(this.getThemeButton());
    toolbar.append(this.getExportButton());
    toolbar.appendChild(this.getSettingButton());

    // 让节点菜单在最前
    (
      container.querySelector('.map-container > .node-menu') as HTMLDivElement
    ).style.zIndex = '1000';
    (
      container.querySelector('.map-container > .node-menu') as HTMLDivElement
    ).style.color = 'black';

    // 有些图标自己有颜色，需要清除
    if (initIcon === false) {
      const clearFill = (s: Element) => {
        s.parentElement!.querySelectorAll('symbol > path').forEach(path =>
          path.setAttribute('fill', 'inhert'),
        );
        initIcon = true;
      };
      // 可能需要延迟检测
      setTimeout(() => {
        const s = document.querySelector('body > svg > symbol#icon-right');
        if (s?.parentElement) {
          clearFill(s);
        } else {
          const id = setInterval(() => {
            const s = document.querySelector('body > svg > symbol#icon-right');
            if (s?.parentElement) {
              clearFill(s);
              clearInterval(id);
            }
          }, 100);
        }
      }, 0);
    }
  }

  refresh(changedTiddlers: IChangedTiddlers) {
    const changedAttributes = this.computeAttributes();
    if (
      changedAttributes.tiddler !== undefined ||
      changedAttributes.field !== undefined ||
      changedAttributes.class !== undefined ||
      changedAttributes.component !== undefined ||
      changedAttributes.height !== undefined ||
      changedAttributes.width !== undefined
    ) {
      this.refreshSelf();
      return true;
    }
    return this.refreshChildren(changedTiddlers);
  }

  genTheme() {
    return {
      name: 'Custom',
      palette: this.palettes,
      cssVar: {
        '--gap': `${this.gap}px`,
        '--root-radius': `${this.rootRadius}px`,
        '--main-radius': `${this.mainRaidus}px`,
        '--root-color': this.rootColor,
        '--root-bgcolor': this.rootBgColor,
        '--main-color': this.mainColor,
        '--main-bgcolor': this.mainBgColor,
        '--topic-padding': `${this.topicPadding}px`,
        '--color': this.color,
        '--bgcolor': this.bgColor,
      },
    };
  }

  _saveTiddler(reinit = false) {
    $tw.wiki.addTiddler(
      new $tw.Tiddler(
        $tw.wiki.getTiddler(this.stateTiddler) ?? {
          title: this.stateTiddler,
          type: this.stateTiddlerField === 'text' ? 'application/json' : '',
        },
        {
          [this.stateTiddlerField]: JSON.stringify({
            data: {
              ...this.elixirInstance!.getData(),
              theme: this.genTheme(),
            },
            options: {
              draggable: this.draggable,
              contextMenu: this.contextMenu,
              toolBar: this.toolBar,
              nodeMenu: this.nodeMenu,
              keypress: this.keypress,
              locale: this.locale,
              overflowHidden: this.overflowHidden,
              allowUndo: this.allowUndo,
              primaryLinkStyle: this.primaryLinkStyle,
            },
          }),
        },
      ),
    );
    if (reinit) {
      this.render(this._parent, this._nextSibling);
    }
  }

  getThemeButton() {
    // 菜单
    const menuContainer = $tw.utils.domMaker('div', {
      class: 'gk0wk-elixir-theme-menu-container',
      style: {
        position: 'absolute',
        maxHeight: '250px',
        width: '150px',
        background: '#fff',
        bottom: '50px',
        right: '0px',
        borderRadius: '5px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'none',
        flexDirection: 'column',
      },
    });

    const themeIcon = $tw.utils.domMaker('span', {
      attributes: {
        id: 'export',
      },
    });
    themeIcon.innerHTML = this.themeButtonText;
    const svg = themeIcon.firstChild as SVGElement;
    let menuContainerHidden = true;
    svg.onclick = () => {
      menuContainerHidden = !menuContainerHidden;
      menuContainer.style.display = menuContainerHidden ? 'none' : 'flex';
      if (menuContainerHidden) {
        menuContainer.innerHTML = '';
      } else {
        // Export Themes
        const btn = $tw.utils.domMaker('button', {
          class: 'gk0wk-elixir-export-menu-item',
          style: {
            width: '100%',
            cursor: 'pointer',
            padding: '10px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textAlign: 'center',
            background: '#57d674',
            color: 'black',
            fontWeight: '750',
          },
          text: i18nMap[this.locale_].exportTheme ?? 'Export Theme',
        });
        btn.onclick = () => {
          const t = Math.random().toString(16).replace('0.', '');
          // eslint-disable-next-line node/prefer-global/url
          const url = URL.createObjectURL(
            new Blob(
              [
                [
                  `title: $:/plugins/Gk0Wk/mindmap-elixir/theme/users/${t}`,
                  `caption: theme-${t}`,
                  'tags: $:/mindmap-elixir/themes',
                  'type: application/json',
                  '',
                  JSON.stringify(
                    this.elixirInstance!.getData().theme,
                    undefined,
                    2,
                  ),
                ].join('\n'),
              ],
              { type: 'text/vnd.tiddlywiki' },
            ),
          );
          const a = document.createElement('a');
          a.href = url;
          a.download = `elixir-theme-${t}.tid`;
          a.click();
          // eslint-disable-next-line node/prefer-global/url
          URL.revokeObjectURL(url);
        };
        menuContainer.appendChild(btn);
        // Themes
        $tw.wiki
          .getTiddlersWithTag('$:/mindmap-elixir/themes')
          .forEach(tiddler => {
            const btn = $tw.utils.domMaker('button', {
              class: 'gk0wk-elixir-export-menu-item',
              style: {
                width: '100%',
                cursor: 'pointer',
                padding: '10px',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                borderTop: '1px solid #7779',
              },
              text: ($tw.wiki.getTiddler(tiddler)?.fields?.caption ||
                tiddler.split('/').pop() ||
                tiddler) as string,
            });
            btn.onclick = () => {
              const data = $tw.wiki.getTiddlerData(tiddler);
              this.loadTheme(data);
              this.saveTiddler(true);
            };
            menuContainer.appendChild(btn);
          });
      }
    };
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('class');
    svg.classList.add('icon');
    svg.ariaHidden = 'true';
    themeIcon.appendChild(menuContainer);
    return themeIcon;
  }

  getExportButton() {
    // 菜单
    const menuContainer = $tw.utils.domMaker('div', {
      class: 'gk0wk-elixir-export-menu-container',
      style: {
        position: 'absolute',
        maxHeight: '250px',
        width: '150px',
        background: '#fff',
        bottom: '50px',
        right: '0px',
        borderRadius: '5px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'none',
        flexDirection: 'column',
      },
    });

    const t: [string, string, () => Promise<Blob>][] = [
      [
        'exportXMind',
        '.xmind',
        () =>
          data2Xmind(
            JSON.parse(JSON.stringify(this.elixirInstance!.getData())),
          ),
      ],
      [
        'exportHtml',
        '.html',
        () =>
          data2Html(JSON.parse(JSON.stringify(this.elixirInstance!.getData()))),
      ],
      [
        'exportOpml',
        '.opml',
        async () => {
          const date = new Date().toString().replace(/\s*\([^)]*\)/g, '');
          const t = {
            opml: {
              version: '2.0',
              head: {
                title:
                  this.elixirInstance!.root.firstChild?.textContent ??
                  'TiddlyWiki Elixir MindMap',
                dateCreated: date,
                dateModified: date,
                generator: 'TiddlyWiki Elixir MindMap',
              },
              body: { subs: [{}] },
            },
          };
          const convert = (
            from: Record<string, any>,
            to: Record<string, any>,
          ) => {
            to.text = from.topic;
            // eslint-disable-next-line no-multi-assign
            to.description = to._note = from.memo;
            to.htmlUrl = from.hyperLink;
            to.style = from.style ? JSON.stringify(from.style) : undefined;
            to.icon = from.icon ? JSON.stringify(from.icon) : undefined;
            to.tags = from.tags ? JSON.stringify(from.tags) : undefined;
            [
              'description',
              '_note',
              'htmlUrl',
              'style',
              'icon',
              'tags',
            ].forEach(p => {
              if (to[p] === undefined) {
                delete to[p];
              }
            });
            if (from.children) {
              to.subs = [];
              for (const child of from.children) {
                const sub = {};
                convert(child, sub);
                to.subs.push(sub);
              }
            }
          };
          convert(this.elixirInstance!.getData().nodeData, t.opml.body.subs[0]);
          return new Blob([data2Opml(t)], { type: 'text/xml' });
        },
      ],
    ];
    t.forEach(([text, extname, fn]) => {
      const btn = $tw.utils.domMaker('button', {
        class: 'gk0wk-elixir-export-menu-item',
        style: {
          width: '100%',
          cursor: 'pointer',
          padding: '10px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          textAlign: 'center',
          borderBottom: '1px solid #7779',
        },
        text: i18nMap[this.locale_][text as keyof LocaleItem] ?? text,
      });
      btn.onclick = async () => {
        const blob = await fn();
        // eslint-disable-next-line node/prefer-global/url
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${
          this.elixirInstance!.root.firstChild?.textContent ?? 'elixir'
        }${extname}`;
        a.click();
        // eslint-disable-next-line node/prefer-global/url
        URL.revokeObjectURL(url);
      };
      menuContainer.appendChild(btn);
    });

    // Import OPML
    const uploader = $tw.utils.domMaker('input', {
      attributes: { type: 'file', accept: '.opml', hidden: true },
    });
    uploader.onchange = async () => {
      const file = uploader.files?.[0];
      if (!file) {
        return;
      }
      const opmlStr = await file.text();
      const data = opml2Data(opmlStr);
      let id = 0;
      const node = {};
      const convert = (from: any, to: any) => {
        to.topic = from.text;
        to.memo = from._note ?? from.description;
        to.hyperLink = from.htmlUrl ?? from.xmlUrl;
        to.style = from.style ? JSON.parse(from.style) : undefined;
        to.icon = from.icon ? JSON.parse(from.icon) : undefined;
        to.tags = from.tags ? JSON.parse(from.tags) : undefined;
        to.id = id++;
        if (from.subs) {
          to.children = [];
          for (const child of from.subs) {
            const sub = {};
            convert(child, sub);
            to.children.push(sub);
          }
        }
      };
      if ((data.opml.body.subs?.length ?? 0) < 1) {
        return;
      }
      convert(data.opml.body.subs[0], node);
      (this.elixirInstance as any).init({
        ...this.elixirInstance!.getData(),
        nodeData: node,
      });
      this.saveTiddler(true);
    };
    const uploaderBtn = $tw.utils.domMaker('button', {
      class: 'gk0wk-elixir-export-menu-item',
      style: {
        width: '100%',
        cursor: 'pointer',
        padding: '10px',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        textAlign: 'center',
      },
      children: [uploader],
      text: i18nMap[this.locale_].importOpml ?? 'Import From OPML',
    });
    uploaderBtn.onclick = () => uploader.click();
    menuContainer.appendChild(uploaderBtn);

    const exportIcon = $tw.utils.domMaker('span', {
      attributes: {
        id: 'export',
      },
    });
    exportIcon.innerHTML = this.exportButtonText;
    const svg = exportIcon.firstChild as SVGElement;
    let menuContainerHidden = true;
    svg.onclick = () => {
      menuContainerHidden = !menuContainerHidden;
      menuContainer.style.display = menuContainerHidden ? 'none' : 'flex';
    };
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('class');
    svg.classList.add('icon');
    svg.ariaHidden = 'true';
    exportIcon.appendChild(menuContainer);
    return exportIcon;
  }

  getSettingButton() {
    // 菜单
    const menuContainer = $tw.utils.domMaker('div', {
      class: 'gk0wk-elixir-operations-menu-container',
      style: {
        position: 'absolute',
        height: '250px',
        width: '250px',
        bottom: '50px',
        right: '0px',
        borderRadius: '5px',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.1)',
        padding: '10px',
        overflowX: 'hidden',
        overflowY: 'auto',
        display: 'none',
        flexDirection: 'column',
      },
    });

    // Colors
    menuContainer.appendChild(this.makeColorInput('rootColor'));
    menuContainer.appendChild(this.makeColorInput('rootBgColor'));
    menuContainer.appendChild(this.makeColorInput('mainColor'));
    menuContainer.appendChild(this.makeColorInput('mainBgColor'));
    menuContainer.appendChild(this.makeColorInput('color'));
    menuContainer.appendChild(this.makeColorInput('bgColor'));
    menuContainer.appendChild(this.makeRatio('primaryLinkStyle', ['1', '2']));
    menuContainer.appendChild(this.makeIntegerInput('rootRadius'));
    menuContainer.appendChild(this.makeIntegerInput('mainRaidus'));
    menuContainer.appendChild(this.makeIntegerInput('topicPadding'));
    menuContainer.appendChild(this.makeIntegerInput('gap'));
    menuContainer.appendChild(this.makeColorInputs('palettes'));
    menuContainer.appendChild($tw.utils.domMaker('hr', {}));

    // Settings
    menuContainer.appendChild(this.makeCheckBox('draggable'));
    menuContainer.appendChild(this.makeCheckBox('contextMenu'));
    menuContainer.appendChild(this.makeCheckBox('toolBar'));
    menuContainer.appendChild(this.makeCheckBox('nodeMenu'));
    menuContainer.appendChild(this.makeCheckBox('keypress'));
    menuContainer.appendChild(this.makeCheckBox('overflowHidden'));
    menuContainer.appendChild(this.makeCheckBox('allowUndo'));
    menuContainer.appendChild(
      this.makeRatio('locale', [
        ['auto', 'auto'],
        ['zh_CN', '简中'],
        ['zh_TW', '繁中'],
        ['en', 'English'],
        ['ja', '日本語'],
        ['pt', 'Português'],
        ['ru', 'Россий'],
      ]),
    );

    // 按钮
    const settingsIcon = $tw.utils.domMaker('span', {
      attributes: {
        id: 'settings',
      },
    });
    settingsIcon.innerHTML = this.optionsButtonText;
    const svg = settingsIcon.firstChild as SVGElement;
    let menuContainerHidden = true;
    svg.onclick = () => {
      menuContainerHidden = !menuContainerHidden;
      menuContainer.style.display = menuContainerHidden ? 'none' : 'flex';
    };
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.removeAttribute('class');
    svg.classList.add('icon');
    svg.ariaHidden = 'true';
    settingsIcon.appendChild(menuContainer);

    return settingsIcon;
  }

  makeIntegerInput(propertyName: keyof ElixirWidget) {
    const input = $tw.utils.domMaker('input', {
      attributes: {
        type: 'number',
        name: propertyName,
      },
      style: { marginLeft: '5px' },
    });
    input.value = this[propertyName] as string;
    input.onchange = e => {
      (this[propertyName] as any) = Math.max(
        0,
        parseInt((e.target as any).value, 10),
      );
      this.saveTiddler(true);
    };
    return $tw.utils.domMaker('div', {
      children: [
        $tw.utils.domMaker('label', {
          text:
            i18nMap[this.locale_][propertyName as keyof LocaleItem] ||
            propertyName,
          style: { fontWeight: '900' },
        }),
        input,
      ],
    });
  }

  makeColorInput(propertyName: keyof ElixirWidget) {
    const input = $tw.utils.domMaker('input', {
      attributes: {
        type: 'color',
        name: propertyName,
      },
      style: { marginRight: '5px' },
    });
    input.value = this[propertyName] as string;
    input.onchange = e => {
      (this[propertyName] as any) = (e.target as any).value;
      this.saveTiddler(true);
    };
    return $tw.utils.domMaker('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      children: [
        $tw.utils.domMaker('label', {
          text:
            i18nMap[this.locale_][propertyName as keyof LocaleItem] ||
            propertyName,
        }),
        input,
      ],
    });
  }

  makeColorInputs(propertyName: keyof ElixirWidget) {
    return $tw.utils.domMaker('div', {
      children: [
        $tw.utils.domMaker('label', {
          style: { display: 'flex', alignItems: 'center', fontWeight: '900' },
          text:
            i18nMap[this.locale_][propertyName as keyof LocaleItem] ||
            propertyName,
        }),
        $tw.utils.domMaker('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: '33% 33% 33%',
            marginLeft: '5px',
          },
          children: (this[propertyName] as string[]).map((color, index) => {
            const input = $tw.utils.domMaker('input', {
              attributes: {
                type: 'color',
                name: propertyName,
              },
            });
            input.value = color;
            input.onchange = e => {
              this.palettes[index] = (e.target as any).value;
              this.saveTiddler(true);
            };
            return input;
          }),
        }),
      ],
    });
  }

  makeCheckBox(propertyName: keyof ElixirWidget) {
    const input = $tw.utils.domMaker('input', {
      attributes: {
        type: 'checkbox',
        name: propertyName,
      },
      style: { marginRight: '5px' },
    });
    input.checked = Boolean(this[propertyName]);
    input.onchange = e => {
      (this[propertyName] as any) = (e.target as HTMLInputElement).checked;
      this.saveTiddler(true);
    };
    return $tw.utils.domMaker('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
      },
      children: [
        input,
        $tw.utils.domMaker('label', {
          text:
            i18nMap[this.locale_][propertyName as keyof LocaleItem] ||
            propertyName,
        }),
      ],
    });
  }

  makeRatio(
    propertyName: keyof ElixirWidget,
    choices: string[] | [string, string][],
  ) {
    const inputs: HTMLInputElement[] = [];
    return $tw.utils.domMaker('div', {
      children: [
        $tw.utils.domMaker('label', {
          style: { display: 'flex', alignItems: 'center', fontWeight: '900' },
          text:
            i18nMap[this.locale_][propertyName as keyof LocaleItem] ||
            propertyName,
        }),
        $tw.utils.domMaker('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: '50% 50%',
            marginLeft: '5px',
          },
          children: choices.map(choice_ => {
            const choice = Array.isArray(choice_) ? choice_[0] : choice_;
            const displayName = Array.isArray(choice_) ? choice_[1] : choice_;
            const input = $tw.utils.domMaker('input', {
              attributes: {
                type: 'radio',
                name: propertyName,
              },
              style: {
                marginRight: '5px',
              },
            });
            input.checked = choice === (this[propertyName] as any);
            inputs.push(input);
            input.onchange = () => {
              inputs.forEach(i => (i.checked = false));
              (this[propertyName] as any) = choice;
              input.checked = true;
              this.saveTiddler(true);
            };
            return $tw.utils.domMaker('label', {
              style: { display: 'flex', alignItems: 'center' },
              children: [
                input,
                $tw.utils.domMaker('span', { text: displayName }),
              ],
            });
          }),
        }),
      ],
    });
  }

  loadTheme(theme: any) {
    this.palettes = [
      ...(theme.palette ?? [
        '#848FA0',
        '#748BE9',
        '#D2F9FE',
        '#4145A5',
        '#789AFA',
        '#706CF4',
        '#EF987F',
        '#775DD5',
        '#FCEECF',
        '#DA7FBC',
      ]),
    ];
    this.gap = Number((theme.cssVar?.['--gap'] ?? '30px').replace('px', ''));
    this.rootRadius = Number(
      (theme.cssVar?.['--root-radius'] ?? '30px').replace('px', ''),
    );
    this.mainRaidus = Number(
      (theme.cssVar?.['--main-radius'] ?? '20px').replace('px', ''),
    );
    this.rootColor = theme.cssVar?.['--root-color'] ?? '#ffffff';
    this.rootBgColor = theme.cssVar?.['--root-bgcolor'] ?? '#4c4f69';
    this.mainColor = theme.cssVar?.['--main-color'] ?? '#444446';
    this.mainBgColor = theme.cssVar?.['--main-bgcolor'] ?? '#ffffff';
    this.color = theme.cssVar?.['--color'] ?? '#777777';
    this.bgColor = theme.cssVar?.['--bgcolor'] ?? '#f6f6f6';
    this.topicPadding = Number(
      (theme.cssVar?.['--topic-padding'] ?? '5px').replace('px', ''),
    );
  }
}

exports.elixir = ElixirWidget;
exports.mindmap = ElixirWidget;
/* eslint-enable @typescript-eslint/lines-between-class-members */
/* eslint-enable max-lines */
