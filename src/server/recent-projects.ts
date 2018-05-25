import { FileDataStore, IDataStore } from './datastore';
import { Project } from './project';

export interface IRecentProject {
  name: string;
  url: string;
}

/**
 * Loads and updates the recent projects used in CDK.
 */
export class RecentProjects {
  /**
   * Maximum number of recent projects to store.
   */
  public static readonly maxRecentProject = 8;

  constructor(private readonly store: IDataStore = new FileDataStore()) {}

  public async loadProjects(): Promise<IRecentProject[]> {
    return (await this.store.loadGlobal<IRecentProject[]>('recent')) || [];
  }

  /**
   * Removes a project from the list of recent projects.
   */
  public async removeProject(directory: string) {
    const projects = (await this.loadProjects()) || [];
    await this.store.saveGlobal('recent', projects.filter(p => p.url !== directory));
  }

  /**
   * Adds a project to the list of recent projects.
   */
  public async updateProjects(directory: string): Promise<void> {
    const projects = (await this.loadProjects()).filter(p => p.url !== directory);
    const pkg = await new Project(directory).packageJson();

    projects.unshift({
      name: pkg.name,
      url: directory,
    });

    return await this.store.saveGlobal(
      'recent',
      projects.slice(0, RecentProjects.maxRecentProject),
    );
  }
}
