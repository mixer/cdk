import { expect } from 'chai';
import { mkdirSync } from 'fs';
import * as path from 'path';

import { FileDataStore } from '../src/server/datastore';
import { exists, readFile } from '../src/server/util';

// tslint:disable-next-line
const rimraf = require('rimraf');

describe('FileDataStore', () => {
  function homedir(...parts: string[]) {
    return path.join(__dirname, 'fixture', 'project-config', 'homedir', ...parts);
  }
  function projdir(...parts: string[]) {
    return path.join(__dirname, 'fixture', 'project-config', 'projdir', ...parts);
  }

  beforeEach(() => {
    mkdirSync(projdir());
    mkdirSync(homedir());
    mkdirSync(projdir('.git'));
  });

  afterEach(() => {
    rimraf.sync(homedir());
    rimraf.sync(projdir());
  });

  it('loads correctly when no files exist', async () => {
    const store = new FileDataStore(path.join(__dirname, 'does-not-exist'));
    expect(await store.loadGlobal('foo.json')).to.be.null;
    expect(await store.loadProject('foo.json', 'wut')).to.be.null;
  });

  it('saves a loads legacy directories', async () => {
    mkdirSync(homedir('.miix'));
    const store = new FileDataStore(homedir());
    await store.saveGlobal('foo', true);
    expect(await readFile(homedir('.miix', 'foo.json'))).to.equal('true');
    expect(await store.loadGlobal('foo')).to.be.true;
  });

  it('saves global data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(homedir('.cdk', 'foo.json'))).to.be.false;
    await store.saveGlobal('foo', true);
    expect(await readFile(homedir('.cdk', 'foo.json'))).to.equal('true');
    await store.saveGlobal('foo', undefined);
    expect(await exists(homedir('.cdk', 'foo.json'))).to.be.false;
  });

  it('saves project data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(projdir('.cdk', 'foo.json'))).to.be.false;
    await store.saveProject('foo', projdir(), true);
    expect(await readFile(projdir('.cdk', 'foo.json'))).to.equal('true');
    expect(await readFile(projdir('.gitignore'))).to.equal('\n/.cdk\n');
    await store.saveProject('foo', projdir(), undefined);
    expect(await exists(projdir('.cdk', 'foo.json'))).to.be.false;
  });

  it('saves project data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(projdir('.cdk', 'foo.json'))).to.be.false;
    await store.saveProject('foo', projdir(), true);
    expect(await readFile(projdir('.cdk', 'foo.json'))).to.equal('true');
  });

  it('merges config between the stores', async () => {
    const store = new FileDataStore(homedir());
    await store.saveProject('foo', projdir(), { a: 1, b: 2 });
    await store.saveProject('foo', homedir(), { b: 3, c: 4 });
    expect(await store.loadProject('foo', projdir())).to.deep.equal({
      a: 1,
      b: 2,
      c: 4,
    });
  });
});
