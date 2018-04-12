import * as hljs from 'highlight.js';
import * as JSON5 from 'json5';

/**
 * Message is an enum of the possible message types recorded in the logs.
 */
export enum Message {
  SentMethod,
  ReceivedMethod,
  SentReply,
  ReceivedReply,
  Log,
}

/**
 * IMessage defines a class of messages that can be printed to the console.
 * No, not that iMessage.
 */
export interface IMessage {
  /**
   * Unique ID for this message, used for `replyTo`.
   */
  readonly id: string;

  /**
   * Optionally, marks that this message is a reply to a previous message call.
   */
  readonly inReplyTo?: string;

  /**
   * The kind of this message.
   */
  readonly kind: Message;

  /**
   * The (short) text displayed on the command line. This may be truncated
   * if it's too long.
   */
  readonly text: string;

  /**
   * Called when the user expands this message's data, should return the
   * data appropriately. The return value will be treated as trusted HTML.
   */
  expansion(): string;
}

/**
 * Creates a short message line with its contents formatted as pretty JSON.
 * Limits the content to around `contentLimit`.
 */
export function messageLine(prefix: string, body: any, contentLimit: number = 150) {
  if (body == null) {
    return `${prefix}()`;
  }

  let text = JSON5.stringify(body);
  const sliced = text.length > contentLimit * 1.25;
  if (sliced) {
    text = text.slice(0, contentLimit);
  }

  return `${prefix}(${hljs.highlight('js', text).value}${sliced ? '...' : ')'}`;
}

/**
 * Truncates the line with ellipses if it's too far over
 * the target content length.
 */
export function truncateLine(text: string, contentLimit: number = 150): string {
  if (text.length > contentLimit * 1.25) {
    text = `${text.slice(0, contentLimit)}...`;
  }

  return text;
}
