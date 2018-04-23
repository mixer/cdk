import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { cloneDeep } from 'lodash';
import { stringify } from 'querystring';
import { switchMap, take, tap, withLatestFrom } from 'rxjs/operators';

import { MatSnackBar } from '@angular/material';
import { currentUser } from './account/account.reducer';
import { CommonMethods } from './bedrock.actions';
import * as forRoot from './bedrock.reducers';
import { AppConfig } from './editor.config';
import { ElectronService, RpcError } from './electron.service';
import { unindent } from './shared/ds';
import { Electron } from './shared/electron';

/**
 * Removes complex/unnecessary objects from the given state, for issue
 * reporting.
 */
function simplifyState(state: forRoot.IState) {
  const cloned: any = cloneDeep(state);
  delete cloned.layout.goldenLayout;
  return cloned;
}

/**
 * Maximum number of characters to include in stacktraces / bodies.
 */
const maxCharacters = 256;

function truncate(text: string, toMax: number = maxCharacters, trailer: string = '...') {
  if (text.length < toMax) {
    return text;
  }

  return text.slice(0, toMax - trailer.length) + trailer;
}

/**
 * The IssueService provides utilities for the user to report an issue
 * with the application.
 */
@Injectable()
export class IssueService {
  constructor(
    private readonly electron: ElectronService,
    private readonly store: Store<forRoot.IState>,
    private readonly snack: MatSnackBar,
  ) {}

  /**
   * Opens a window to report a Github issue.
   */
  public reportIssue(title: string, body: string, metadata?: any) {
    this.sendReport(title, truncate(body), metadata);
  }

  /**
   * Wraps and reports an error that occurred from an electron service.
   */
  public reportRpcError(title: string, err: RpcError, metadata?: any) {
    this.sendReport(title, truncate(JSON.stringify(err, null, 2)), metadata);
  }

  private sendReport(title: string, body: string, metadata?: any) {
    const snack = this.snack.open('Recording error details...');

    this.store
      .pipe(
        take(1),
        switchMap(state =>
          this.electron
            .call<string>(CommonMethods.EncryptString, {
              state: simplifyState(state),
              metadata,
            })
            .catch(() => null),
        ),
        tap(() => snack.dismiss()),
        withLatestFrom(this.store.select(currentUser)),
      )
      .subscribe(([encrypted, user]) => {
        body = unindent(`
          ### Steps to Reproduce

          <!-- Add your reproduction steps here! -->

          ### Error

          ${body}

          ### Editor Details

          **Version**: ${AppConfig.version}
          **Mixer User ID**: ${user ? user.id : 'Anonymous'}
          <!-- We encrypted and stored information about editor's state. Only
            Mixer can read it, and only if you include the below data in your
            issue. You can delete it if you need to. -->
          **Encrypted Editor State**: \`${encrypted ? JSON.stringify(encrypted) : 'FAILED'}\`
        `);

        const url = `https://github.com/mixer/miix-cli/issues/new?${stringify({ title, body })}`;
        Electron.shell.openExternal(url);
      });
  }
}
