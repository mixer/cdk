import { ShortCodeAccessDeniedError, ShortCodeExpireError, UnexpectedHttpError } from './errors';
import { delay, Fetcher, IRequester } from './util';

// note: this is a functional port of the Python version here:
// https://github.com/mixer/interactive-python/blob/master/interactive_python/oauth.py

export interface IShortcodeCreateResponse {
  code: string;
  expires_in: number;
  handle: string;
}

export interface IOAuthTokenData {
  accessToken: string;
  refreshToken: string;
  scopes: string[];
  expiresAt: Date;
}

/**
 * OAuthTokens is the handle for OAuth access and refresh tokens granted by
 * the user.
 */
export class OAuthTokens {
  constructor(public readonly data: IOAuthTokenData) {}

  /**
   * Returns OAuth tokens created from a response from the token endpoint as
   * described in https://tools.ietf.org/html/rfc6749#section-5.1.
   */
  public static fromTokenResponse(res: any, scopes: string[]) {
    return new OAuthTokens({
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      expiresAt: new Date(Date.now() + res.expires_in * 1000),
      scopes,
    });
  }

  /**
   * Returns a header that can be used in making http requests.
   */
  public header(): { Authorization: string } {
    return { Authorization: `Bearer ${this.data.accessToken}` };
  }

  /**
   * Returns whether the oauth tokens are expired.
   */
  public expired(): boolean {
    return this.data.expiresAt.getTime() < Date.now();
  }

  /**
   * Returns whether all of the provided scopes have been granted by this set
   * of OAuth tokens.
   */
  public granted(scopes: string[]): boolean {
    return !scopes.some(s => this.data.scopes.indexOf(s) === -1);
  }
}

/**
 * OAuthShortCode is the shortcode handle returned by the `OAuthClient`. See
 * documentation on that class for more information and usage examples.
 */
export class OAuthShortCode {
  /**
   * Interval on which to poll to see if the shortcode was accepted.
   */
  private static checkInterval = 2000;

  /**
   * The OAuth shortcode to display to the user.
   */
  public readonly code = this.shortcode.code;

  private expired = delay(this.shortcode.expires_in * 1000);

  constructor(
    private readonly clientId: string,
    private readonly scopes: string[],
    private readonly shortcode: IShortcodeCreateResponse,
    private readonly fetcher: IRequester,
  ) {}

  public async waitForAccept(): Promise<OAuthTokens> {
    const res = await this.fetcher.json('get', `/oauth/shortcode/check/${this.shortcode.handle}`);
    switch (res.status) {
      case 200:
        return this.getTokens(await res.json());
      case 204:
        break;
      case 403:
        throw new ShortCodeAccessDeniedError();
      case 404:
        throw new ShortCodeExpireError();
      default:
        throw new UnexpectedHttpError(res, await res.text());
    }

    await Promise.race([
      delay(OAuthShortCode.checkInterval),
      this.expired.then(() => {
        throw new ShortCodeExpireError();
      }),
    ]);

    return this.waitForAccept();
  }

  private async getTokens({ code }: { code: string }): Promise<OAuthTokens> {
    const res = await this.fetcher.json('post', '/oauth/token', {
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
    });

    if (res.status >= 300) {
      throw new UnexpectedHttpError(res, await res.text());
    }

    return OAuthTokens.fromTokenResponse(await res.json(), this.scopes);
  }
}

/**
 * IOAuthOptions are passed into the OAuth client for creating
 * and retrieving grants.
 */
export interface IOAuthOptions {
  /**
   * OAuth client ID.
   */
  clientId: string;
  /**
   * OAuth client secret, if any.
   */
  clientSecret?: string;
  /**
   * A list of permissions to request. A full list can be found here:
   * https://dev.mixer.com/reference/oauth/index.html#oauth_scopes
   */
  scopes: string[];
  /**
   * OAuth host address, defaults to https://mixer.com/api/v1
   */
  host?: string;
}

/**
 * OAuthClient is a clien interface for handling shortcode grants and
 * reauthorizing access tokens.
 *
 * ```
 * const client = new OAuthClient(options);
 * const attempt = () => {
 *   return client.getCode()
 *     .then(code => {
 *       console.log(`Go to mixer.com/go and enter ${code.code}`);
 *       return code.waitForAccept();
 *     })
 *     .catch(err => {
 *       if (err instanceof ShortCodeExpireError) {
 *         return attempt(); // loop!
 *       }
 *
 *       throw err;
 *     });
 * };
 *
 * attempt().then(tokens => console.log(`Access token: ${tokens.access}`));
 * ```
 */
export class OAuthClient {
  constructor(
    private readonly options: IOAuthOptions,
    private readonly fetcher: IRequester = new Fetcher([], options.host),
  ) {}

  /**
   * Starts a flow to get an oauth code.
   */
  public async getCode(): Promise<OAuthShortCode> {
    const results = await this.fetcher.json('post', '/oauth/shortcode', {
      client_id: this.options.clientId,
      client_secret: this.options.clientSecret,
      scope: this.options.scopes.join(' '),
    });

    if (results.status >= 300) {
      throw new UnexpectedHttpError(results, await results.text());
    }

    const json: IShortcodeCreateResponse = await results.json();
    return new OAuthShortCode(this.options.clientId, this.options.scopes, json, this.fetcher);
  }

  /**
   * Refreshes the token set and returns a new set of tokens.
   */
  public async refresh(tokens: OAuthTokens): Promise<OAuthTokens> {
    const res = await this.fetcher.json('post', '/oauth/token', {
      grant_type: 'refresh_token',
      refresh_token: tokens.data.refreshToken,
      client_id: this.options.clientId,
    });

    if (res.status >= 300) {
      throw new UnexpectedHttpError(res, await res.text());
    }

    return OAuthTokens.fromTokenResponse(await res.json(), tokens.data.scopes);
  }
}
