import * as path from 'path';

import { FileDataStore, IDataStore } from './datastore';
import { BadPackageJsonError } from './errors';
import { Profile } from './profile';
import { readFile } from './util';

/**
 * Interface that generally describes a project package.
 */
export interface IPackageJson {
  name: string;
  version: string;
  description?: string;
  keywords?: string[];
  private?: boolean;
  homepage?: string;
  dependencies?: { [name: string]: string };
  devDependencies?: { [name: string]: string };
}

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
   * Loads and parses the package.json file from the project.
   */
  public async packageJson(): Promise<IPackageJson> {
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
