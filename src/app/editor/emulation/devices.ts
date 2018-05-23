import { Orientation } from './emulation.actions';

/**
 * Frame is the "decoration" around the embedded iframe.
 */
export type Frame = 'none' | 'phone';

/**
 * IBlock is a block on the screen. The "controls" block is where the controls
 * are displayed, the other types are inactive. Positions/sizes are given
 * in pixels. "Video" defines where the video is by default, but it can be
 * moved around.
 */
export interface IBlock {
  width: number;
  height: number;
  x: number;
  y: number;
  type: 'controls' | 'chat' | 'video';
}

/**
 * IDevice describes a device preset in the editor.
 */
export interface IDevice {
  /**
   * Decorative frame for the device.
   */
  readonly frame: Frame;

  /**
   * Friendly name displayed to users.
   */
  readonly displayName: string;

  /**
   * Whether the video is included in and placed by the control area. On
   * mobile layouts, this will generally be false.
   */
  readonly placesVideo: boolean;

  /**
   * The platform the controls are currently running on.
   */
  readonly platform: 'mobile' | 'xbox' | 'desktop';

  /**
   * Whether this device can be rotated or not.
   */
  readonly canRotate: boolean;

  /**
   * Display returns blocks for the device.
   */
  display(
    availableWidth: number,
    availableHeight: number,
    fit: boolean,
    orientation: Orientation,
  ): IBlock[];
}

function fitRatio(ratio: number, width: number, height: number): [number, number] {
  if (width > height * ratio) {
    return [height * ratio, height];
  }

  return [width, width / ratio];
}

/**
 * Padding of components, in pixels.
 */
const displayPadding = 16;

/**
 * Desktop web view
 */
class DesktopDevice implements IDevice {
  public readonly frame = 'none';
  public readonly placesVideo = true;
  public readonly platform = 'desktop';
  public readonly displayName = 'Web View (16:9)';
  public readonly canRotate = false;

  public display(availableWidth: number, availableHeight: number, exact: boolean): IBlock[] {
    // The goal here is to pretend the scene is 1080p, then scale the 350px
    // default chat sidebar to its scaled size.
    let width: number;
    let height: number;
    if (!exact) {
      [width, height] = fitRatio(16 / 9, availableWidth, availableHeight);
    } else {
      [width, height] = [availableWidth, availableHeight];
    }

    const chatWidth = 350 / 1920 * availableWidth;

    return [
      {
        x: displayPadding,
        y: displayPadding,
        width: width - chatWidth - displayPadding * 2,
        height: height - displayPadding * 2,
        type: 'controls',
      },
      {
        x: width - chatWidth,
        y: 0,
        width: chatWidth,
        height,
        type: 'chat',
      },
    ];
  }
}

/**
 * Fullscreen in a 16:9 view
 */
class FullscreenDevice implements IDevice {
  public readonly frame = 'none';
  public readonly placesVideo = false;
  public readonly platform = 'desktop';
  public readonly displayName = 'Full Screen (16:9)';
  public readonly canRotate = false;

  public display(availableWidth: number, availableHeight: number, exact: boolean): IBlock[] {
    // The goal here is to pretend the scene is 1080p, then scale the 350px
    // default chat sidebar to its scaled size.
    let width: number;
    let height: number;
    if (!exact) {
      [width, height] = fitRatio(16 / 9, availableWidth, availableHeight);
    } else {
      [width, height] = [availableWidth, availableHeight];
    }

    return [
      {
        x: 0,
        y: 0,
        width,
        height,
        type: 'controls',
      },
    ];
  }
}

/**
 * Some mobile, rotat-able device
 */
class MobileDevice implements IDevice {
  public readonly frame = 'phone';
  public readonly placesVideo = false;
  public readonly platform = 'mobile';
  public readonly canRotate = true;

  constructor(
    public readonly displayName: string,
    private readonly height: number,
    private readonly width: number,
  ) {}

  public display(
    availableWidth: number,
    availableHeight: number,
    exact: boolean,
    orientation: Orientation,
  ): IBlock[] {
    const height = exact ? availableHeight : this.height;
    const width = exact ? availableWidth : this.width;
    if (orientation === Orientation.Landscape) {
      return [
        {
          x: 0,
          y: 0,
          width,
          height,
          type: 'controls',
        },
      ];
    }

    const videoHeight = height * 9 / 16;

    return [
      {
        x: 0,
        y: 0,
        width: height,
        height: videoHeight,
        type: 'video',
      },
      {
        x: 0,
        y: videoHeight,
        width: height,
        height: width - videoHeight,
        type: 'controls',
      },
    ];
  }
}

export const devices: ReadonlyArray<IDevice> = [
  new DesktopDevice(),
  new FullscreenDevice(),
  new MobileDevice('iPhone 5', 320, 568),
  new MobileDevice('iPhone 6, 7', 375, 667),
  new MobileDevice('Google Nexus, Pixel', 411, 731),
  new MobileDevice('Galaxy Note 5, LG G5, OPO 3', 480, 853),
  new MobileDevice('Galaxy S7', 340, 640),
];
