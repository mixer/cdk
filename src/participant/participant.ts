import { EventEmitter } from 'eventemitter3';
import { stringify } from 'querystring';

import { RPC, RPCError } from '../stdlib/rpc';
import { ErrorCode, ISettings, IStateDump, IVideoPositionOptions } from '../stdlib/typings';

/**
 * This is file contains a websocket implementation to coordinate messaging
 * between the Interactive iframe and the Interactive service.
 */

const enum State {
  Loading,
  Ready,
  Closing,
  Closed,
}

/**
 * IConnectionOptions is passed into Participant.connect()
 */
export interface IConnectionOptions {
  socketAddress: string;
  contentAddress: string;
  ugcAddress: string;
  xAuthUser?: {
    ID?: number;
    Username?: string;
    XP?: string;
  };
}

/**
 * ICloseData is fired in a `close` event.
 */
export interface ICloseData {
  /**
   * HTTP *or* websocket error code that caused the connection to fail.
   * -1 if we couldn't find an appropriate code.
   */
  code: number;

  /**
   * Associated developer-readable message.
   */
  message?: string;

  /**
   * Whether the socket was closed from a manual call to destroy())
   */
  expected: boolean;

  /**
   * Event that caused this error to happen. May be a websocket CloseEvent
   * if it was closed as a result of a websocket frame, but it can be a plain
   * Event if an error happened prior to us getting a socket connect going.
   */
  ev: CloseEvent | Event;
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
   * Buffer of packets from to replay once the controls load.
   * As soon as we connect to interactive it'll send the initial state
   * messages, but there's a good chance we won't have loaded the controls
   * by that time, so buffer 'em until the controls say they're ready.
   */
  private replayBuffer: { method: string; params: object }[] = [];

  /**
   * Controls state.
   */
  private state = State.Loading;

  constructor(private readonly frame: HTMLIFrameElement, settings: ISettings) {
    super();
    this.fireEvent('updateSettings', settings);
  }

  /**
   * Creates a connection to the given Interactive address.
   */
  public connect(options: IConnectionOptions): this {
    const qs = stringify({
      // cache bust the iframe to ensure that it reloads
      // whenever we get a new connection.
      bustCache: Date.now(),
      'x-protocol-version': Participant.protocolVersion,
      'x-auth-user': options.xAuthUser ? JSON.stringify(options.xAuthUser) : undefined,
    });

    const ws = (this.websocket = new WebSocket(`${options.socketAddress}&${qs}`));
    this.frame.src = `${options.contentAddress}&${qs}`;

    this.frame.addEventListener('load', this.onFrameLoad);

    ws.addEventListener('message', data => {
      this.sendInteractive(data.data);
    });

    ws.addEventListener('close', ev => {
      this.emit(
        'close',
        <ICloseData>{
          code: ev.code,
          message: ev.reason,
          expected: this.state === State.Closing,
          ev,
        },
      );

      this.state = State.Closed;
      this.destroy();
    });

    ws.addEventListener('error', ev => {
      this.handleWebsocketError(ev);
    });

    return this;
  }

  /**
   * Updates the controls' settings.
   */
  public updateSettings(settings: ISettings) {
    this.fireEvent('updateSettings', settings);
  }

  /**
   * Triggers a dump of state from the nested controls. Returns undefined if
   * the controls do not expose a dumpState method.
   */
  public dumpState(): Promise<IStateDump | undefined> {
    if (!this.rpc) {
      return Promise.resolve(undefined);
    }

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
    if (this.state < State.Closing) {
      this.state = State.Closing;
    }

    if (this.rpc) {
      this.rpc.destroy();
    }

    try {
      this.websocket.close();
    } catch (_e) {
      // Ignored. Sockets can be fussy if they're closed at
      // the wrong time but it doesn't cause issues.
    }
  }

  /**
   * A close event is emitted, with the error code, if we fail to connect
   * to Interactive or the connection is lost.
   */
  public on(event: 'close', handler: (reason: ICloseData) => void): this;

  /**
   * Transmit is fired whenever we proxy an event from the Interactive
   * socket to the controls.
   */
  public on(event: 'transmit', handler: (data: object) => void): this;

  /**
   * Called when the control asks to be maximized or minimized.
   */
  public on(event: 'maximize', handler: (isMaximized: boolean, message?: string) => void): this;

  /**
   * Called when the control asks to move the video position.
   */
  public on(event: 'moveVideo', handler: (options: IVideoPositionOptions) => void): this;

  /**
   * The unload event is fired when the user navigates away from the page.
   */
  public on(event: 'unload', handler: () => void): this;

  /**
   * Loaded is fired when the contained iframe loads and controls signal that
   * they're ready.
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
    this.fireEvent('recieveInteractivePacket', parsed);
    this.emit('transmit', parsed);
  }

  /**
   * attachListeners is called once the frame contents load to boot up
   * the RPC system.
   */
  private attachListeners() {
    this.rpc = new RPC(this.frame.contentWindow);

    this.rpc.expose('sendInteractivePacket', data => {
      this.websocket.send(JSON.stringify({
        ...data,
        type: 'method',
        discard: true
      }));
    });

    this.rpc.expose('controlsReady', () => {
      this.state = State.Ready;
      this.replayBuffer.forEach(p => {
        this.fireEvent(p.method, p.params);
      });
      this.replayBuffer = [];
      this.emit('loaded');
    });

    this.rpc.expose('maximize', (params: { maximized: boolean; message?: string }) => {
      this.emit('maximize', params.maximized, params.message);
    });

    this.rpc.expose('moveVideo', (options: IVideoPositionOptions) => {
      this.emit('moveVideo', options);
    });

    this.rpc.expose('unloading', () => {
      this.emit('unload');
    });
  }

  /**
   * handleWebsocketError is called when the websocket emits an `error`. This
   * is generally called when the connection is terminated before a socket
   * connection is established. We want to go back and get the error code/body.
   */
  private handleWebsocketError(ev: Event) {
    // tslint:disable-next-line
    fetch(this.websocket.url.replace(/^ws/, 'http'))
      .then(res => {
        return res.text().then(message => {
          this.emit('close', {
            message,
            code: res.status,
            expected: this.state === State.Closing,
            ev,
          });
        });
      })
      .catch(err => {
        this.emit('close', {
          code: -1,
          message: err.message,
          expected: this.state === State.Closing,
          ev,
        });
      })
      .then(() => {
        this.state = State.Closed;
        this.destroy();
      });
  }

  private fireEvent(method: string, params: object): void {
    if (this.state !== State.Ready) {
      this.replayBuffer.push({ method, params });
      return;
    }

    this.rpc.call(method, params, false);
  }

  /**
   * onFrameLoad is called once the iframe loads.
   */
  private onFrameLoad = () => {
    if (this.state === State.Loading) {
      this.attachListeners();
    }

    this.frame.removeEventListener('load', this.onFrameLoad);
  };
}
