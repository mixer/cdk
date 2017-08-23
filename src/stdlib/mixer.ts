import { EventEmitter } from 'eventemitter3';
import { ISettings } from './mixer';

import { IPackageConfig } from '../metadata/package';
import { IRPCMethod, IRPCReply, objToError, RPC } from './rpc';
import {
  IControlChange,
  IGroupCreate,
  IGroupDelete,
  IGroupUpdate,
  IInput,
  IParticipantUpdate,
  IReady,
  ISceneCreate,
  ISceneDelete,
  ISceneUpdate,
  IStateDump,
  IVideoPositionOptions,
} from './typings';

export { RPCError } from './rpc';
export * from './typings';
export * from '../metadata/decoration';
export * from '../metadata/package';

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

  /**
   * Sets the handler to use when the editor requests a dump of the current
   * controls state.
   */
  public dumpHandler(fn: () => IStateDump) {
    rpc.expose('dumpState', fn);
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
      <any>waitForReply,
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
export class Display extends EventEmitter {
  private lastSettings: ISettings;

  constructor() {
    super();
    rpc.expose('updateSettings', (settings: ISettings) => {
      this.lastSettings = settings;
      this.emit('settings', settings);
    });
  }
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

  /**
   * Returns the current display settings.
   */
  public getSettings(): ISettings | undefined {
    return this.lastSettings;
  }

  public on(event: 'settings', handler: (ev: ISettings) => void): this;
  public on(event: string, handler: (...args: any[]) => void): this {
    super.on(event, handler);
    return this;
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
