import { ILogEntry } from '@mixer/cdk-std/dist/internal';
import * as hljs from 'highlight.js';
import * as JSON5 from 'json5';
import { IMessage, Message } from './message';

interface IError {
  message: string;
  stack: string;
  metadata?: any;
}

function isErrorComponent(cmp: any): cmp is IError {
  return cmp && typeof cmp.message === 'string' && typeof cmp.stack === 'string';
}

function stringify(cmp: any) {
  if (isErrorComponent(cmp)) {
    return `Error: ${cmp.message}`;
  }

  if (cmp == null) {
    return `<span class="hljs-keyword">${cmp}</span>`;
  }

  switch (typeof cmp) {
    case 'string':
      return cmp;
    case 'number':
      return `<span class="hljs-number">${cmp}</span>`;
    case 'boolean':
      return `<span class="hljs-keyword">${cmp}</span>`;
    default:
      return hljs.highlight('js', JSON5.stringify(cmp)).value;
  }
}

/**
 * ErrorMessage is a special message that's used to format uncaught errors
 * from the controls.
 */
export class LogMessage implements IMessage {
  /**
   * @override
   */
  public readonly kind = Message.Log;

  /**
   * @override
   */
  public readonly text: string;

  /**
   * @override
   */
  public readonly id = String(Math.random());

  /**
   * The log level of this message.
   */
  public readonly level: string;

  private readonly error: IError | undefined;

  constructor({ level, params }: ILogEntry) {
    this.error = params.find(isErrorComponent);
    if (this.error && params.length > 1) {
      params = params.map(p => (p === this.error ? 'Error: ...' : p));
    }

    this.text = params.map(stringify).join(' ');
    this.level = level;
  }

  /**
   * @override
   */
  public expansion() {
    let content = `<pre><code class="hljs">${this.text}`;

    if (this.error) {
      content += `\n\n${this.error.stack}`;
      if (this.error.metadata) {
        const { value } = hljs.highlight('js', JSON5.stringify(this.error.metadata));
        content += `\n\n${value}`;
      }
      content += '</code></pre>';
    }

    return content;
  }
}
