import { expect } from 'chai';
import * as fs from 'fs';
import { tmpdir } from 'os';
import * as path from 'path';
import * as sinon from 'sinon';

import { Profile } from '../src/profile';
import { OAuthClient } from '../src/shortcode';
import {
  createExpiredOAuthTokens,
  createValidOAuthTokens,
  IExpectWriter,
  stubWriter,
} from './_setup';

describe('profile', () => {
  let file: string;
  let profile: Profile;
  let writer: IExpectWriter;
  let mockOAuth: { [k in keyof OAuthClient]: sinon.SinonStub };
  beforeEach(() => {
    mockOAuth = { getCode: sinon.stub(), refresh: sinon.stub() };

    mockOAuth.getCode.resolves({
      code: 'ABC123',
      waitForAccept: async () => createValidOAuthTokens(),
    });

    file = path.resolve(tmpdir(), 'miix-test-profile.yaml');
    profile = new Profile(file, <any>mockOAuth);
    writer = stubWriter();
  });

  afterEach(() => {
    try {
      fs.unlinkSync(file);
    } catch (e) {
      /* ignored */
    }
  });

  it("creates and grants a file if it doesn't exist", async () => {
    const tokens = await profile.tokens();
    expect(fs.readFileSync(file, 'utf-8')).to.contain(`accessToken: ${tokens.data.accessToken}`);
    writer.expectToHaveWritten(/go to.+mixer\.com\/go.+ enter the code.+ABC123/i);
  });

  it('loads existing tokens', async () => {
    const originalTokens = await profile.tokens();
    writer.clear();
    const savedTokens = await new Profile(file, <any>null).tokens();
    expect(savedTokens).to.deep.equal(originalTokens);
    writer.expectToNotHaveWritten();
  });

  it('refreshes expired tokens', async () => {
    mockOAuth.getCode.resolves({
      code: 'ABC123',
      waitForAccept: async () => createExpiredOAuthTokens(),
    });
    await profile.tokens();
    writer.clear();

    mockOAuth.refresh.resolves(createValidOAuthTokens());

    const newTokens = await new Profile(file, <any>mockOAuth).tokens();
    expect(newTokens.data.accessToken).to.equal('access_token'); // not expired_access_token
    const savedTokens = await new Profile(file, <any>null).tokens();
    expect(savedTokens).to.deep.equal(newTokens);
    writer.expectToNotHaveWritten();
  });
});
