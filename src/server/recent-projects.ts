import { FileDataStore, IDataStore } from './datastore';
import { Project } from './project';

export interface IRecentProject {
  name: string;
  url: string;
}

export class RecentProjects {
  constructor(private readonly store: IDataStore = new FileDataStore()) {}

  public async loadProjects(): Promise<IRecentProject[] | null> {
    return await this.store.loadGlobal<IRecentProject[]>('recent');
  }

  public async updateProjects(url: string): Promise<void> {
    let projects = await this.loadProjects();
    if (!projects) {
      projects = [];
    }
    const project = new Project(url);
    const pkg = await project.packageJson();
    const name = pkg.name;

    const index = projects.findIndex(e => e.url === url);

    if (index >= 0) {
      projects.splice(index, 1);
    }

    const newProjects: IRecentProject[] = [
      {
        name,
        url,
      },
    ];

    for (let i = 0; i < 4; i++) {
      if (projects[i]) {
        newProjects.push(projects[i]);
      }
    }

    return await this.store.saveGlobal('recent', newProjects);
  }
}
