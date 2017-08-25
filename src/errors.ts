import { Response } from 'node-fetch';

/**
 * OAuthError is the error type thrown when anything goes wrong in shortcode oauth.
 */
export class ShortCodeError extends Error {}

/**
 * UnexpectedHttpError is raised when we get an unexpected status code
 * from Mixer.
 */
export class UnexpectedHttpError extends Error {
  constructor(public readonly res: Response, public readonly text: string) {
    super(`Unexpected status code ${res.status} ${res.statusText} from ${res.url}: ${text}`);
  }
}

/**
 * ShortCodeExpireError is raised from waitForAccept() if the shortcode expires
 * before the user accepts it. Callers should handle this error.
 */
export class ShortCodeExpireError extends ShortCodeError {
  constructor() {
    super('Shortcode handle has expired');
  }
}

/**
 * Exception raised when the user denies access to the client in shortcode OAuth.
 */
export class ShortCodeAccessDeniedError extends ShortCodeError {
  constructor() {
    super('User has denied access');
  }
}

/**
 * MixerPluginError is thrown when there's an error in the webpack MixerPlugin.
 */
export class MixerPluginError extends Error {}

/**
 * A PackageIntegrityError is thrown during the bundling process if something
 * is amiss in the build process.
 */
export class PackageIntegrityError extends Error {}

/**
 * A WebpackBundlerError is thrown during the bundling process if
 * webpack throws an error.
 */
export class WebpackBundlerError extends Error {}
