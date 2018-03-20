import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as sinon from 'sinon';

import { NoAuthenticationError, ShortCodeExpireError } from '../src/server/errors';
import { GrantCancelledError, Profile } from '../src/server/profile';
import { OAuthClient } from '../src/server/shortcode';
import { api } from '../src/server/util';
import { createExpiredOAuthTokens, createValidOAuthTokens, MockRequester } from './_setup';
import { FileDataStore } from '../src/server/datastore';

const rimraf = require('rimraf');

describe('profile', () => {
  let profileDir: string;
  let profile: Profile;
  let requester: MockRequester;
  let mockOAuth: { [k in keyof OAuthClient]: sinon.SinonStub };

  const mockPrompter = {
    prompt: (code: string) => expect(code).to.equal('ABC123'),
    isCancelled: () => false,
  };

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

    profileDir = path.join(__dirname, 'fixture');
    profile = new Profile(new FileDataStore(profileDir), <any>mockOAuth, requester);
  });

  afterEach(() => {
    rimraf.sync(path.join(profileDir, '.miix'));
  });

  function expectProfileFile() {
    return expect(fs.readFileSync(path.join(profileDir, '.miix', 'profile.json'), 'utf-8'));
  }

  describe('granting', () => {
    it("creates and grants a file if it doesn't exist", async () => {
      const tokens = await profile.grant(mockPrompter);

      expectProfileFile().to.contain(`"accessToken": "${tokens.data.accessToken}"`);
      expect(await profile.user()).to.containSubset({
        id: 1,
        username: 'connor',
      });
    });

    it('throws when getting tokens if the tokens are not set', async () => {
      await expect(profile.tokens()).to.eventually.rejectedWith(NoAuthenticationError);
    });

    it('loads existing tokens', async () => {
      const originalTokens = await profile.grant(mockPrompter);
      const savedTokens = await new Profile(new FileDataStore(profileDir), <any>null).tokens();
      expect(savedTokens).to.deep.equal(originalTokens);
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
      await profile.grant(mockPrompter);

      mockOAuth.refresh.resolves(createValidOAuthTokens());

      const newTokens = await new Profile(
        new FileDataStore(profileDir),
        <any>mockOAuth,
        requester,
      ).tokens();
      expect(newTokens.data.accessToken).to.equal('access_token'); // not expired_access_token
      const savedTokens = await new Profile(new FileDataStore(profileDir), <any>null).tokens();
      expect(savedTokens).to.deep.equal(newTokens);
    });
  });

  describe('logout', () => {
    beforeEach(async () => profile.grant(mockPrompter));

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
      await profile.grant(mockPrompter);
      expectProfileFile().to.contain(exampleHost);
      await profile.logout();
      expectProfileFile().to.not.contain(exampleHost);

      expectProfileFile().to.contain(api());
    });
  });
});
