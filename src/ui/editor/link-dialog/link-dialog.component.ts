import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Http } from '@angular/http';
import { MatDialogRef } from '@angular/material';
import * as moment from 'moment';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { HttpErrorService } from '../http-error.service';
import { IInteractiveVersion, IInteractiveVersionWithGame } from '../redux/sync';
import { apiUrl } from '../util/env';
import { MemorizingSubject } from '../util/memorizingSubject';

export enum State {
  LoggingIn,
  Loading,
  Selecting,
}

/**
 * Partial typings for an InteractiveProject resource on Mixer.
 * {@see https://dev.mixer.com/rest.html#InteractiveGame}
 */
export interface IGameWithNestedVersions {
  name: string;
  versions: IInteractiveVersion[];
}

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'link-dialog',
  templateUrl: './link-dialog.component.html',
  styleUrls: ['../dialog.scss', './link-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkDialogComponent {
  /**
   * Exposed State enum for the template to consume.
   */
  public State = State; // tslint:disable-line

  /**
   * Curre state of the component.
   */
  public state = new BehaviorSubject(State.LoggingIn);

  /**
   * List of interactive projects the user owns.
   */
  public projects = new MemorizingSubject<IGameWithNestedVersions[]>();

  /**
   * Currently expanded project, listing its owned versions.
   */
  public expandedProject = new BehaviorSubject(0);

  constructor(
    private readonly http: Http,
    private readonly httpErr: HttpErrorService,
    private readonly dialogRef: MatDialogRef<IInteractiveVersionWithGame>,
  ) {}

  public onLoggedIn() {
    this.state.next(State.Loading);
    this.loadProjects();
  }

  /**
   * getLastUpdatedAgo returns the "time ago" of the last updated version
   * of the game.
   */
  public getLastUpdatedAgo(game: IGameWithNestedVersions): string {
    const timestamp = this.getLastUpdatedDate(game);
    if (timestamp === 0) {
      return 'never';
    }

    return this.getTimeAgo(timestamp);
  }

  /**
   * Returns the "time ago" of the given date / timestamp.
   */
  public getTimeAgo(date: string | number) {
    return moment(date).fromNow();
  }

  /**
   * getLastUpdatedDate returns the most recent updatedAt of a version of
   * the Interactive game, returning 0 if there are no attached versions.
   */
  public getLastUpdatedDate(game: IGameWithNestedVersions): number {
    const mostRecentUpdate = game.versions
      .map(version => new Date(version.updatedAt))
      .sort((a, b) => a.getTime() - b.getTime())
      .pop();

    return mostRecentUpdate ? mostRecentUpdate.getTime() : 0;
  }

  /**
   * Chooses the version to link, and closes the dialog.
   */
  public select(interactiveVersion: IInteractiveVersion, game: IGameWithNestedVersions) {
    this.http
      .post(apiUrl(`interactive-versions/${interactiveVersion.id}/link`), {})
      // Ignore any errors here, the link will fail if they haven't uploaded
      // their bundle yet.
      .subscribe(
        () => undefined,
        () => undefined,
        () => this.dialogRef.close({ ...interactiveVersion, game }),
      );
  }

  /**
   * Attempts to create a connection to Interactive. Closes the dialog
   * when it successfully does so.
   */
  private loadProjects() {
    this.http
      .get(apiUrl('interactive-versions'))
      .take(1)
      .retryWhen(this.httpErr.retryOnLoginError)
      .toPromise()
      .then(res => {
        const games: IGameWithNestedVersions[] = res.json();
        games.sort((a, b) => this.getLastUpdatedDate(b) - this.getLastUpdatedDate(a));
        this.projects.next(games);
        this.state.next(State.Selecting);
      })
      .catch(this.httpErr.toast);
  }
}
