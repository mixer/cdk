import * as chalk from 'chalk';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

import { IOAuthTokenData, OAuthClient, OAuthTokens, ShortCodeExpireError } from './shortcode';
import { wrapErr } from './util';
import writer from './writer';

interface IProfile {
  tokens: IOAuthTokenData;
}

/**
 * Creates default profile data with the set of tokens.
 * todo(connor4312): this will be fleshed out later as we add more options
 */
function createProfileDefaults(): IProfile {
  return { tokens: <any>null };
}

/**
 * Profile represents a user profile for miix, stored in the .miixrc file.
 */
export class Profile {
  public static necessaryScopes = ['interactive:manage:self'];

  private tokensObj: OAuthTokens;
  private profile: IProfile;

  constructor(
    private readonly file: string,
    private readonly oauthClient: OAuthClient = new OAuthClient({
      clientId: '9789aae60656644524be9530889ba8884c0095834ae75f50',
      scopes: Profile.necessaryScopes,
    }),
  ) {}

  /**
   * Returns valid OAuth tokens for the session. It will prompt the user to
   * grant access if the tokens don't exist or are expired.
   */
  public async tokens(): Promise<OAuthTokens> {
    await this.ensureProfile();

    return this.tokensObj;
  }

  /**
   * Ensures that the profile exists and has valid grants.
   */
  private async ensureProfile(): Promise<void> {
    if (this.profile) {
      return;
    }

    if (!await this.tryLoadFile()) {
      this.profile = createProfileDefaults();
      await this.grant();
    } else if (!this.tokensObj.granted(Profile.necessaryScopes)) {
      await this.grant();
    } else if (this.tokensObj.expired()) {
      await this.refresh();
    }
  }

  /**
   * Persists the saved tokens to disk.
   */
  private async save(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this.file, yaml.safeDump(this.profile), err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Refreshes the token grants and saves the profile.
   */
  private async refresh(): Promise<void> {
    this.tokensObj = await this.oauthClient.refresh(this.tokensObj);
    this.profile.tokens = this.tokensObj.data;
    await this.save();
  }

  /**
   * Prompts the user to grant the tokens anew, and saves the profile.
   */
  private async grant(): Promise<OAuthTokens> {
    let tokens: OAuthTokens | undefined;
    do {
      const code = await this.oauthClient.getCode();
      writer.write(
        `Go to ${chalk.blue('mixer.com/go')} and enter the code ` +
          `${chalk.blue(code.code)} to log in!`,
      );

      try {
        tokens = await code.waitForAccept();
      } catch (e) {
        if (!(e instanceof ShortCodeExpireError)) {
          throw e;
        }
      }
    } while (!tokens);

    this.tokensObj = tokens;
    this.profile.tokens = this.tokensObj.data;
    await this.save();

    return tokens;
  }

  /**
   * Attempts to load existing data from the profile file, returning whether
   * it was able to do so successfully.
   */
  private async tryLoadFile(): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.exists(this.file, exists => {
        if (!exists) {
          resolve(false);
          return;
        }

        fs.readFile(this.file, (err, contents) => {
          if (err) {
            reject(err);
          }

          try {
            this.profile = yaml.safeLoad(contents.toString('utf8'));
          } catch (err) {
            throw wrapErr(err, `Error parsing profile from ${this.file}`);
          }

          this.tokensObj = new OAuthTokens({
            ...this.profile.tokens,
            expiresAt: new Date(this.profile.tokens.expiresAt),
          });

          resolve(true);
        });
      });
    });
  }
}
