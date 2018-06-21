import { IRPCReply } from '@mixer/cdk-std/dist/internal';
import * as hljs from 'highlight.js';
import * as JSON5 from 'json5';

import { IMessage, Message, messageLine } from './message';

/**
 * MethodMessage is a reply in response to a method to or from the iframe.
 */
export class ReplyMessage implements IMessage {
  /**
   * @override
   */
  public readonly text: string;

  /**
   * @override
   */
  public readonly id = String(Math.random());

  /**
   * @override
   */
  public readonly inReplyTo: string;

  constructor(public readonly kind: Message, private readonly data: IRPCReply<any>) {
    const otherKind = kind === Message.ReceivedReply ? Message.SentMethod : Message.ReceivedMethod;

    this.inReplyTo = `${otherKind}-${data.id}`;
    this.text = data.error
      ? messageLine('reply:error', data.error)
      : messageLine('reply:ok', data.result);
  }

  /**
   * @override
   */
  public expansion() {
    const { value } = hljs.highlight(
      'js',
      JSON5.stringify(
        {
          type: 'reply',
          result: this.data.result,
          error: this.data.error,
        },
        null,
        2,
      ),
    );

    return `<pre class="hljs"><code>${value}</pre></code>`;
  }
}
