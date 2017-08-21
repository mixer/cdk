import { EventEmitter } from 'eventemitter3';
import { parse } from 'querystring';

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

/**
 * ISettings are settings specific to each run of the custom controls. They're
 * different in that was from the packageConfig, which is a 'global' constant
 * for every user. The settings contain some data about where the controls
 * are displayed and the client displaying them.
 */
export interface ISettings {
  /**
   * The user's current language setting, as defined in BCP47:
   * http://www.ietf.org/rfc/bcp/bcp47.txt. This is generally
   * `<language>[-<locale>]`. For example, `en`, `en-US`.
   */
  language: string;

  /**
   * Whether the controls are displayed in a mobile viewport/display/app.
   */
  isMobile: string;
}

/**
 * Returns the current application settings.
 */
export function getSettings(): ISettings {
  const parsed = parse(window.location.search.slice(1));
  parsed.isMobile = parsed.isMobile === 'true';
  return parsed;
}

export const packageConfig: IPackageConfig = <any>null; // overridden by the MixerPlugin
export const socket = new Socket();
export const display = new Display();
