import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import * as path from 'path';

import { FileDataStore, IDataStore } from './datastore';
import { BadPackageJsonError } from './errors';
import { createPackage } from './metadata/metadata';
import { Profile } from './profile';
import { readFile } from './util';

/**
 * Project represents the location of the control project and provides
 * manipulation accessors.
 */
export class Project {
  /**
   * Contains user profile information.
   */
  public readonly profile: Profile;

  constructor(
    private readonly projectBaseDir: string,
    private readonly datastore: IDataStore = new FileDataStore(),
  ) {
    this.profile = new Profile();
  }

  /**
   * Loads a local project setting.
   */
  public async loadSetting<T>(file: string): Promise<T | null>;
  public async loadSetting<T>(file: string, defaultValue: T): Promise<T>;
  public async loadSetting<T>(file: string, defaultValue?: T): Promise<T | null> {
    return <T | null>await this.datastore.loadProject(file, this.baseDir(), defaultValue);
  }

  /**
   * Saves a project setting.
   */
  public async saveSetting<T>(file: string, value: T): Promise<void> {
    return this.datastore.saveProject(file, this.baseDir(), value);
  }

  /**
   * Returns the resolved package config with metadata.
   */
  public async packageConfig(): Promise<IPackageConfig> {
    return createPackage(await this.packageJson(), this.baseDir());
  }

  /**
   * Loads and parses the package.json file from the project.
   */
  public async packageJson(): Promise<any> {
    try {
      const contents = await readFile(this.baseDir('package.json'));
      return JSON.parse(contents);
    } catch (e) {
      throw new BadPackageJsonError(e.message);
    }
  }

  /**
   * Base project directory. Joined with the optional extra path segments.
   */
  public baseDir(...segments: string[]): string {
    return path.join(this.projectBaseDir, ...segments);
  }
}
