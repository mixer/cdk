import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { expect } from 'chai';
import * as path from 'path';
import * as sinon from 'sinon';

import {
  PackageIntegrityError,
  PublishPrivateError,
  UnexpectedHttpError,
} from '../src/server/errors';
import { Project } from '../src/server/project';
import { Publisher } from '../src/server/publish/publisher';
import { MockRequester } from './_setup';

describe('Publisher', () => {
  let requester: MockRequester;
  let publisher: Publisher;

  // tslint:disable-next-line
  const projectPath = path.join(__dirname, 'fixture/custom-readme');
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
    const project = new Project('', '');
    sinon.stub(project, 'packageConfig').resolves({ ...mockConfig, private: true });

    await expect(publisher.publish(project)).to.eventually.be.rejectedWith(PublishPrivateError);
  });

  it('requires readmes', async () => {
    const project = new Project('', __dirname);
    sinon.stub(project, 'packageConfig').resolves(mockConfig);
    await expect(publisher.publish(project)).to.eventually.be.rejectedWith(
      PackageIntegrityError,
      /readme\.md is missing/,
    );
  });

  it('works otherwise', async () => {
    const project = new Project('', projectPath);
    sinon.stub(project, 'packageConfig').resolves(mockConfig);
    requester.json.resolves({ status: 200 });
    await publisher.publish(project);

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
    const project = new Project('', projectPath);
    sinon.stub(project, 'packageConfig').resolves(mockConfig);
    requester.json.resolves({ status: 400, text: async () => 'You messed up!' });
    await expect(publisher.publish(project)).to.eventually.be.rejectedWith(
      UnexpectedHttpError,
      /Unexpected status code 400/,
    );
  });

  it('unpublishes packages', async () => {
    requester.run.resolves({ status: 200 });
    await publisher.unpublish('interactive-launchpad', '0.1.0');
    expect(
      requester.run,
    ).to.have.been.calledWith('/interactive/bundles/interactive-launchpad/versions/0.1.0', {
      method: 'DELETE',
    });
  });
});
