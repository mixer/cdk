import { expect } from 'chai';
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as sinon from 'sinon';

import { ShortCodeExpireError } from '../src/errors';
import { GrantCancelledError, Profile } from '../src/profile';
import { OAuthClient } from '../src/shortcode';
import { api } from '../src/util';
import {
  createExpiredOAuthTokens,
  createValidOAuthTokens,
  IExpectWriter,
  MockRequester,
  stubWriter,
} from './_setup';

describe('profile', () => {
  let file: string;
  let profile: Profile;
  let writer: IExpectWriter;
  let requester: MockRequester;
  let mockOAuth: { [k in keyof OAuthClient]: sinon.SinonStub };
  beforeEach(() => {
    mockOAuth = { getCode: sinon.stub(), refresh: sinon.stub() };
    requester = new MockRequester();

    mockOAuth.getCode.resolves({
      code: 'ABC123',
      waitForAccept: async () => createValidOAuthTokens(),
    });

    requester.json.resolves({
      json: () => ({
        id: 1,
        username: 'connor',
        channel: {
          id: 2,
        },
      }),
    });

    file = path.resolve(tmpdir(), 'miix-test-profile.yaml');
    profile = new Profile(file, <any>mockOAuth, requester);
    writer = stubWriter();
  });

  afterEach(() => {
    try {
      fs.unlinkSync(file);
    } catch (e) {
      /* ignored */
    }
  });

  function expectProfileFile() {
    return expect(fs.readFileSync(file, 'utf-8'));
  }

  describe('granting', () => {
    it("creates and grants a file if it doesn't exist", async () => {
      const tokens = await profile.tokens();
      expectProfileFile().to.contain(`accessToken: ${tokens.data.accessToken}`);
      writer.expectToHaveWritten(/go to.+mixer\.com\/go.+ enter the code.+ABC123/i);
      expect(await profile.user()).to.containSubset({
        id: 1,
        username: 'connor',
      });
    });

    it('loads existing tokens', async () => {
      const originalTokens = await profile.tokens();
      writer.clear();
      const savedTokens = await new Profile(file, <any>null).tokens();
      expect(savedTokens).to.deep.equal(originalTokens);
      writer.expectToNotHaveWritten();
    });

    it('retries asking for expired tokens until notifier cancels', async () => {
      let n = 0;
      let cancelled = false;
      const notifier = {
        isCancelled: () => cancelled,
        prompt: sinon.stub(),
      };

      mockOAuth.getCode.resolves({
        code: 'ABC123',
        waitForAccept: async () => {
          if (n++ === 2) {
            cancelled = true;
          }

          throw new ShortCodeExpireError();
        },
      });

      await expect(profile.grant(notifier)).to.eventually.be.rejectedWith(GrantCancelledError);
      expect(notifier.prompt).to.have.been.calledThrice;
    });

    it('refreshes expired tokens', async () => {
      mockOAuth.getCode.resolves({
        code: 'ABC123',
        waitForAccept: async () => createExpiredOAuthTokens(),
      });
      await profile.tokens();
      writer.clear();

      mockOAuth.refresh.resolves(createValidOAuthTokens());

      const newTokens = await new Profile(file, <any>mockOAuth, requester).tokens();
      expect(newTokens.data.accessToken).to.equal('access_token'); // not expired_access_token
      const savedTokens = await new Profile(file, <any>null).tokens();
      expect(savedTokens).to.deep.equal(newTokens);
      writer.expectToNotHaveWritten();
    });
  });

  describe('logout', () => {
    beforeEach(async () => profile.tokens());

    it('logs out of the current host', async () => {
      await profile.logout();
      expect(await profile.hasAuthenticated()).to.be.false;
      expectProfileFile().to.not.contain(api());
    });

    it('is a noop if already logged out', async () => {
      await profile.logout();
      await profile.logout(); // should not throw or anything
    });

    it('does not affect other hosts', async () => {
      const exampleHost = 'https://example.com';
      (<any>profile).host = exampleHost;
      await profile.tokens();
      expectProfileFile().to.contain(exampleHost);
      await profile.logout();
      expectProfileFile().to.not.contain(exampleHost);

      expectProfileFile().to.contain(api());
    });
  });
});
