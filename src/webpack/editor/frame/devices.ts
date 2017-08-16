import { Orientation } from '../redux/frame';

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
   * Returns whether the device can be rotated.
   */
  readonly canRotate: boolean;

  /**
   * Friendly name displayed to users.
   */
  readonly displayName: string;

  /**
   * Whether the controls handle placement of the video in this device/mobile.
   */
  readonly controlsPlaceVideo: boolean;

  /**
   * Display returns blocks for the device.
   */
  display(availableWidth: number, availableHeight: number, orientation: Orientation): IBlock[];
}

function fitRatio(ratio: number, width: number, height: number): [number, number] {
  if (width > height * ratio) {
    return [height * ratio, width];
  }

  return [width, width / ratio];
}

/**
 * Desktop web view
 */
class DesktopDevice implements IDevice {
  public readonly frame = 'none';
  public readonly canRotate = false;
  public readonly displayName = 'Web View (16:9)';
  public readonly controlsPlaceVideo = true;

  public display(availableWidth: number, availableHeight: number): IBlock[] {
    // The goal here is to pretend the scene is 1080p, then scale the 350px
    // default chat sidebar to its scaled size.
    const [width, height] = fitRatio(16 / 9, availableWidth, availableHeight);
    const chatWidth = 350 / 1920 * availableWidth;
    const videoHeight = (width - chatWidth) * 9 / 16;

    return [
      {
        x: 0,
        y: 0,
        width: width - chatWidth,
        height: videoHeight,
        type: 'video',
      },
      {
        x: 0,
        y: videoHeight,
        width: width - chatWidth,
        height: height - videoHeight,
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
  public readonly canRotate = false;
  public readonly displayName = 'Full Screen (16:9)';
  public readonly controlsPlaceVideo = true;

  public display(availableWidth: number, availableHeight: number): IBlock[] {
    // The goal here is to pretend the scene is 1080p, then scale the 350px
    // default chat sidebar to its scaled size.
    const [width, height] = fitRatio(16 / 9, availableWidth, availableHeight);

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
  public readonly canRotate = true;
  public readonly controlsPlaceVideo = false;

  constructor(
    public readonly displayName: string,
    private readonly height: number,
    private readonly width: number,
  ) {}

  public display(_w: number, _h: number, orientation: Orientation): IBlock[] {
    if (orientation === Orientation.Landscape) {
      return [
        {
          x: 0,
          y: 0,
          width: this.width,
          height: this.height,
          type: 'controls',
        },
      ];
    }

    const videoHeight = this.height * 9 / 16;

    return [
      {
        x: 0,
        y: 0,
        width: this.height,
        height: videoHeight,
        type: 'video',
      },
      {
        x: 0,
        y: videoHeight,
        width: this.height,
        height: this.width - videoHeight,
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
