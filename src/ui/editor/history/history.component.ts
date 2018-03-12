import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Http } from '@angular/http';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { HttpErrorService } from './../http-error.service';

import { getStoredData, IProject, ProjectService } from '../redux/project';
import { apiUrl } from '../util/env';
import { MemorizingSubject } from '../util/memorizingSubject';
import { reportHttpError } from '../util/report-issue';

export interface ISavedEntry {
  name: string;
  savedAt: moment.Moment;
  ago: string;
}

export interface ISwappedSave {
  backupState: Partial<IProject>;
  loadedSave: string;
}

interface IApiSaveEntry {
  savedAt: string;
  name: string;
}

/**
 * The code component displays the code editor for participants/control state/
 */
@Component({
  selector: 'editor-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  /**
   * When the user has an old save loaded out, we'll stash data about it
   * here so we can reload it again later.
   */
  public readonly swappedSave = new MemorizingSubject<ISwappedSave | null>();

  /**
   * An enumeration of the available save files.
   */
  public readonly saves: Observable<ISavedEntry[]> = this.http
    .get(apiUrl('saves'))
    .map(res => <IApiSaveEntry[]>res.json())
    .map(list =>
      list.reverse().map(entry => ({
        name: entry.name,
        savedAt: moment(entry.savedAt),
        ago: moment(entry.savedAt).fromNow(),
      })),
    )
    .retryWhen(this.httpErr.retryOnLoginError);

  constructor(
    private readonly store: Store<IProject>,
    private readonly project: ProjectService,
    private readonly http: Http,
    private readonly httpErr: HttpErrorService,
    private readonly snackRef: MatSnackBar,
  ) {}

  /**
   * Restores a backed up state.
   */
  public loadBackupState() {
    const { backupState } = this.swappedSave.getValue()!;
    this.project.replaceState(backupState, true);
    this.swappedSave.next(null);
  }

  /**
   * openSaveFile restores state from a previously saved version.
   */
  public openSaveFile(file: string) {
    Observable.combineLatest(this.http.get(apiUrl(`saves/${file}`)), this.store.map(getStoredData))
      .take(1)
      .switchMap(([next, previous]) =>
        this.http
          .post(apiUrl('saves'), previous)
          .do(() => this.swappedSave.next({ backupState: previous, loadedSave: file }))
          .mapTo(next),
      )
      .subscribe(
        state => this.project.replaceState(state.json().contents, true),
        err =>
          this.snackRef
            .open('An unknown error occurred', 'Report', { duration: 5000 })
            .onAction()
            .subscribe(() => {
              reportHttpError('Unknown error loading a save file', err);
            }),
      );
  }
}
