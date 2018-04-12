import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { stringify } from 'querystring';
import { combineLatest, switchMap, take } from 'rxjs/operators';

import { currentUser } from './account/account.reducer';
import { CommonMethods } from './bedrock.actions';
import * as forRoot from './bedrock.reducers';
import { AppConfig } from './editor.config';
import { ElectronService, RpcError } from './electron.service';
import { unindent } from './shared/ds';
import { Electron } from './shared/electron';
import { jsonifyPlain } from './shared/jsonify-plain';

/**
 * The IssueService provides utilities for the user to report an issue
 * with the application.
 */
@Injectable()
export class IssueService {
  constructor(
    private readonly electron: ElectronService,
    private readonly store: Store<forRoot.IState>,
  ) {}

  /**
   * Opens a window to report a Github issue.
   */
  public reportIssue(title: string, body: string) {
    this.store
      .pipe(
        take(1),
        switchMap(state =>
          this.electron
            .call<string>(CommonMethods.EncryptString, { data: jsonifyPlain(state) })
            .catch(() => null),
        ),
        combineLatest(this.store.select(currentUser)),
      )
      .subscribe(([state, user]) => {
        body = unindent(body);
        if (state) {
          body +=
            // tslint:disable-next-line
            '\n\n' +
            unindent(`
            ### Editor Details

            **Version**: ${AppConfig.version}
            **Mixer User ID**: ${user ? user.id : 'Anonymous'}

            <!-- This contains information about your editor's state. It is encrypted
              so that only Mixer can read it, but you can delete it if you want. -->

            \`\`\`
            ${state}
            \`\`\`
          `);
        }

        const url = `https://github.com/mixer/miix-cli/issues/new?${stringify({ title, body })}`;
        Electron.shell.openExternal(url);
      });
  }

  /**
   * Wraps and reports an error that occurred from an electron service.
   */
  public reportRpcError(title: string, err: RpcError) {
    this.reportIssue(
      title,
      `
      ### Steps to Reproduce

      <!-- Add your reproduction steps here! -->

      ### Error

      \`\`\`
      ${jsonifyPlain(err)}
      \`\`\`
    `,
    );
  }
}
