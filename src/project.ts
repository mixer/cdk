import { IPackageConfig } from '@mcph/miix-std/dist/internal';
import { once } from 'lodash';
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

  /**
   * Loads and parses the package.json file from the project.
   */
  public packageJson = once(async (): Promise<any> => {
    const contents = await readFile(this.baseDir('package.json'));
    return JSON.parse(contents);
  });

  /**
   * Returns the resolved package config with metadata.
   */
  public packageConfig = once(async (): Promise<IPackageConfig> => {
    return createPackage(await this.packageJson(), this.baseDir());
  });

  constructor(private readonly profileFile: string, private readonly projectBaseDir: string) {
    this.profile = new Profile(profileFile);
  }

  /**
   * Base project directory. Joined with the optional extra path segments.
   */
  public baseDir(...segments: string[]): string {
    return path.join(this.projectBaseDir, ...segments);
  }

  /**
   * Returns a duplicate of the project. Useful to avoid caching packages
   * and other files when in a long-lived process (like the dev server).
   */
  public clone(): Project {
    return new Project(this.profileFile, this.projectBaseDir);
  }
}
