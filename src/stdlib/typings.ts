/**
 * IVideoPositionOptions are passed into display.moveVideo() to change
 * where the video is shown on the screen.
 */
export interface IVideoPositionOptions {
  /**
   * Position of the video on screen from the left-hand edge of the container.
   * If omitted, it's not modified. If -1, any previous setting is cleared.
   */
  left?: number;

  /**
   * Position of the video on screen from the top edge of the container.
   * If omitted, it's not modified. If -1, any previous setting is cleared.
   */
  top?: number;

  /**
   * Position of the video on screen from the right-hand edge of the container.
   * If omitted, it's not modified. If -1, any previous setting is cleared.
   */
  right?: number;

  /**
   * Position of the video on screen from the bottom edge of the container.
   * If omitted, it's not modified. If -1, any previous setting is cleared.
   */
  bottom?: number;

  /**
   * Width of the video on screen as in pixels.
   * If omitted, it's not modified. If -1, any previous setting is cleared.
   */
  width?: number;

  /**
   * Height of the video on screen as in pixels
   * If omitted, it's not modified. If -1, any previous setting is cleared.
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
   * Whether the input is currently disabled.
   */
  readonly disabled: boolean;

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
  readonly sparks: number; // approximate, should be used for display, not validation
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
   * Whether the video is included in and placed by the control area. On
   * mobile layouts, this will generally be false.
   */
  placesVideo: boolean;
}

/**
 * IStateDump is a dump of the raw object tree. The Mixer.socket has an
 * `onStateDump` handler which should be attached to; the editor will use
 * this during runtime for debugging.
 */
export interface IStateDump {
  scenes: IScene[];
  groups: IGroup[];
  participant: IParticipant;
}

/**
 * Enumeration of Interactive error codes. More docs and descriptions can be found in:
 * {@link https://dev.mixer.com/reference/interactive/protocol/protocol.pdf}
 */
export enum ErrorCode {
  CloseUnknown = 1011,
  CloseRestarting = 1012,

  AppBadJson = 4000,
  AppBadCompression,
  AppBadPacketType,
  AppBadMethod,
  AppBadArgs,
  AppBadEtag,
  AppExpiredTransaction,
  AppNotEnoughSparks,
  AppUnknownGroup,
  AppGroupExists,
  AppUnknownScene,
  AppSceneExists,
  AppUnknownControl,
  AppControlExists,
  AppUnknownControlType,
  AppUnknownParticipant,
  AppSessionClosing,
  AppOutOfMemory,
  AppCannotDeleteDefault,
  AppCannotAuthenticate,
  AppNoInteractiveVersion,
  AppExistingInteractiveSession,
  AppChannelNotOnline,
  AppBadUserInput = 4999,
}
