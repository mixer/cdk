import { IFullInteractiveVersion, IInteractiveGame } from '../app/editor/project/project.actions';
import { IWorld } from '../app/editor/schema/schema.actions';
import { UnexpectedHttpError } from './errors';
import { Project } from './project';
import { Fetcher } from './util';

const storageKey = 'linkedInteractiveGame';

/**
 * Handles retrieving information about projects and linking them to a
 * control bundle.
 */
export class ProjectLinker {
  constructor(private readonly project: Project) {}

  /**
   * Gets all interactive games the user owns.
   */
  public async getOwnedGames(): Promise<IInteractiveGame[]> {
    const user = await this.project.profile.user();
    const fetcher = new Fetcher().with(await this.project.profile.tokens());

    let output: IInteractiveGame[] = [];
    for (let page = 0; true; page++) {
      // tslint:disable-line
      const next = await fetcher.json(
        'get',
        `/interactive/games/owned?user=${user.id}&page=${page}`,
      );
      const contents = await next.json();
      if (!contents.length) {
        break;
      }

      output = output.concat(contents);
    }

    return output;
  }

  /**
   * Tries to link an interactive game to control bundle. Note: we're getting
   * rid of versions eventually, so we just link to the most recent version
   * of the game.
   */
  public async linkGame(game: IInteractiveGame) {
    const packageJson = await this.project.packageJson();
    await this.project.saveSetting(storageKey, game);
    await this.updateLatestVersion(game, {
      bundle: `${packageJson.name}_${packageJson.version}`,
    });
  }

  /**
   * Gets rid of any previous game link.
   */
  public async unlinkGame() {
    await this.project.saveSetting(storageKey, undefined);
  }

  /**
   * Returns the linked Interactive game if any.
   */
  public async getLinked(): Promise<IInteractiveGame | null> {
    return this.project.loadSetting<IInteractiveGame>(storageKey);
  }

  /**
   * Updates a game's schema.
   */
  public async setSchema(game: IInteractiveGame, schema: IWorld): Promise<void> {
    await this.updateLatestVersion(game, { controls: schema });
  }

  /**
   * Returns full details about the latest version of the interactive game.
   */
  public async getFullVersion(game: IInteractiveGame): Promise<IFullInteractiveVersion> {
    const fetcher = new Fetcher().with(await this.project.profile.tokens());
    const topVersion = game.versions.sort((a, b) => b.id - a.id)[0];
    const response = await fetcher.json('get', `/interactive/versions/${topVersion.id}`);
    if (response.status >= 400) {
      throw new UnexpectedHttpError(response, await response.text());
    }

    return response.json();
  }

  private async updateLatestVersion(
    game: IInteractiveGame,
    update: Partial<IFullInteractiveVersion>,
  ) {
    const fetcher = new Fetcher().with(await this.project.profile.tokens());
    const topVersion = game.versions.sort((a, b) => b.id - a.id)[0];

    const response = await fetcher.json('put', `/interactive/versions/${topVersion.id}`, update);

    if (response.status >= 400) {
      throw new UnexpectedHttpError(response, await response.text());
    }
  }
}
