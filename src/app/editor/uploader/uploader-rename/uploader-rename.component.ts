import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AsyncValidatorFn, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material';
import { Store } from '@ngrx/store';
import { timer } from 'rxjs/observable/timer';
import { map, switchMap, take } from 'rxjs/operators';

import * as forAccount from '../../account/account.actions';
import { CommonMethods } from '../../bedrock.actions';
import * as fromRoot from '../../bedrock.reducers';
import { ElectronService } from '../../electron.service';
import * as forProject from '../../project/project.actions';
import * as fromProject from '../../project/project.reducer';
import { projectNameValidator } from '../../shared/validators';
import { OpenUploader, StartUploading } from '../uploader.actions';

/**
 * Presents a brief into to uploading and allows users to select what
 * things they want to upload.
 */
@Component({
  selector: 'uploader-rename',
  templateUrl: './uploader-rename.component.html',
  styleUrls: ['./uploader-rename.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploaderRenameComponent {
  /**
   * Form for input validation.
   */
  public form: FormGroup;

  constructor(
    public readonly dialogRef: MatDialogRef<any>,
    private readonly store: Store<fromRoot.IState>,
    private readonly formBuilder: FormBuilder,
    private readonly electron: ElectronService,
  ) {
    this.store
      .select(fromProject.projectState)
      .pipe(map(p => p.project && p.project.packageJson.name), take(1))
      .subscribe(previousName => {
        this.form = this.formBuilder.group({
          projectName: [
            previousName || '',
            [Validators.required, projectNameValidator],
            this.checkProjectNameAvailable,
          ],
        });
      });
  }

  public getInput(name: string) {
    return this.form.get(name)!;
  }

  public submit() {
    this.store.dispatch(new forProject.RenameProject(this.form.value.projectName));
    this.store.dispatch(new StartUploading());
  }

  public switchAccounts() {
    this.dialogRef.close();
    this.store.dispatch(new forAccount.SwitchAccounts(new OpenUploader()));
  }

  private checkProjectNameAvailable: AsyncValidatorFn = control => {
    return timer(750).pipe(
      switchMap(() =>
        this.electron.call(CommonMethods.CheckBundleNameTaken, { name: control.value }),
      ),
      map(taken => (taken ? { projectNameTaken: { value: control.value } } : null)),
    );
  };
}
