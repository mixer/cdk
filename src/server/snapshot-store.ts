import { ISnapshot, IWorld } from '../app/editor/schema/schema.actions';
import { FileDataStore, IDataStore } from './datastore';

const storeKey = 'worldSchema';

/**
 * Utility for handling saved schema snapshots.
 */
export class SnapshotStore {
  constructor(
    private readonly projectDirectory: string,
    private readonly datastore: IDataStore = new FileDataStore(),
  ) {}

  /**
   * Upserts a schema into the store. Returns the saved snapshot.
   */
  public async save(name: string, world: IWorld): Promise<ISnapshot> {
    const entry: ISnapshot = { name, world, savedAt: Date.now() };
    const list = (await this.list()).filter(e => e.name !== name);
    list.unshift(entry);
    await this.datastore.saveProject(storeKey, this.projectDirectory, list);

    return entry;
  }

  /**
   * Returns a list of all stored schema.
   */
  public async list(): Promise<ISnapshot[]> {
    return this.datastore.loadProject(storeKey, this.projectDirectory, []);
  }

  /**
   * Removes an existing saved project fromt he list.
   */
  public async destroy(name: string): Promise<void> {
    const list = await this.list();
    return this.datastore.saveProject(
      storeKey,
      this.projectDirectory,
      list.filter(e => e.name !== name),
    );
  }
}
