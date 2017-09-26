import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MdDialogRef } from '@angular/material';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export enum State {
  LoggingIn,
  Approving,
}

export interface IUploadSchemaResult {
  approved: boolean;
  dontShowAgain: boolean;
}

/**
 * The Launch Dialog prompts the user to log in, and connect to Interactive
 * for them. It calls back with connection details, or undefined if the dialog
 * was dismissed beforehand.
 */
@Component({
  selector: 'upload-schema-dialog',
  templateUrl: './upload-schema-dialog.component.html',
  styleUrls: ['../dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadSchemaDialogComponent {
  /**
   * Exposed State enum for the template to consume.
   */
  public State = State; // tslint:disable-line

  /**
   * Curre state of the component.
   */
  public state = new BehaviorSubject(State.LoggingIn);

  /**
   * Model for the "don't show this again" checkbox.
   */
  public dontShowAgain = false;

  constructor(private readonly dialogRef: MdDialogRef<IUploadSchemaResult>) {}

  public onLoggedIn() {
    this.state.next(State.Approving);
  }

  public onSelected(approved: boolean) {
    this.dialogRef.close(<IUploadSchemaResult>{
      approved,
      dontShowAgain: this.dontShowAgain,
    });
  }
}
