import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Actions, Effect } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { isEqual, pick } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { getStoredData, IProject, MetaActions } from './project';

import { apiUrl } from '../util/env';

const saveWhenChanged: (keyof IProject)[] = ['code', 'sync'];

/**
 * ngrx effector which saves changes to the state and loads initial
 * data from the history.
 */
@Injectable()
export class HistoryEffects {
  @Effect({ dispatch: false })
  public saveChanges: Observable<any> = this.actions
    .delay(1)
    .filter((action: any) => !action.omitSave)
    .switchMap(() => this.store.take(1).map(getStoredData))
    .pairwise()
    .filter(([a, b]) => !isEqual(pick(a, saveWhenChanged), pick(b, saveWhenChanged)))
    .debounceTime(3 * 1000)
    .switchMap(([, data]) => this.http.post(apiUrl('saves'), data));

  @Effect()
  public loadInitialState = this.actions
    .delay(1)
    .take(1)
    .switchMap(() => this.http.get(apiUrl('saves/latest')))
    .map(res => ({ type: MetaActions.ReplaceState, data: res.json().contents }))
    .catch(() => Observable.of(null))
    .filter(Boolean);

  constructor(private http: Http, private store: Store<IProject>, private actions: Actions) {}
}
