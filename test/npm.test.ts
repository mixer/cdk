import { expect } from 'chai';
import * as path from 'path';

import {
  findPackageJson,
  findReadme,
  getDependencyPath,
  getPackageExecutable,
  getProjectPath,
  mustLoadPackageJson,
} from '../src/npm';

describe('npm', () => {
  it('findPackageJson', () => {
    expect(findPackageJson(__dirname)).to.equal(path.join(__dirname, '..', 'package.json'));
    expect(findPackageJson('/')).to.be.undefined;
  });

  it('mustLoadPackageJson', () => {
    expect(mustLoadPackageJson(__dirname)).to.containSubset({ name: '@mcph/miix-cli' });
    expect(() => mustLoadPackageJson('/')).to.throw(/Could not find a package/);
  });

  it('getProjectPath', () => {
    expect(getProjectPath(__dirname)).to.equal(path.join(__dirname, '..'));
    expect(getProjectPath('/')).to.be.undefined;
  });

  it('getDependencyPath', () => {
    expect(getDependencyPath('mocha')).to.equal(path.join(__dirname, '../node_modules/mocha'));
  });

  it('getPackageExecutable', async () => {
    expect(getPackageExecutable(getDependencyPath('mocha'))).to.equal(
      path.join(__dirname, '../node_modules/mocha/bin/mocha'),
    );
  });

  it('findReadme', async () => {
    expect(await findReadme(path.join(__dirname, '..'))).to.equal('readme.md');
    expect(await findReadme(path.join(__dirname, 'fixture/custom-readme'))).to.equal('manual.md');
  });
});
