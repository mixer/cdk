import { IRPCMethod } from '@mixer/cdk-std/dist/internal';
import * as hljs from 'highlight.js';
import * as JSON5 from 'json5';

import { IMessage, Message, messageLine } from './message';

/**
 * MethodMessage is a method call to or from the iframe.
 */
export class MethodMessage implements IMessage {
  /**
   * @override
   */
  public readonly text: string;

  /**
   * @override
   */
  public readonly id: string;

  constructor(public readonly kind: Message, private readonly data: IRPCMethod<any>) {
    this.id = `${this.kind}-${data.id}`;
    this.text = messageLine(data.method, data.params);
  }

  /**
   * @override
   */
  public expansion() {
    const { value } = hljs.highlight(
      'js',
      JSON5.stringify(
        {
          type: 'method',
          method: this.data.method,
          params: this.data.params,
        },
        null,
        2,
      ),
    );

    return `<pre><code class="hljs">${value}</pre></code>`;
  }
}
