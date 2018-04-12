import { Injectable } from '@angular/core';
import { RPC } from '@mcph/miix-std/dist/internal';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, map } from 'rxjs/operators';

import { Observable } from 'rxjs/Observable';
import * as forRoot from '../bedrock.reducers';
import { AppendMessage, Clear, IFilter, IMessageEntry } from './controls-console.actions';
import { selectMessages } from './controls-console.reducer';
import { LogMessage } from './messages/log-message';
import { IMessage, Message } from './messages/message';
import { MethodMessage } from './messages/method-message';
import { ReplyMessage } from './messages/reply-message';
/**
 * The ConsoleService stores a log of data sent and received from the iframed
 * controls.
 */
@Injectable()
export class ControlsRemoteConsoleService {
  /**
   * Observable of all messages.
   */
  private readonly messages = this.store.select(selectMessages).pipe(distinctUntilChanged());

  constructor(private readonly store: Store<forRoot.IState>) {}

  /**
   * read returns a feed of messages filtered with the provided options.
   */
  public filter(filter: IFilter): Observable<IMessageEntry[]> {
    const test = this.test(filter);
    return this.messages.pipe(map(messages => messages.filter(test)));
  }

  /**
   * Returns the number of messages omitted by the provided filter.
   */
  public countOmitted(filter: IFilter): Observable<number> {
    const test = this.test(filter);
    return this.messages.pipe(
      map(messages => messages.reduce((total, m) => total + (test(m) ? 0 : 1), 0)),
    );
  }

  /**
   * Returns whether there are any messages which pass the provided filter.
   */
  public some(filter: IFilter): Observable<boolean> {
    const test = this.test(filter);
    return this.messages.pipe(map(messages => messages.some(test)));
  }

  /**
   * Returns whether there's any unread error in the console.
   */
  public hasUnreadError(): Observable<boolean> {
    return this.messages.pipe(
      map(messages => {
        for (let i = messages.length - 1; i >= 0 && !messages[i].hasSeen; i--) {
          const message = messages[i].message;
          if (message instanceof LogMessage && message.level === 'error') {
            return true;
          }
        }

        return false;
      }),
    );
  }

  /**
   * Tries to return the given message's paired friend. A method call if the
   * message is a reply, a method response if it's a call.
   */
  public getPairMessage(message: IMessage): Observable<Readonly<IMessageEntry> | undefined> {
    return this.messages.pipe(
      map(available => {
        if (message.inReplyTo) {
          return available.find(m => m.message.id === message.inReplyTo);
        } else {
          return available.find(m => m.message.inReplyTo === message.id);
        }
      }),
    );
  }

  /**
   * A utility function that can be used in Angular *ngFor templates to
   * track messages.
   */
  public trackBy = (message: IMessage) => message.id;

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

    return ({ hasSeen, message }) => {
      if (filter.onlyUnread && hasSeen) {
        return false;
      }

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

/**
 * Reads from the RPC instance and appends to the controls console when data
 * is sent or received.
 */
export function bindToRPC(store: Store<forRoot.IState>, rpc: RPC) {
  rpc.on('recvMethod', packet => {
    switch (packet.method) {
      case 'ready':
        store.dispatch(new Clear());
        break;
      case 'log':
        store.dispatch(new AppendMessage(new LogMessage(packet.params)));
        break;
      default:
        store.dispatch(new AppendMessage(new MethodMessage(Message.ReceivedMethod, packet)));
    }
  });
  rpc.on('recvReply', packet => {
    store.dispatch(new AppendMessage(new ReplyMessage(Message.ReceivedReply, packet)));
  });
  rpc.on('sendMethod', packet => {
    store.dispatch(new AppendMessage(new MethodMessage(Message.SentMethod, packet)));
  });
  rpc.on('sendReply', packet => {
    store.dispatch(new AppendMessage(new ReplyMessage(Message.SentReply, packet)));
  });
}
