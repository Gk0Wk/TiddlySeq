export interface ChatHistory {
  id: string;
  created: number;
  user: string;
  assistant: string;
}

export interface ChatGPTOptions {
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  user: string;
}

export const isChinese = () =>
  $tw.wiki.getTiddler('$:/language')!.fields.text.includes('zh');

export const renderConversation = (
  { id, assistant, user, created }: ChatHistory,
  zh: boolean,
  editButtonText: string,
  deleteButtonText: string,
  onEdit?: (user: string) => void,
  onDelete?: () => void,
) => {
  let editButton: HTMLButtonElement | undefined;
  if (onEdit) {
    editButton = $tw.utils.domMaker('button', {
      class: 'edit-button',
      innerHTML: editButtonText,
      attributes: {
        title: zh ? '重新生成问题' : 'Regenerate question',
      },
    });
    editButton.onclick = () => onEdit(user);
  }
  let deleteButton: HTMLButtonElement | undefined;
  if (onDelete) {
    deleteButton = $tw.utils.domMaker('button', {
      class: 'delete-button',
      innerHTML: deleteButtonText,
      attributes: {
        title: zh ? '删除问题' : 'Delete question',
      },
    });
    deleteButton.onclick = () => onDelete();
  }
  return $tw.utils.domMaker('div', {
    class: 'chatgpt-conversation',
    attributes: {
      'chatgpt-conversation': id,
    },
    children: [
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation-message chatgpt-conversation-user',
        children: [
          $tw.utils.domMaker('div', {
            class: 'conversation-datetime',
            text: new Date(created * 1000).toLocaleString(),
          }),
          $tw.utils.domMaker('p', { text: user }),
          ...(deleteButton ? [deleteButton] : []),
          ...(editButton ? [editButton] : []),
        ],
      }),
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation-message chatgpt-conversation-assistant',
        innerHTML: $tw.wiki.renderText(
          'text/html',
          'text/x-markdown' as any,
          assistant,
        ),
      }),
    ],
  });
};

export const renderChatingConversation = (
  zh: boolean,
  user: string,
  conversations: HTMLElement,
) => {
  const answerBox = $tw.utils.domMaker('pre', {
    text: zh ? '思考中...' : 'Thinking...',
    style: {
      background: 'transparent',
      marginTop: '0',
      marginBottom: '0',
      padding: '0',
    },
  });
  const conversation = $tw.utils.domMaker('div', {
    class: 'chatgpt-conversation chatgpt-conversation-chating',
    children: [
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation-message chatgpt-conversation-user',
        children: [
          $tw.utils.domMaker('div', {
            class: 'conversation-datetime',
            text: new Date().toLocaleString(),
          }),
          $tw.utils.domMaker('p', { text: user }),
        ],
      }),
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation-message chatgpt-conversation-assistant',
        children: [
          $tw.utils.domMaker('p', {
            children: [answerBox],
          }),
        ],
      }),
    ],
  });
  const printError = (err: string) => {
    conversations.removeChild(conversation);
    conversations.appendChild(
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation chatgpt-conversation-error',
        children: [
          $tw.utils.domMaker('div', {
            class: 'chatgpt-conversation-message chatgpt-conversation-user',
            children: [$tw.utils.domMaker('p', { text: user })],
          }),
          $tw.utils.domMaker('div', {
            class:
              'chatgpt-conversation-message chatgpt-conversation-assistant',
            text: err,
          }),
        ],
      }),
    );
  };
  return { conversation, answerBox, printError };
};

export const historyManager = (tiddler: string) => ({
  getHistory: () => {
    let history: ChatHistory[] = [];
    try {
      history = JSON.parse($tw.wiki.getTiddlerText(tiddler) || '[]');
    } catch {}
    return history;
  },
  setHistory: (history: ChatHistory[]) => {
    $tw.wiki.addTiddler(
      new $tw.Tiddler($tw.wiki.getTiddler(tiddler) ?? {}, {
        title: tiddler,
        text: JSON.stringify(history),
        type: 'application/json',
      }),
    );
  },
});
