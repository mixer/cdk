import { EventEmitter } from 'eventemitter3';

import { IPackageConfig } from '../metadata/package';
import { IRPCMethod, IRPCReply, objToError, RPC } from './rpc';
import { IVideoPositionOptions } from './typings';

export { RPCError } from './rpc';
export * from './typings';
export * from '../metadata/decoration';
export * from '../metadata/package';

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
    minWidth: number;
  }

  /**
   * Offers constant information values to use in an application.
   */
  export const gridLayouts: ReadonlyArray<Readonly<IGridDefinition>> = [
    {
      size: 'large',
      minWidth: 900,
      width: 80,
      height: 20,
    },
    {
      size: 'medium',
      minWidth: 540,
      width: 45,
      height: 25,
    },
    {
      size: 'small',
      minWidth: 0,
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
   * Represents a single CSS rule value. If a number is given it's assumed
   * that it's supposed to be in pixels ("px" will be appended to it).
   * See {@link IContainer} for details.
   */
  export type Style = string | number;

  /**
   * StyleRules is a set of CSS rules. Media queries can be nested in it.
   * See {@link IContainer} for details.
   */
  export type StyleRules = { [key: string]: Style | { [mediaQuery: string]: Style } };

  /**
   * See {@link IContainer} for details on how this works.
   */
  export type ContainerChild = IContainer | IControlChild | 'video';

  /**
   * IContainer is an element that contains controls in the `flex` layout
   * mode. It can contain child containers or IDs of controls, as well as
   * free-form CSS styles styles or media queries. CSS styles may be
   * camelCased and media queries can be passed in the form
   * `(max-width: 123px)` with further nested rules.
   *
   * Classes will be applied to the container and can be used to reference the
   * contained in your own code or stylesheets.
   *
   * For example:
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
   *         "alignItems": "center",
   *         "flex-direction": column",
   *         "(max-width: 300px)": {
   *           "flex-direction": row",
   *         }
   *       }
   *     }
   *   ]
   * }
   * ```
   */
  export interface IContainer {
    readonly class?: string[];
    readonly children?: ContainerChild[];
    readonly styles?: StyleRules;
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
   * a description and brief example..
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

// these are the same right now, but may diverge:
interface IInteractiveRPCMethod<T> extends IRPCMethod<T> {} // tslint:disable-line
interface IInteractiveRPCReply<T> extends IRPCReply<T> {} // tslint:disable-line

const rpc = new RPC(window.top);

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
 * Called by the MState automatically when all hooks are set up. This signals
 * to Mixer that the controls have been bound and are ready to start taking
 * Interactive calls.
 */
export function isLoaded() {
  rpc.call('controlsReady', {}, false);
}

export const packageConfig: IPackageConfig = <any>null; // overridden by the MixerPlugin
export const socket = new Socket();
export const display = new Display();
