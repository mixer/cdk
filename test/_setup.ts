import { expect, use } from 'chai';
import * as sinon from 'sinon';

import { OAuthTokens } from '../src/shortcode';
import { IRequester } from '../src/util';
import writer from '../src/writer';

use(require('sinon-chai'));
use(require('chai-subset'));
use(require('chai-as-promised'));

/**
 * Mock implementation of IRequester
 */
export class MockRequester implements IRequester {
  public json = sinon.stub();
  public run = sinon.stub();
}

export function createExpiredOAuthTokens() {
  return new OAuthTokens({
    accessToken: 'expired_access_token',
    refreshToken: 'expired_refresh_token',
    scopes: ['interactive:manage:self'],
    expiresAt: new Date(Date.now() - 1),
  });
}

export function createValidOAuthTokens() {
  return new OAuthTokens({
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    scopes: ['interactive:manage:self'],
    expiresAt: new Date(Date.now() + 10000),
  });
}

export interface IExpectWriter {
  clear(): void;
  expectToNotHaveWritten(): void;
  expectToHaveWritten(str: string | RegExp): void;
}

export function stubWriter(): IExpectWriter {
  let stub = sinon.stub();
  writer.use(stub);
  const dumpLogs = () => `Logs were: ${JSON.stringify(stub.args, null, 2)}`;

  return {
    clear(): void {
      stub = sinon.stub();
      writer.use(stub);
    },
    expectToNotHaveWritten(): void {
      expect(stub.args.length).to.eql(0, `Expected not to have written. ${dumpLogs}`);
    },
    expectToHaveWritten: (str: string | RegExp) => {
      expect(
        stub.args.some(args => {
          const message = args.join(' ');
          if (str instanceof RegExp) {
            return str.test(message);
          }

          return message.indexOf(str) > -1;
        }),
      ).to.equal(true, `Expected to have logged ${str}. ${dumpLogs}`);
    },
  };
}
