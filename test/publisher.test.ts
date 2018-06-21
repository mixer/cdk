import { IPackageConfig } from '@mixer/cdk-std/dist/internal';
import { expect } from 'chai';

import { PublishPrivateError, UnexpectedHttpError } from '../src/server/errors';
import { Publisher } from '../src/server/publish/publisher';
import { MockRequester } from './_setup';

describe('Publisher', () => {
  let requester: MockRequester;
  let publisher: Publisher;

  // tslint:disable-next-line
  const mockConfig: IPackageConfig = {
    name: 'interactive-launchpad',
    version: '0.1.0',
    description: 'My awesome bundle',
    homepage: 'https://mixer.com',
    controls: {},
    scenes: {},
  };

  beforeEach(() => {
    requester = new MockRequester();
    publisher = new Publisher(requester);
  });

  it('refuses to publish private packages', async () => {
    await expect(
      publisher.publish({ ...mockConfig, private: true }, null),
    ).to.eventually.be.rejectedWith(PublishPrivateError);
  });

  it('works otherwise', async () => {
    requester.json.resolves({ status: 200 });
    await publisher.publish(mockConfig, '<h1 id="heyo-">Heyo!</h1>\n');

    expect(requester.json).to.have.been.calledWith(
      'post',
      '/interactive/bundles/interactive-launchpad/versions/0.1.0/publish',
      {
        readme: '<h1 id="heyo-">Heyo!</h1>\n',
        homepage: 'https://mixer.com',
        tags: [],
        description: 'My awesome bundle',
      },
    );
  });

  it('formats errors nicely', async () => {
    requester.json.resolves({ status: 400, text: async () => 'You messed up!' });
    await expect(publisher.publish(mockConfig, null)).to.eventually.be.rejectedWith(
      UnexpectedHttpError,
      /Unexpected status code 400/,
    );
  });

  it('unpublishes packages', async () => {
    requester.run.resolves({ status: 200 });
    await publisher.unpublish('interactive-launchpad', '0.1.0');
    expect(requester.run).to.have.been.calledWith(
      '/interactive/bundles/interactive-launchpad/versions/0.1.0',
      {
        method: 'DELETE',
      },
    );
  });
});
