import { Injectable } from '@angular/core';
import { Actions, Effect } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { of } from 'rxjs/observable/of';
import { debounceTime, map, switchMap } from 'rxjs/operators';

import * as fromRoot from '../bedrock.reducers';
import { ElectronService } from '../electron.service';
import { ProjectActionTypes, SetOpenProject } from '../project/project.actions';
import { withLatestDirectory } from '../project/project.reducer';
import {
  DeleteSnapshot,
  initialWorld,
  ISnapshot,
  LoadSnapshot,
  SaveSnapshot,
  SchemaActionTypes,
  SchemaMethod,
  SnapshotCreated,
  UpdateWorldSchema,
  workingSnapshoptName,
} from './schema.actions';

/**
 * Effects module for account actions.
 */
@Injectable()
export class SchemaEffects {
  /**
   * Fired to load snapshots when we first open a project.
   */
  @Effect()
  public readonly loadOnProjectOpen = this.actions
    .ofType<SetOpenProject>(ProjectActionTypes.SET_OPEN_PROJECT)
    .pipe(
      switchMap(({ project }) =>
        this.electron.call<ISnapshot[]>(SchemaMethod.ListSnapshots, {
          directory: project.directory,
        }),
      ),
      switchMap(snapshots => {
        let mostRecent = snapshots.find(s => s.name === workingSnapshoptName);
        if (!mostRecent) {
          mostRecent = {
            name: workingSnapshoptName,
            world: initialWorld,
            savedAt: Date.now(),
          };
        }

        return of<Action>(new SnapshotCreated(snapshots), new LoadSnapshot(mostRecent));
      }),
    );

  /**
   * Runs the action to save a snapshot.
   */
  @Effect()
  public readonly saveSnapshot = this.actions
    .ofType<SaveSnapshot>(SchemaActionTypes.SAVE_SNAPSHOT)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([action, directory]) =>
        this.electron.call<ISnapshot>(SchemaMethod.SaveSnapshot, {
          name: action.name,
          world: action.world,
          directory,
        }),
      ),
      map(snapshot => new SnapshotCreated([snapshot])),
    );

  /**
   * Runs the action to delete a snapshot.
   */
  @Effect({ dispatch: false })
  public readonly deleteSnapshopt = this.actions
    .ofType<DeleteSnapshot>(SchemaActionTypes.DELETE_SNAPSHOT)
    .pipe(
      withLatestDirectory(this.store),
      switchMap(([{ name }, directory]) =>
        this.electron.call<ISnapshot>(SchemaMethod.DeleteSnapshot, { name, directory }),
      ),
    );

  /**
   * Persists changes to the control schema as it changes.
   */
  @Effect()
  public readonly saveUpdatedWorld = this.actions
    .ofType<UpdateWorldSchema>(SchemaActionTypes.UPDATE_WORLD_SCHEMA)
    .pipe(
      debounceTime(500),
      withLatestDirectory(this.store),
      switchMap(([{ world }, directory]) =>
        this.electron.call<ISnapshot>(SchemaMethod.SaveSnapshot, {
          name: workingSnapshoptName,
          directory,
          world,
        }),
      ),
      map(snapshot => new SnapshotCreated([snapshot])),
    );

  constructor(
    private readonly actions: Actions,
    private readonly store: Store<fromRoot.IState>,
    private readonly electron: ElectronService,
  ) {}
}
