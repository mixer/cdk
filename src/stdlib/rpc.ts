import { EventEmitter } from 'eventemitter3';

export type RPCMessage<T> = IRPCMethod<T> | IRPCReply<T>;

export interface IRPCMethod<T> {
  type: 'method';
  id: number;
  method: string;
  discard?: boolean;
  params: T;
}

export interface IRPCReply<T> {
  type: 'reply';
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
    path?: string[];
  };
}

/**
 * An RPCError can be thrown in socket.call() if bad input is
 * passed to the service. See the Interactive protocol doc for an enumaration
 * of codes and messages: https://dev.mixer.com/reference/interactive/protocol/protocol.pdf
 */
export class RPCError extends Error {
  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly path?: string[],
  ) {
    super(`Error #${code}: ${message}`);
  }
}

export function objToError(obj: { code: number; message: string; path?: string[] }) {
  return new RPCError(obj.code, obj.message, obj.path);
}

/**
 * Primitive postMessage based RPC for the controls to interact with the
 * parent frame.
 */
export class RPC extends EventEmitter {
  private static origin = '*'; // todo(connor4312): do we need to restrict this?
  private callCounter = 0;
  private calls: {
    [id: number]: (err: null | RPCError, result: any) => void;
  } = Object.create(null);

  constructor(private readonly target: Window) {
    super();
    window.addEventListener('message', this.listener);
    this.call('ready', {}, false);
  }

  /**
   * Attaches a method callable by the other window, to this one.
   */
  public expose<T>(method: string, handler: (params: T) => Promise<any> | any) {
    this.on(method, (data: IRPCMethod<T>) => {
      if (data.discard) {
        handler(data.params);
        return;
      }

      Promise.resolve(handler(data.params)).then(result => {
        // tslint:disable-line
        this.post({
          type: 'reply',
          id: data.id,
          result,
        });
      });
    });
  }

  /**
   * Makes an RPC call out to the target window.
   */
  public call(method: string, params: object, waitForReply: boolean): Promise<object> | void {
    const id = this.callCounter++;
    this.post({ type: 'method', id, params, method, discard: !waitForReply });
    if (!waitForReply) {
      return;
    }

    return new Promise((resolve, reject) => {
      this.calls[id] = (err, res) => {
        if (err) {
          reject(err);
        } else {
          resolve(res);
        }
      };
    });
  }

  /**
   * Tears down resources associated with the RPC client.
   */
  public destroy() {
    window.removeEventListener('message', this.listener);
  }

  private handleReply(packet: IRPCReply<any>) {
    const handler = this.calls[packet.id];
    if (!handler) {
      return;
    }

    if (packet.error) {
      handler(objToError(packet.error), null);
    } else {
      handler(null, packet.result);
    }

    delete this.calls[packet.id];
  }

  private post(message: RPCMessage<any>) {
    this.target.postMessage(message, RPC.origin);
  }

  private listener = (ev: MessageEvent) => {
    const packet: RPCMessage<any> = ev.data;
    switch (packet.type) {
      case 'method':
        this.emit(packet.method, packet);
        break;
      case 'reply':
        this.handleReply(packet);
        break;
      default:
      // Ignore. We can get postmessage from other sources (webpack in
      // development), we don't want to error.
    }
  };
}
