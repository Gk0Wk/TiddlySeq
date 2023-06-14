export type LocaleType = 'zh_CN' | 'zh_TW' | 'en' | 'ja' | 'pt' | 'ru';

export interface LocaleItem {
  new: string;
  draggable: string;
  contextMenu: string;
  toolBar: string;
  nodeMenu: string;
  keypress: string;
  locale: string;
  overflowHidden: string;
  allowUndo: string;
  primaryLinkStyle: string;
  gap: string;
  palettes: string;
  rootColor: string;
  rootBgColor: string;
  mainColor: string;
  mainBgColor: string;
  color: string;
  bgColor: string;
  overrideWarning: string;
  rootRadius: string;
  mainRaidus: string;
  topicPadding: string;
  exportXMind: string;
  exportHtml: string;
  exportOpml: string;
  importOpml: string;
  exportTheme: string;
}

export const i18nMap: Record<LocaleType, LocaleItem> = {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  zh_CN: {
    new: '新话题',
    draggable: '画布可拖拽',
    contextMenu: '右键菜单',
    toolBar: '工具栏',
    nodeMenu: '节点菜单',
    keypress: '快捷键',
    locale: '语言',
    overflowHidden: '隐藏超出部分',
    allowUndo: '允许撤销',
    primaryLinkStyle: '主链接样式',
    gap: '节点间距',
    rootColor: '根节点文字颜色',
    rootBgColor: '根节点背景颜色',
    mainColor: '主节点文字颜色',
    mainBgColor: '主节点背景颜色',
    color: '文字颜色',
    bgColor: '背景颜色',
    overrideWarning: '请正确指定tiddler和field字段!',
    rootRadius: '根节点圆角',
    mainRaidus: '主节点圆角',
    topicPadding: '节点内边距',
    exportXMind: '导出到XMind',
    exportHtml: '导出到HTML',
    exportOpml: '导出到OPML',
    importOpml: '从OPML导入',
    exportTheme: '导出主题',
    palettes: '分支颜色',
  },
  // eslint-disable-next-line @typescript-eslint/naming-convention
  zh_TW: {
    new: '新話題',
    draggable: '畫布可拖拽',
    contextMenu: '右鍵菜單',
    toolBar: '工具欄',
    nodeMenu: '節點菜單',
    keypress: '快捷鍵',
    locale: '語言',
    overflowHidden: '隱藏超出部分',
    allowUndo: '允許撤銷',
    primaryLinkStyle: '主鏈接樣式',
    gap: '節點間距',
    rootColor: '根節點文字顏色',
    rootBgColor: '根節點背景顏色',
    mainColor: '主節點文字顏色',
    mainBgColor: '主節點背景顏色',
    color: '文字顏色',
    bgColor: '背景顏色',
    overrideWarning: '請正確指定tiddler和field字段!',
    rootRadius: '根節點圓角',
    mainRaidus: '主節點圓角',
    topicPadding: '節點內邊距',
    exportXMind: '導出到XMind',
    exportHtml: '導出到HTML',
    exportOpml: '導出到OPML',
    importOpml: '從OPML導入',
    exportTheme: '導出主題',
    palettes: '分支顏色',
  },
  en: {
    new: 'New Topic',
    draggable: 'Draggable',
    contextMenu: 'Context Menu',
    toolBar: 'Tool Bar',
    nodeMenu: 'Node Menu',
    keypress: 'Keypress',
    locale: 'Locale',
    overflowHidden: 'Overflow Hidden',
    allowUndo: 'Allow Undo',
    primaryLinkStyle: 'Primary Link Style',
    gap: 'Node Gap',
    rootColor: 'Root Color',
    rootBgColor: 'Root Background Color',
    mainColor: 'Main Color',
    mainBgColor: 'Main Background Color',
    color: 'Color',
    bgColor: 'Background Color',
    overrideWarning: 'Please specify the tiddler and field fields correctly!',
    rootRadius: 'Root Radius',
    mainRaidus: 'Main Radius',
    topicPadding: 'Topic Padding',
    exportXMind: 'Export to XMind',
    exportHtml: 'Export to HTML',
    exportOpml: 'Export to OPML',
    importOpml: 'Import from OPML',
    exportTheme: 'Export Theme',
    palettes: 'Palettes',
  },
  ja: {
    new: '新しいトピック',
    draggable: 'ドラッグ可能',
    contextMenu: 'コンテキストメニュー',
    toolBar: 'ツールバー',
    nodeMenu: 'ノードメニュー',
    keypress: 'キープレス',
    locale: 'ロケール',
    overflowHidden: 'オーバーフローを隠す',
    allowUndo: 'アンドゥを許可する',
    primaryLinkStyle: 'プライマリリンクスタイル',
    gap: 'ノード間隔',
    rootColor: 'ルートの文字色',
    rootBgColor: 'ルートの背景色',
    mainColor: 'メインの文字色',
    mainBgColor: 'メインの背景色',
    color: '文字色',
    bgColor: '背景色',
    overrideWarning: 'tiddlerとfieldフィールドを正しく指定してください!',
    rootRadius: 'ルートの半径',
    mainRaidus: 'メインの半径',
    topicPadding: 'トピックのパディング',
    exportXMind: 'XMindにエクスポート',
    exportHtml: 'HTMLにエクスポート',
    exportOpml: 'OPMLにエクスポート',
    importOpml: 'OPMLからインポート',
    exportTheme: 'テーマをエクスポート',
    palettes: 'パレット',
  },
  pt: {
    new: 'Novo Tópico',
    draggable: 'Arrastável',
    contextMenu: 'Menu de Contexto',
    toolBar: 'Barra de Ferramentas',
    nodeMenu: 'Menu de Nó',
    keypress: 'Pressionar Tecla',
    locale: 'Local',
    overflowHidden: 'Ocultar Overflow',
    allowUndo: 'Permitir Desfazer',
    primaryLinkStyle: 'Estilo de Link Primário',
    gap: 'Espaçamento de Nó',
    rootColor: 'Cor do Texto da Raiz',
    rootBgColor: 'Cor de Fundo da Raiz',
    mainColor: 'Cor do Texto Principal',
    mainBgColor: 'Cor de Fundo Principal',
    color: 'Cor',
    bgColor: 'Cor de Fundo',
    overrideWarning:
      'Por favor, especifique os campos tiddler e field corretamente!',
    rootRadius: 'Raio da Raiz',
    mainRaidus: 'Raio Principal',
    topicPadding: 'Preenchimento do Tópico',
    exportXMind: 'Exportar para XMind',
    exportHtml: 'Exportar para HTML',
    exportOpml: 'Exportar para OPML',
    importOpml: 'Importar de OPML',
    exportTheme: 'Exportar Tema',
    palettes: 'Paletas',
  },
  ru: {
    new: 'Новая тема',
    draggable: 'Перетаскиваемый',
    contextMenu: 'Контекстное меню',
    toolBar: 'Панель инструментов',
    nodeMenu: 'Меню узла',
    keypress: 'Нажатие клавиши',
    locale: 'Локаль',
    overflowHidden: 'Скрыть переполнение',
    allowUndo: 'Разрешить отмену',
    primaryLinkStyle: 'Основной стиль ссылки',
    gap: 'Промежуток между узлами',
    rootColor: 'Цвет текста корня',
    rootBgColor: 'Цвет фона корня',
    mainColor: 'Основной цвет текста',
    mainBgColor: 'Основной цвет фона',
    color: 'Цвет',
    bgColor: 'Цвет фона',
    overrideWarning: 'Пожалуйста, укажите правильно поля tiddler и field!',
    rootRadius: 'Радиус корня',
    mainRaidus: 'Основной радиус',
    topicPadding: 'Заполнение темы',
    exportXMind: 'Экспорт в XMind',
    exportHtml: 'Экспорт в HTML',
    exportOpml: 'Экспорт в OPML',
    importOpml: 'Импорт из OPML',
    exportTheme: 'Экспорт темы',
    palettes: 'Палитры',
  },
};
