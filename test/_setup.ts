import { use } from 'chai';
import * as sinon from 'sinon';

import { Profile } from '../src/server/profile';
import { OAuthTokens } from '../src/server/shortcode';
import { IRequester } from '../src/server/util';

use(require('sinon-chai'));
use(require('chai-subset'));
use(require('chai-as-promised'));

/**
 * Mock implementation of IRequester
 */
export class MockRequester implements IRequester {
  public json = sinon.stub();
  public run = sinon.stub();
  public with = sinon.stub().returns(this);
}

export function createExpiredOAuthTokens() {
  return new OAuthTokens({
    accessToken: 'expired_access_token',
    refreshToken: 'expired_refresh_token',
    scopes: Profile.necessaryScopes,
    expiresAt: new Date(Date.now() - 1),
  });
}

export function createValidOAuthTokens() {
  return new OAuthTokens({
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    scopes: Profile.necessaryScopes,
    expiresAt: new Date(Date.now() + 10000),
  });
}
