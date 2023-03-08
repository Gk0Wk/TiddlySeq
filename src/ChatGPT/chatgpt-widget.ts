/* eslint-disable max-lines */
import { HTMLTags, IParseTreeNode, IWidgetInitialiseOptions } from 'tiddlywiki';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { widget as Widget } from '$:/core/modules/widgets/widget.js';
import './style.css';

const CHAT_COMPLETION_URL = 'https://api.openai.com/v1/chat/completions';

interface ChatHistory {
  id: string;
  created: number;
  user: string;
  assistant: string;
}

const isChinese = () =>
  $tw.wiki.getTiddler('$:/language')!.fields.text.includes('zh');

const renderConversation = ({ id, assistant, user }: ChatHistory) => {
  const container = $tw.utils.domMaker('div', {
    class: 'chatgpt-conversation',
    attributes: {
      'chatgpt-conversation': id,
    },
  });
  container.appendChild(
    $tw.utils.domMaker('div', {
      class: 'chatgpt-conversation-message chatgpt-conversation-user',
      children: [$tw.utils.domMaker('p', { text: user })],
    }),
  );
  container.appendChild(
    $tw.utils.domMaker('div', {
      class: 'chatgpt-conversation-message chatgpt-conversation-assistant',
      innerHTML: $tw.wiki.renderText(
        'text/html',
        'text/x-markdown' as any,
        assistant,
      ),
    }),
  );
  return container;
};

interface ChatGPTOptions {
  model: string;
  temperature: number;
  top_p: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  user: string;
}

class ChatGPTWidget extends Widget {
  private containerNodeTag: HTMLTags = 'div';

  private containerNodeClass: string = '';

  private tmpHistoryTiddler: string = `$:/temp/Gk0Wk/ChatGPT/history-${Date.now()}`;

  private historyTiddler: string = this.tmpHistoryTiddler;

  private chatButtonText: string = $tw.wiki.getTiddlerText(
    '$:/core/images/add-comment',
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
  }

  render(parent: Node, nextSibling: Node | null) {
    if (!$tw.browser) {
      return;
    }
    this.execute();
    const container = $tw.utils.domMaker(this.containerNodeTag, {
      class: `gk0wk-chatgpt-container ${this.containerNodeClass}`,
    });
    this.domNodes.push(container);
    try {
      const conversations = $tw.utils.domMaker('div', {
        class: this.scroll ? 'conversations-scroll' : 'conversations',
      });
      container.appendChild(conversations);
      if (!this.readonly) {
        const zh = isChinese();
        const chatBox = $tw.utils.domMaker('div', {
          class: 'chat-box',
        });
        const chatInput = $tw.utils.domMaker('input', {
          class: 'chat-input',
          attributes: {
            type: 'text',
            placeholder: zh ? '输入一个问题...' : 'Ask a question...',
          },
        });
        chatBox.appendChild(chatInput);
        const chatButton = $tw.utils.domMaker('button', {
          class: 'chat-button',
          innerHTML: this.chatButtonText,
        });
        let apiLock = false;
        const createChat = async () => {
          if (apiLock) {
            return;
          }
          apiLock = true;
          chatButton.disabled = true;
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

          const conversation = $tw.utils.domMaker('div', {
            class: 'chatgpt-conversation chatgpt-conversation-chating',
          });
          conversation.appendChild(
            $tw.utils.domMaker('div', {
              class: 'chatgpt-conversation-message chatgpt-conversation-user',
              children: [$tw.utils.domMaker('p', { text: input })],
            }),
          );
          const answerContainer = $tw.utils.domMaker('div', {
            class:
              'chatgpt-conversation-message chatgpt-conversation-assistant',
          });
          container.appendChild(answerContainer);
          const answerBox = $tw.utils.domMaker('pre', {
            text: zh ? '思考中...' : 'Thinking...',
            style: {
              background: 'transparent',
              marginTop: '0',
              marginBottom: '0',
              padding: '0',
            },
          });
          answerContainer.appendChild(
            $tw.utils.domMaker('p', {
              children: [answerBox],
            }),
          );
          conversation.appendChild(answerContainer);
          conversations.appendChild(conversation);
          const printError = (err: string) => {
            conversations.removeChild(answerBox);
            conversations.appendChild(
              $tw.utils.domMaker('div', {
                class: 'chatgpt-conversation chatgpt-conversation-error',
                children: [
                  $tw.utils.domMaker('div', {
                    class:
                      'chatgpt-conversation-message chatgpt-conversation-user',
                    children: [$tw.utils.domMaker('p', { text: input })],
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
            await fetchEventSource(CHAT_COMPLETION_URL, {
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
                    let history: ChatHistory[] = [];
                    try {
                      history = JSON.parse(
                        $tw.wiki.getTiddlerText(this.historyTiddler) || '[]',
                      );
                    } catch {}
                    history.push({
                      id,
                      created,
                      assistant: answer,
                      user: input,
                    });
                    $tw.wiki.addTiddler(
                      new $tw.Tiddler(
                        $tw.wiki.getTiddler(this.historyTiddler) ?? {},
                        {
                          title: this.historyTiddler,
                          text: JSON.stringify(history),
                        },
                      ),
                    );
                    conversations.removeChild(conversation);
                    conversations.appendChild(
                      renderConversation(history[history.length - 1]),
                    );
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
            createChat();
          }
        });
        chatBox.appendChild(chatButton);
        container.appendChild(chatBox);
      }

      // History
      let history: ChatHistory[] = [];
      try {
        history = JSON.parse(
          $tw.wiki.getTiddlerText(this.historyTiddler) || '[]',
        );
        console.log(this.historyTiddler);
      } catch {}
      for (const conversation of history) {
        conversations.appendChild(renderConversation(conversation));
      }
    } catch (e) {
      console.error(e);
      container.textContent = String(e);
    }
    parent.insertBefore(container, nextSibling);
  }

  refresh() {
    const changedAttributes = this.computeAttributes();
    if ($tw.utils.count(changedAttributes) > 0) {
      this.refreshSelf();
      return true;
    }
    return false;
  }
}

exports['chat-gpt'] = ChatGPTWidget;
/* eslint-enable max-lines */
