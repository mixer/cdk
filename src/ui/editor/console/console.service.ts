import { Injectable } from '@angular/core';
import { IRPCMethod, IRPCReply, RPC } from '@mcph/miix-std/dist/internal';
import { BehaviorSubject } from 'rxjs/Rx';

import { Observable } from 'rxjs/Observable';
import { ErrorMessage, IErrorMessage } from './messages/error-message';
import { IMessage, Message } from './messages/message';
import { MethodMessage } from './messages/method-message';
import { ReplyMessage } from './messages/reply-message';

/**
 * IFilter can be passed to the ConsoleService to configure which messages
 * are displayed.
 */
export interface IFilter {
  /**
   * Map of message kinds, setting one to `false` will hide it.
   */
  kinds?: { [key in keyof typeof Message]?: boolean };
  /**
   * Pattern to match against in the message text. Can be wrapped in slashes
   * to denote a regex.
   */
  pattern?: string;
}

export interface IMessageEntry {
  /**
   * The source message.
   */
  message: IMessage;
  /**
   * The time when the message was posted.
   */
  createdAt: Date;
  /**
   * Whether the user has seen this message yet (reset with `markRead()`)
   */
  hasSeen: boolean;
}

/**
 * The ConsoleService stores a log of data sent and received from the iframed
 * controls.
 */
@Injectable()
export class ConsoleService {
  /**
   * Max number of messages to display in the console.
   */
  public static maxMessages = 500;

  /**
   * Observable store of console messages.
   */
  private readonly messages = new BehaviorSubject<Readonly<IMessageEntry>[]>([]);

  /**
   * Currently connected RPC instance.
   */
  private rpc: RPC;

  /**
   * callToIframe records a call made into the iframed controls.
   */
  public callToIframe(message: IRPCMethod<any>) {
    this.push(new MethodMessage(Message.SentMethod, message));
  }

  /**
   * callFromIframe records a method call that the iframe made against us.
   */
  public callFromIframe(message: IRPCMethod<any>) {
    this.push(new MethodMessage(Message.ReceivedMethod, message));
  }

  /**
   * replyToIframe records a reply made into the iframed controls.
   */
  public replyToIframe(message: IRPCReply<any>) {
    this.push(new ReplyMessage(Message.SentReply, message));
  }

  /**
   * replyFromIframe records a method reply that the iframe made against us.
   */
  public replyFromIframe(message: IRPCReply<any>) {
    this.push(new ReplyMessage(Message.ReceivedReply, message));
  }

  /**
   * errorFromIframe records an error message the iframe sent to us.
   */
  public errorFromIframe(error: IErrorMessage) {
    this.push(new ErrorMessage(error));
  }

  /**
   * read returns a feed of messages filtered with the provided options.
   */
  public read(filter: IFilter = {}): Observable<IMessageEntry[]> {
    const test = this.test(filter);
    return this.messages.map(messages => messages.filter(test));
  }

  /**
   * Returns the number of messages omitted by the provided filter.
   */
  public omitted(filter: IFilter = {}): Observable<number> {
    const test = this.test(filter);
    return this.messages.map(messages =>
      messages.reduce((total, m) => total + (test(m) ? 0 : 1), 0),
    );
  }

  /**
   * Wipes all messages from storage.
   */
  public clear() {
    this.messages.next([]);
  }

  /**
   * Marks all messages as having been read.
   */
  public markRead() {
    this.messages.next(this.messages.getValue().map(m => ({ ...m, hasSeen: true })));
  }

  /**
   * Sends a command to the frame.
   */
  public run(method: string, params: any) {
    this.rpc.call(method, params, true).catch(() => undefined);
  }

  /**
   * Binds the console to read data from the RPC socket.
   */
  public bindToRPC(rpc: RPC) {
    this.rpc = rpc;

    rpc.on('recvMethod', packet => {
      if (packet.method === 'ready') {
        this.clear();
      }

      this.callFromIframe(packet);
    });
    rpc.on('recvReply', packet => {
      this.replyFromIframe(packet);
    });
    rpc.on('sendMethod', packet => {
      this.callToIframe(packet);
    });
    rpc.on('sendReply', packet => {
      this.replyToIframe(packet);
    });
  }

  /**
   * Tries to return the given message's paired friend. A method call if the
   * message is a reply, a method response if it's a call.
   */
  public getPairMessage(message: IMessage): Readonly<IMessageEntry> | undefined {
    const available = this.messages.getValue();
    if (message.inReplyTo) {
      return available.find(m => m.message.id === message.inReplyTo);
    } else {
      return available.find(m => m.message.inReplyTo === message.id);
    }
  }

  /**
   * A utility function that can be used in Angular *ngFor templates to
   * track messages.
   */
  public trackBy = (message: IMessage) => message.id;

  /**
   * Adds the message to the console output.
   */
  private push(message: IMessage) {
    let messages = this.messages.getValue();

    // not pure, but the array isn't exposed externally, so it's fine.
    messages.push({
      message,
      hasSeen: false,
      createdAt: new Date(),
    });

    if (messages.length > ConsoleService.maxMessages) {
      messages = messages.slice(-Math.round(ConsoleService.maxMessages * 0.75));
    }

    this.messages.next(messages);
  }

  /**
   * Returns a function to test whether a message passes the filter.
   */
  private test(filter: IFilter): (message: IMessageEntry) => boolean {
    let re: RegExp | undefined;
    if (filter.pattern) {
      // Regexeption: match a /re/x pattern, body in group 1, flags in 2. BWAAAAA
      const exec = /^\/(.+)\/([a-z]+)?$/.exec(filter.pattern);
      if (exec) {
        re = new RegExp(exec[1], exec[2]);
      }
    }

    return ({ message }) => {
      if (re) {
        if (!re.test(message.text)) {
          return false;
        }
      } else if (filter.pattern && !message.text.includes(filter.pattern)) {
        return false;
      }

      if (filter.kinds && (<any>filter.kinds)[message.kind] === false) {
        return false;
      }

      return true;
    };
  }
}
