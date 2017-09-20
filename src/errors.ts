import * as chalk from 'chalk';
import { get } from 'lodash';
import { Response } from 'node-fetch';
import { inspect } from 'util';

/**
 * IHumanError is an error that has a nicer, human-readable message output.
 */
export interface IHumanError extends Error {
  getHumanMessage(): string;
}

export function isHumanError(err: Error): err is IHumanError {
  return err instanceof Error && typeof (<any>err).getHumanMessage === 'function';
}

/**
 * OAuthError is the error type thrown when anything goes wrong in shortcode oauth.
 */
export class ShortCodeError extends Error {}

/**
 * A subprocess error is thrown when a subprocess exits with an unexpected
 * status code.
 */
export class SubprocessError extends Error {}

/**
 * UnexpectedHttpError is raised when we get an unexpected status code
 * from Mixer.
 */
export class UnexpectedHttpError extends Error implements IHumanError {
  constructor(public readonly res: Response, public readonly text: string) {
    super(`Unexpected status code ${res.status} ${res.statusText} from ${res.url}: ${text}`);
  }

  public getHumanMessage(): string {
    const json = this.tryJson();

    return [
      `Unexpected ${this.res.status} ${this.res.statusText} from ${this.res.url}:`,
      '',
      inspect(json || this.text, false, null, true),
      '',
      chalk.dim(this.stack!.split('\n').slice(1).join('\n')),
    ].join('\n');
  }

  /**
   * For 400 errors, this returns the Joi validation that failed.
   * Returns undefined if it's not a 400 error or for any reason we can't
   * figure out the error message.
   */
  public getValidationError(): { message: string; path: string; type: string } | void {
    if (this.res.status !== 400) {
      return undefined;
    }

    return get(this.tryJson(), 'details.0', undefined);
  }

  /**
   * Tries to parse the response body as JSON, returning undefined if it can't.
   */
  public tryJson(): any | void {
    try {
      return JSON.parse(this.text);
    } catch (e) {
      return undefined;
    }
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
export class PackageIntegrityError extends Error {
  public getHumanMessage(): string {
    return this.message;
  }
}

/**
 * A WebpackBundlerError is thrown during the bundling process if
 * webpack throws an error.
 */
export class WebpackBundlerError extends Error {}

/**
 * PublishError is thrown during the Publisher's publish or unpublished
 * methods if a bad response code is thrown.
 */
export class PublishHttpError extends UnexpectedHttpError {
  public getHumanMessage(): string {
    if (this.res.status === 403) {
      return `You don't own that Interactive bundle!`;
    }

    const invalid = this.getValidationError();
    if (!invalid) {
      return this.stack || this.message; // *shrugs*
    }

    // Rewrite some common errors with more helpful messages, when we can.

    switch (invalid.type) {
      case 'immutableVersion':
        return (
          `That Interactive version is already published, you cannot modify ` +
          `it. If you need to unpublish it, run \`miix unpublish\`.`
        );

      case 'versionAlreadyPublic':
        return (
          `You already published that version! Maybe you want to update the ` +
          `version number in your package.json?`
        );

      case 'string.semver':
        return (
          `The version number in your package.json must be a semantic version ` +
          `number, like "1.2.3".`
        );

      case 'string.regex.base':
        switch (invalid.path) { // quite possible we'll have more paths later
          case 'id':
            return 'Your package name can only contain numbers, letters, and dashes.';
          default:
          // fall through
        }
        break;

      default:
      // fall through
    }
    return super.getHumanMessage();
  }
}

/**
 * PublishPrivateError is thrown when attempts to run miix publish on
 * a private module.
 */
export class PublishPrivateError extends Error implements IHumanError {
  public getHumanMessage(): string {
    return (
      `Your package.json has \`"private": true\` in it, which prevents publishing. ` +
      `Remove this line if you're ready to publish your project to the world!`
    );
  }
}

/**
 * UploaderHttpError is thrown by the Updater process.
 */
export class UploaderHttpError extends PublishHttpError {
  public getHumanMessage(): string {
    // 403 means we're trying to upload onto someone else's bundle
    if (this.res.status === 403) {
      return `That bundle name is already taken, shucks!`;
    }

    // Hapi seems to be a little weird about this, it *should* properly
    // return a 413 but on my box it gives this error instead.
    if (
      this.res.status === 400 &&
      get(this.tryJson(), 'message') === 'Invalid multipart payload format'
    ) {
      return (
        `Your bundle is too big to upload! Try cutting your bundle size ` +
        `down, or contact mixer.com/contact for help.`
      );
    }

    return super.getHumanMessage();
  }
}
