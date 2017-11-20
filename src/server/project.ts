import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import * as path from 'path';

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

  constructor(profileFile: string, private readonly projectBaseDir: string) {
    this.profile = new Profile(profileFile);
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
    const contents = await readFile(this.baseDir('package.json'));
    return JSON.parse(contents);
  }

  /**
   * Base project directory. Joined with the optional extra path segments.
   */
  public baseDir(...segments: string[]): string {
    return path.join(this.projectBaseDir, ...segments);
  }
}
