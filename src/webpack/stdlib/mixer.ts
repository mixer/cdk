import { EventEmitter } from 'eventemitter3';

/**
 * Layout contains type definitions for various layout primitives.
 */
export namespace Layout {
  /**
   * A grid placement represents a placement of a control within a scene using
   * the fixed-grid display mode.
   *
   * A control can have many grid placements where each placement is used
   * within a different interactive grid.
   */
  export interface IGridPlacement {
    /**
     * The Size of the grid this placement is for.
     */
    size: 'large' | 'medium' | 'small';
    /**
     * The width of this control within the grid.
     */
    width: number;
    /**
     * The height of this control within the grid.
     */
    height: number;
    /**
     * The X position of this control within the grid.
     */
    x: number;
    /**
     * The Y position of this control within the grid.
     */
    y: number;
  }

  /**
   * IGridDefinition defines the grid's physical screen size. This is used
   * internally in the fixed-grid display mode. This is not configurable.
   */
  export interface IGridDefinition {
    size: 'large' | 'medium' | 'small';
    width: number;
    height: number;
  }

  /**
   * Offers constant information values to use in an application.
   */
  export const gridLayouts: ReadonlyArray<Readonly<IGridDefinition>> = [
    {
      size: 'large',
      width: 80,
      height: 20,
    },
    {
      size: 'medium',
      width: 45,
      height: 25,
    },
    {
      size: 'small',
      width: 30,
      height: 40,
    },
  ];

  /**
   * IControlChild is passed into the IContainer to direct Mixer to place a
   * control at the given position.
   */
  export interface IControlChild {
    controlID: string;
  }

  /**
   * IContainer is an element that contains controls in the `flex` layout
   * mode. It can contain child containers or IDs of controls, as well as
   * free-form CSS styles styles or media queries to be passed into Radium
   * {@link http://formidable.com/open-source/radium/}. For example:
   *
   * ```
   * {
   *   "sceneID": "lobby",
   *   "containers": [
   *     {
   *       "children": ['video'],
   *       "styles": { "flexGrow": 1 }
   *     },
   *     {
   *       "children": [{ controlID: "enter_button" }],
   *       "styles": {
   *         "display": "flex",
   *         "justifyContent": "center",
   *         "alignItems": "center"
   *       }
   *     }
   *   ]
   * }
   * ```
   */
  export class IContainer {
    public children?: (IContainer | IControlChild | 'video')[];
    public styles?: { [key: string]: string | number };
  }
}

/**
 * IControl is some kind of control on the protocol. The controlID is
 * unique in the scene.
 *
 * This is a minimal interface: control types may extend this interface
 * and define their own properties.
 */
export interface IControl {
  /**
   * Unique ID of the control.
   */
  readonly controlID: string;
  /**
   * Control kind.
   */
  readonly kind: string;

  /**
   * List of display grids using the legacy-grid layout mode.
   */
  readonly grids?: Layout.IGridPlacement[];

  /**
   * Styles when using the `flex` display mode. See Layout.IContainer for
   * a description and brief example. These are passed into Radium
   * {@link http://formidable.com/open-source/radium/}.
   */
  readonly styles?: { [key: string]: string | number };
}

/**
 * IScene is a scene on the protocol. It can contain many controls. The
 * sceneID is globally unique.
 *
 * This is a minimal interface: scenes may extend this interface
 * and define their own properties.
 */
export interface IScene {
  /**
   * Unique ID of the scene.
   */
  readonly sceneID: string;

  /**
   * A list of controls the scene contains.
   */
  readonly controls: IControl[];

  /**
   * A list of containers when using the "flex" display mode.
   */
  readonly containers?: Layout.IContainer[];
}

/**
 * IGroup is a groups of participants on the protocol. Groups are assigned
 * to a single scene.
 *
 * This is a minimal interface: integrations may extend this interface
 * and define their own properties.
 */
export interface IGroup {
  readonly sceneID: string;
  readonly groupID: string;
}

/**
 * ISceneCreate is an event triggered when a new scene is created.
 */
export interface ISceneCreate {
  readonly scenes: IScene[];
}

/**
 * ISceneUpdate is an event triggered when a an existing scene is updated.
 */
export interface ISceneUpdate {
  readonly scenes: IScene[];
}

/**
 * ISceneDelete is an event triggered when a scene is deleted.
 */
export interface ISceneDelete {
  readonly sceneID: string;
  readonly reassignSceneID: string;
}

/**
 * IControlChange is fired when new controls are created, updated, or
 * deleted in the scene.
 */
export interface IControlChange {
  readonly sceneID: string;
  readonly controls: IControl[];
}

/**
 * IGroupDelete is an event triggered when a group is deleted.
 */
export interface IGroupDelete {
  readonly groupID: string;
  readonly reassignGroupID: string;
}

/**
 * IGroupCreate is fired when new groups are created.
 */
export interface IGroupCreate {
  readonly groups: IGroup[];
}

/**
 * IGroupUpdate is fired when groups are updated.
 */
export interface IGroupUpdate {
  readonly groups: IGroup[];
}

/**
 * IParticipant represents a user in Interactive. As far as controls are
 * concerned, this means only the current user.
 *
 * This is a minimal interface: integrations may extend this interface
 * and define their own properties.
 */
export interface IParticipant {
  readonly sessionID: string;
  readonly userID: number;
  readonly username: string;
  readonly level: number;
  readonly lastInputAt: number; // milliseconds timestamp
  readonly connectedAt: number; // milliseconds timestamp
  readonly disabled: boolean;
  readonly groupID: string;
}

/**
 * IParticipantUpdate is fired when the participant's data is updated,
 * and once when first connecting.
 */
export interface IParticipantUpdate {
  readonly participants: [IParticipant];
}

/**
 * IInput is an input event fired on a control. This is a minimal
 * interface; custom properties may be added and they will be passed
 * through to the game client.
 */
export interface IInput {
  controlID: string;
  event: string;
}

/**
 * IReady is sent when when the integration indicates that it has set up
 * and is ready to accept input.
 */
export interface IReady {
  readonly isReady: boolean;
}

/**
 * An InteractiveError can be thrown in socket.call() if bad input is
 * passed to the service. See the Interactive protocol doc for an enumaration
 * of codes and messages: https://dev.mixer.com/reference/interactive/protocol/protocol.pdf
 */
export class InteractiveError extends Error {
  constructor(
    public readonly code: number,
    public readonly message: string,
    public readonly path?: string[],
  ) {
    super(`Error #${code}: ${message}`);
  }
}

function objToError(obj: { code: number; message: string; path?: string[] }) {
  return new InteractiveError(obj.code, obj.message, obj.path);
}

type RPCMessage<T> = IRPCMethod<T> | IRPCReply<T>;

interface IRPCMethod<T> {
  type: 'method';
  id: number;
  method: string;
  discard?: boolean;
  params: T;
}

interface IRPCReply<T> {
  type: 'reply';
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
    path?: string[];
  };
}

// these are the same right now, but may diverge:
interface IInteractiveRPCMethod<T> extends IRPCMethod<T> {} // tslint:disable-line
interface IInteractiveRPCReply<T> extends IRPCReply<T> {} // tslint:disable-line

/**
 * Primitive postMessage based RPC for the controls to interact with the
 * parent frame.
 */
class RPC extends EventEmitter {
  private static origin = '*'; // todo(connor4312): do we need to restrict this?
  private callCounter = 0;
  private calls: {
    [id: number]: (err: null | InteractiveError, result: any) => void;
  } = Object.create(null);

  constructor() {
    super();

    window.addEventListener('message', ev => {
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
    });

    this.call('ready', {}, false);
  }

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
    window.top.postMessage(message, RPC.origin);
  }
}

const rpc = new RPC();

/**
 * Attaches a handler function that will be triggered when the call comes in.
 */
export class Socket extends EventEmitter {
  constructor() {
    super();
    rpc.expose('recieveInteractivePacket', (data: IInteractiveRPCMethod<any>) => {
      this.emit(data.method, data.params);
    });
  }

  public on(event: 'onParticipantJoin', handler: (ev: IParticipantUpdate) => void): this;
  public on(event: 'onParticipantUpdate', handler: (ev: IParticipantUpdate) => void): this;
  public on(event: 'onGroupCreate', handler: (ev: IGroupCreate) => void): this;
  public on(event: 'onGroupDelete', handler: (ev: IGroupDelete) => void): this;
  public on(event: 'onGroupUpdate', handler: (ev: IGroupUpdate) => void): this;
  public on(event: 'onSceneCreate', handler: (ev: ISceneCreate) => void): this;
  public on(event: 'onSceneDelete', handler: (ev: ISceneDelete) => void): this;
  public on(event: 'onSceneUpdate', handler: (ev: ISceneUpdate) => void): this;
  public on(event: 'onControlCreate', handler: (ev: IControlChange) => void): this;
  public on(event: 'onControlDelete', handler: (ev: IControlChange) => void): this;
  public on(event: 'onControlUpdate', handler: (ev: IControlChange) => void): this;
  public on(event: 'onReady', handler: (ev: IReady) => void): this;
  public on(event: string, handler: (...args: any[]) => void): this {
    super.on(event, handler);
    return this;
  }

  public call(method: 'giveInput', params: IInput): Promise<object>;
  public call(method: string, params: object): Promise<object>;
  public call(method: string, params: object, waitForReply: true): Promise<object>;
  public call(method: string, params: object, waitForReply: false): void;
  public call(
    method: string,
    params: object,
    waitForReply: boolean = true,
  ): Promise<object> | void {
    const reply = rpc.call(
      'sendInteractivePacket',
      {
        method,
        params,
      },
      waitForReply,
    );
    if (!reply) {
      return;
    }

    return reply.then((result: IInteractiveRPCReply<any>) => {
      if (result.error) {
        throw objToError(result.error);
      }

      return result.result;
    });
  }
}

/**
 * IVideoPositionOptions are passed into display.moveVideo() to change
 * where the video is shown on the screen.
 */
export interface IVideoPositionOptions {
  /**
   * Position of the video on screen as in pixels..
   * If omitted, it's not modified.
   */
  x?: number;

  /**
   * Position of the video on screen as in pixels.
   * If omitted, it's not modified.
   */
  y?: number;

  /**
   * Width of the video on screen as in pixels.
   * If omitted, it's not modified.
   */
  width?: number;

  /**
   * Height of the video on screen as in pixels.
   * If omitted, it's not modified.
   */
  height?: number;

  /**
   * Duration of the movement easing in milliseconds. Defaults to 0.
   */
  duration?: number;

  /**
   * CSS easing function. Defaults to 'linear'.
   * @see https://developer.mozilla.org/en-US/docs/Web/CSS/transition-timing-function
   */
  easing?: string;
}

/**
 * Display modified the display of interactive controls.
 */
export class Display {
  /**
   * Hides the controls and displays a loading spinner, optionally
   * with a custom message. This is useful for transitioning. If called
   * while the controls are already minimized, it will update the message.
   */
  public minimize(message?: string): void {
    rpc.call('minimize', { message }, false);
  }

  /**
   * Restores previously minimize()'d controls.
   */
  public maximize(): void {
    rpc.call('maximize', {}, false);
  }

  /**
   * Moves the position of the video on the screen.
   */
  public moveVideo(options: IVideoPositionOptions): void {
    rpc.call('moveVideo', options, false);
  }
}

/**
 * Returns the fully qualified URL to a static project asset, from the
 * `src/static` folder.
 */
export function asset(...path: string[]): string {
  // For now this is fairly stub-ish, it serves as an injection point if we
  // decide to change how assets are delivered in the future.
  return `./${path.map(segment => segment.replace(/^\/+|\/+$/, '')).join('/')}`;
}

/**
 * IPackageConfig describes the configuration you write in the "interactive"
 * section of your package.json. It's injected automatically when your
 * controls boot.
 */
export interface IPackageConfig {
  display: {
    mode: 'fixed-grid' | 'flex';
  };
}

export const packageConfig: IPackageConfig = <any>null; // overridden by the MixerPlugin
export const socket = new Socket();
export const display = new Display();
