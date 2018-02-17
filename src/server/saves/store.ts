import { createHash } from 'crypto';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';

import { SaveNotFoundError } from '../errors';
import { Project } from '../project';
import { promiseCallback, readFile } from '../util';
import { ExponentialSaveCompactor, ISaveCompactor } from './compator';

/**
 * ISaveFile is a listed entry returned from Saves.list.
 */
export interface ISaveFile {
  name: string;
  savedAt: Date;
}

export const defaultCompactor = new ExponentialSaveCompactor({
  baseBucketMs: 1000 * 30,
  bucketIncreaseMultiplier: 1.5,
  bucketMaxMs: 1000 * 60 * 10,
  maxRetentionMs: 1000 * 60 * 60 * 24 * 14,
});

/**
 * Saves manages project save files.
 */
export class Saves {
  constructor(
    private readonly project: Project,
    private readonly compactor: ISaveCompactor = defaultCompactor,
  ) {}

  /**
   * Appends as the given blob as a file save.
   */
  public async append(blob: any, now: number = Date.now()) {
    const dir = await this.getSaveDir();

    await Promise.all([this.trimFiles(dir, now), this.writeBlob(dir, blob)]);
  }

  /**
   * List enumerates all current save files.
   */
  public async list(): Promise<ISaveFile[]> {
    const files = await this.listFiles(await this.getSaveDir());
    return files.map(file => ({
      name: file,
      savedAt: new Date(Number(file)),
    }));
  }

  /**
   * Load opens a save file.
   */
  public async load(file: string): Promise<object> {
    const filepath = path.join(await this.getSaveDir(), file);
    if (!fs.existsSync(filepath)) {
      throw new SaveNotFoundError();
    }

    return JSON.parse(await readFile(filepath));
  }

  /**
   * Loads the most recent save file.
   */
  public async loadLatest(): Promise<object | undefined> {
    const files = await this.listFiles(await this.getSaveDir());
    if (files.length === 0) {
      throw new SaveNotFoundError();
    }

    return this.load(files[files.length - 1]);
  }

  private async listFiles(dir: string): Promise<string[]> {
    const files = await promiseCallback<string[]>(callback => fs.readdir(dir, callback));
    return files.filter(file => !isNaN(Number(file))).sort((a, b) => Number(a) - Number(b));
  }

  private async trimFiles(dir: string, now: number): Promise<void> {
    const files = await this.listFiles(dir);
    const toCompact = this.compactor.trim(
      files
        .filter(file => !isNaN(Number(file)))
        .map(file => <[Date, string]>[new Date(Number(file)), file]),
      now,
    );

    await Promise.all(
      toCompact.map(async file =>
        promiseCallback(callback => fs.unlink(path.join(dir, file), callback)),
      ),
    );
  }

  private async writeBlob(dir: string, blob: any, now = Date.now()): Promise<void> {
    await promiseCallback(callback =>
      fs.writeFile(path.join(dir, String(now)), JSON.stringify(blob), callback),
    );
  }

  private async getSaveDir() {
    const saveDir = path.join(
      path.dirname(this.project.profile.file),
      '.miix-data',
      'saves',
      createHash('md5')
        .update(this.project.baseDir())
        .digest('hex'),
    );

    await promiseCallback(callback => mkdirp(saveDir, callback));

    return saveDir;
  }
}
