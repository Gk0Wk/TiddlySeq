import {
  HTMLTags,
  IParseTreeNode,
  IWidgetInitialiseOptions,
  IChangedTiddlers,
} from 'tiddlywiki';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import {
  historyManager,
  isChinese,
  ChatGPTOptions,
  renderConversation,
  renderChatingConversation,
} from './utils';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import './style.less';

class ChatGPTWidget extends Widget {
  private containerNodeTag: HTMLTags = 'div';

  private containerNodeClass: string = '';

  private tmpHistoryTiddler: string = `$:/temp/Gk0Wk/ChatGPT/history-${Date.now()}`;

  private historyTiddler: string = this.tmpHistoryTiddler;

  private chatButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/add-comment',
  )!;

  private editButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/edit-button',
  )!;

  private deleteButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/delete-button',
  )!;

  private scroll: boolean = false;

  private readonly: boolean = false;

  private chatGPTOptions: Partial<ChatGPTOptions> = {};

  private systemMessage: string = '';

  initialise(parseTreeNode: IParseTreeNode, options: IWidgetInitialiseOptions) {
    super.initialise(parseTreeNode, options);
    this.computeAttributes();
  }

  execute() {
    this.containerNodeTag = this.getAttribute('component', 'div') as HTMLTags;
    this.containerNodeClass = this.getAttribute('className', '');
    this.historyTiddler =
      this.getAttribute('history', '') || this.tmpHistoryTiddler;
    this.scroll = this.getAttribute('scroll')?.toLowerCase?.() === 'yes';
    this.readonly = this.getAttribute('readonly')?.toLowerCase?.() === 'yes';

    const temperature = Number(this.getAttribute('temperature'));
    const top_p = Number(this.getAttribute('top_p'));
    const max_tokens = parseInt(this.getAttribute('max_tokens')!, 10);
    const presence_penalty = Number(this.getAttribute('presence_penalty'));
    const frequency_penalty = Number(this.getAttribute('frequency_penalty'));
    this.chatGPTOptions = {
      model: this.getAttribute('model', 'gpt-3.5-turbo'),
      temperature:
        temperature >= 0 && temperature <= 2 ? temperature : undefined,
      top_p: top_p >= 0 && top_p <= 1 ? top_p : undefined,
      max_tokens:
        Number.isSafeInteger(max_tokens) && max_tokens > 0
          ? max_tokens
          : undefined,
      presence_penalty:
        presence_penalty >= -2 && presence_penalty <= 2
          ? presence_penalty
          : undefined,
      frequency_penalty:
        frequency_penalty >= -2 && frequency_penalty <= 2
          ? frequency_penalty
          : undefined,
      user: this.getAttribute('user'),
    };
    this.systemMessage = this.getAttribute('system_message', '');
    this.makeChildWidgets();
  }

  render(parent: Node, nextSibling: Node | null) {
    if (!$tw.browser || !parent) {
      return;
    }
    this.execute();
    const conversations = $tw.utils.domMaker('div', {
      class: this.scroll ? 'conversations-scroll' : 'conversations',
    });
    const container = $tw.utils.domMaker(this.containerNodeTag, {
      class: `gk0wk-chatgpt-container ${this.containerNodeClass}`,
      children: [conversations],
    });
    parent.insertBefore(container, nextSibling);
    this.domNodes.push(container);
    try {
      const zh = isChinese();
      const { getHistory, setHistory } = historyManager(this.historyTiddler);
      // 聊天机制
      let fillChatInput: ((user: string) => void) | undefined;
      if (!this.readonly) {
        const chatInput = $tw.utils.domMaker('input', {
          class: 'chat-input',
          attributes: {
            type: 'text',
            placeholder: zh ? '输入一个问题...' : 'Ask a question...',
          },
        });
        fillChatInput = (user: string) => (chatInput.value = user);
        const chatButton = $tw.utils.domMaker('button', {
          class: 'chat-button',
          innerHTML: this.chatButtonText,
          attributes: {
            title: zh ? '进行对话' : 'Chat',
          },
        });
        container.appendChild(
          $tw.utils.domMaker('div', {
            class: 'chat-box',
            children: [chatInput, chatButton],
          }),
        );

        // 会话接口
        let apiLock = false;
        const createChat = async (event: Event) => {
          // 锁与参数解析
          if (apiLock) {
            return;
          }
          const apiKey = $tw.wiki
            .getTiddlerText('$:/plugins/Gk0Wk/chat-gpt/openai-api-key', '')
            .trim();
          if (!apiKey) {
            return;
          }
          const input = chatInput.value.trim();
          if (!input) {
            return;
          }
          chatInput.value = '';
          apiLock = true;
          chatButton.disabled = true;

          // 创建 DOM
          const { conversation, answerBox, printError } =
            renderChatingConversation(zh, input, conversations);
          conversations.appendChild(conversation);

          // 流式调用，需要用到魔改的EventSource
          try {
            const messages: any[] = [];
            if (this.systemMessage) {
              messages.push({
                role: 'system',
                content: this.systemMessage,
              });
            }
            messages.push({
              role: 'user',
              content: input,
            });
            let answer = '';
            let id = '';
            let created = 0;
            const ctrl = new AbortController();
            let url = $tw.wiki
              .getTiddlerText(
                '$:/plugins/Gk0Wk/chat-gpt/openai-api-entrance',
                'https://api.openai.com/v1',
              )
              .trim();
            if (url.endsWith('/')) {
              url = url.slice(0, -1);
            }
            await fetchEventSource(`${url}/chat/completions`, {
              method: 'POST',
              signal: ctrl.signal,
              body: JSON.stringify({
                ...this.chatGPTOptions,
                messages,
                stream: true,
              }),
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              async onopen(response) {
                if (
                  !response.ok ||
                  response.headers.get('content-type') !==
                    'text/event-stream' ||
                  response.status !== 200
                ) {
                  ctrl.abort();
                  printError(await response.text());
                  apiLock = false;
                  chatButton.disabled = false;
                }
              },
              onmessage: ({ data }) => {
                try {
                  if (data === '[DONE]') {
                    const newHistory = {
                      id,
                      created,
                      assistant: answer,
                      user: input,
                    };
                    setHistory([...getHistory(), newHistory]);
                    conversations.removeChild(conversation);
                    const resultConversation = renderConversation(
                      newHistory,
                      zh,
                      this.editButtonText,
                      this.deleteButtonText,
                      fillChatInput,
                      () => {
                        conversations.removeChild(resultConversation);
                        setHistory(
                          getHistory().filter(({ id }) => id !== newHistory.id),
                        );
                      },
                    );
                    conversations.appendChild(resultConversation);

                    // 发送相关事件
                    this.setVariable('output-text', answer);
                    this.invokeAction?.(this, event as any);
                    const theEvent = {
                      event,
                      type: 'chat-gpt',
                      name: 'completion-finish',
                      paramObject: {
                        ...newHistory,
                        created: new Date(newHistory.created * 1000),
                      },
                      widget: this,
                      historyTiddler: this.historyTiddler,
                    };
                    this.dispatchEvent(theEvent);
                    $tw.hooks.invokeHook('chat-gpt', theEvent);

                    ctrl.abort();
                    apiLock = false;
                    chatButton.disabled = false;
                  } else {
                    const obj = JSON.parse(data);
                    // eslint-disable-next-line prefer-destructuring
                    id = obj.id;
                    // eslint-disable-next-line prefer-destructuring
                    created = obj.created;
                    answer = `${answer}${
                      obj.choices[0].delta.content ?? ''
                    }`.trimStart();
                    answerBox.innerText = `${answer}█`;
                  }
                } catch (e) {
                  console.error(e);
                  printError(String(e));
                  ctrl.abort();
                  apiLock = false;
                  chatButton.disabled = false;
                }
                conversations.scrollTop = conversations.scrollHeight;
              },
              onerror: e => {
                console.error(e);
                printError(String(e));
                ctrl.abort();
                apiLock = false;
                chatButton.disabled = false;
              },
            });
          } catch (e) {
            console.error(e);
            printError(String(e));
          }
        };

        chatButton.onclick = createChat;
        chatInput.addEventListener('keydown', function (event) {
          if (event.code === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            createChat(event);
          }
        });
      }

      // 历史对话
      for (const conversation of getHistory()) {
        const resultConversation = renderConversation(
          conversation,
          zh,
          this.editButtonText,
          this.deleteButtonText,
          fillChatInput,
          this.readonly
            ? undefined
            : () => {
                conversations.removeChild(resultConversation);
                setHistory(
                  getHistory().filter(({ id }) => id !== conversation.id),
                );
              },
        );
        conversations.appendChild(resultConversation);
      }
    } catch (e) {
      console.error(e);
      container.textContent = String(e);
    }
  }

  refresh(changedTiddlers: IChangedTiddlers) {
    const changedAttributes = this.computeAttributes();
    if ($tw.utils.count(changedAttributes) > 0) {
      this.refreshSelf();
      return true;
    } else if (changedTiddlers[this.historyTiddler]?.deleted) {
      this.refreshSelf();
      return true;
    }
    return this.refreshChildren(changedTiddlers);
  }
}

exports['chat-gpt'] = ChatGPTWidget;
