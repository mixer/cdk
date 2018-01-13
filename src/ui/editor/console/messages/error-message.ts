import * as hljs from 'highlight.js';
import * as JSON5 from 'json5';
import { IMessage, Message } from './message';

export interface IErrorMessage {
  message: string;
  stack: string;
  metadata?: any;
}

/**
 * ErrorMessage is a special message that's used to format uncaught errors
 * from the controls.
 */
export class ErrorMessage implements IMessage {
  /**
   * @override
   */
  public readonly kind = Message.Error;

  /**
   * @override
   */
  public readonly text: string;

  /**
   * @override
   */
  public readonly id = String(Math.random());

  constructor(private readonly data: IErrorMessage) {
    this.text = data.message;
  }

  /**
   * @override
   */
  public expansion() {
    let output = `<pre><code class="hlsj">${this.data.stack}`;
    if (this.data.metadata) {
      const { value } = hljs.highlight('js', JSON5.stringify(this.data.metadata));
      output += `\n\n${value}`;
    }

    return `${output}</code></pre>`;
  }
}
