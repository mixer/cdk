import { EventEmitter } from 'eventemitter3';
import { stringify } from 'querystring';

import { RPC, RPCError } from '../stdlib/rpc';
import { ErrorCode, IStateDump } from '../stdlib/typings';

/**
 * This is file contains a websocket implementation to coordinate messaging
 * between the Interactive iframe and the Interactive service.
 */

const enum State {
  Loading,
  Ready,
}

/**
 * IConnectionOptions is passed into Participant.connect()
 */
export interface IConnectionOptions {
  socketAddress: string;
  contentAddress: string;
  xAuthUser?: object;
}

/**
 * Participant is a bridge between the Interactive service and an iframe that
 * shows custom controls. It proxies calls between them and emits events
 * when states change.
 */
export class Participant extends EventEmitter {
  /**
   * Interactive protocol version this participant implements.
   */
  public static readonly protocolVersion = '2.0';

  /**
   * Websocket connecte
   */
  private websocket: WebSocket;

  /**
   * RPC wrapper around the controls.
   */
  private rpc: RPC;

  /**
   * Buffer of packets from Interactive to replace once the controls load.
   * As soon as we connect to interactive it'll send the initial state
   * messages, but there's a good chance we won't have loaded the controls
   * by that time, so buffer 'em until the controls say they're ready.
   */
  private replayBuffer: string[] = [];

  /**
   * Controls state.
   */
  private state = State.Loading;

  constructor(private readonly frame: HTMLIFrameElement) {
    super();
    this.rpc = new RPC(frame.contentWindow);
  }

  /**
   * Creates a connection to the given Interactive address.
   */
  public connect(options: IConnectionOptions): this {
    const qs = stringify({
      // cache bust the iframe to ensure that it reloads
      // whenever we get a new connection.
      bustCache: Date.now(),
      'x-auth-user': options.xAuthUser ? JSON.stringify(options.xAuthUser) : undefined,
    });

    const ws = (this.websocket = new WebSocket(`${options.socketAddress}&${qs}`));
    this.frame.src = `${options.contentAddress}&${qs}`;

    this.rpc.expose('sendInteractivePacket', data => {
      ws.send({ ...data, discard: true });
    });

    this.rpc.expose('controlsReady', () => {
      this.replayBuffer.forEach(p => {
        this.sendInteractive(p);
      });
      this.replayBuffer = [];
      this.state = State.Ready;
      this.emit('loaded');
    });

    ws.addEventListener('message', data => {
      if (this.state !== State.Ready) {
        this.replayBuffer.push(data.data);
      } else {
        this.sendInteractive(data.data);
      }
    });

    ws.addEventListener('close', ev => {
      this.emit('close', ev.code, ev);
    });

    ws.addEventListener('error', ev => {
      this.emit('close', -1, ev);
    });

    return this;
  }

  public dumpState(): Promise<IStateDump | undefined> {
    return this.rpc.call<IStateDump>('dumpState', {}, true).catch(err => {
      if (err instanceof RPCError && err.code === ErrorCode.AppBadMethod) {
        return undefined; // controls don't expose dumpState, sad but we'll hide our sadness
      }

      throw new err();
    });
  }

  /**
   * Closes the participant connection and frees resources.
   */
  public destroy() {
    this.rpc.destroy();

    try {
      this.websocket.close();
    } catch (_e) {
      // Ignored. Sockets can be fussy if they're closed at
      // the wrong time but it doesn't cause issues.
    }
  }

  /**
   * A close event is emitted, with the error code, if we fail to connect
   * to Interactive or the connection is lost, a code of -1 will be given.
   */
  public on(event: 'close', handler: (code: number, ev: Event) => void): this;

  /**
   * Transmit is fired whenever we proxy an event from the Interactive
   * socket to the controls.
   */
  public on(event: 'transmit', handler: (data: object) => void): this;

  /**
   * Loaded is fired when the contained iframe loads.
   */
  public on(event: 'loaded', handler: () => void): this;
  public on(event: string, handler: (...args: any[]) => void): this {
    super.on(event, handler);
    return this;
  }

  /**
   * sendInteractive broadcasts the interactive payload down to the controls,
   * and emits a `transmit` event.
   */
  private sendInteractive(data: string) {
    const parsed = JSON.parse(data);
    this.rpc.call('recieveInteractivePacket', parsed, false);
    this.emit('transmit', parsed);
  }
}
