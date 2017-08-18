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
