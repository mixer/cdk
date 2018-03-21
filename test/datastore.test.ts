import { expect } from 'chai';
import { mkdirSync, unlinkSync } from 'fs';
import * as path from 'path';

import { FileDataStore } from '../src/server/datastore';
import { exists, readFile } from '../src/server/util';

const rimraf = require('rimraf');

describe('FileDataStore', () => {
  function homedir() {
    return path.join(__dirname, 'fixture', 'project-config', 'homedir');
  }
  function projdir() {
    return path.join(__dirname, 'fixture', 'project-config', 'projdir');
  }

  beforeEach(() => {
    mkdirSync(path.join(projdir(), '.git'));
  });

  afterEach(() => {
    rimraf.sync(path.join(homedir(), '.miix'));
    rimraf.sync(path.join(projdir(), '.miix'));
    rimraf.sync(path.join(projdir(), '.git'));
    try {
      unlinkSync(path.join(projdir(), '.gitignore'));
    } catch (e) {
      // ignored
    }
  });

  it('loads correctly when no files exist', async () => {
    const store = new FileDataStore(path.join(__dirname, 'doesn-not-exist'));
    expect(await store.loadGlobal('foo.json')).to.be.null;
    expect(await store.loadProject('foo.json', 'wut')).to.be.null;
  });

  it('saves global data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(path.join(homedir(), '.miix', 'foo.json'))).to.be.false;
    await store.saveGlobal('foo', true);
    expect(await readFile(path.join(homedir(), '.miix', 'foo.json'))).to.equal('true');
  });

  it('saves project data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(path.join(projdir(), '.miix', 'foo.json'))).to.be.false;
    await store.saveProject('foo', projdir(), true);
    expect(await readFile(path.join(projdir(), '.miix', 'foo.json'))).to.equal('true');
    expect(await readFile(path.join(projdir(), '.gitignore'))).to.equal('\n/.miix\n');
  });

  it('saves project data correctly', async () => {
    const store = new FileDataStore(homedir());
    expect(await exists(path.join(projdir(), '.miix', 'foo.json'))).to.be.false;
    await store.saveProject('foo', projdir(), true);
    expect(await readFile(path.join(projdir(), '.miix', 'foo.json'))).to.equal('true');
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
