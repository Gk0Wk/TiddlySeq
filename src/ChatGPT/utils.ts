export const CHAT_COMPLETION_URL = 'https://api.openai.com/v1/chat/completions';

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

export const renderConversation = ({ id, assistant, user }: ChatHistory) =>
  $tw.utils.domMaker('div', {
    class: 'chatgpt-conversation',
    attributes: {
      'chatgpt-conversation': id,
    },
    children: [
      $tw.utils.domMaker('div', {
        class: 'chatgpt-conversation-message chatgpt-conversation-user',
        children: [$tw.utils.domMaker('p', { text: user })],
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
        children: [$tw.utils.domMaker('p', { text: user })],
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
