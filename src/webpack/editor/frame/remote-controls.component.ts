import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MdSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as json5 from 'json5';
import { throttle } from 'lodash';
import { IInteractiveJoin } from '../redux/connect';

import { Participant } from '../../../participant/participant';
import { ErrorCode } from '../../../stdlib/typings';
import { IProject, ProjectService } from '../redux/project';

/**
 * The RemoteControlsComponent hosts the frame containing remote Interactive
 * controls.
 */
@Component({
  selector: 'editor-local-controls',
  template: '<iframe frameborder="0" src="/"></iframe>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteControlsComponent implements AfterContentInit, OnDestroy {
  /**
   * Details on where to join Interactive.
   */
  @Input() public address: IInteractiveJoin;

  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  /**
   * Participant socket interface.
   */
  private participant: Participant;

  /**
   * Called whenever a packet is transmitted over the Interactive connection.
   */
  private onTransmit = throttle(() => {
    this.participant
      .dumpState()
      .then(dump => {
        if (dump) {
          this.project.setControlsState(dump);
        }
      })
      .catch(() => undefined); // ignored
  });

  constructor(
    private readonly store: Store<IProject>,
    private readonly snackRef: MdSnackBar,
    private readonly project: ProjectService,
  ) {}

  public ngAfterContentInit() {
    this.store.map(state => state.code.participant).take(1).subscribe(participant => {
      const xAuthUser = { ID: 1, Username: 'tester' };
      try {
        const parsed = json5.parse(participant.join('\n'));
        xAuthUser.ID = parsed.userID;
        xAuthUser.Username = parsed.username;
      } catch (_e) {
        // ignored. We try to parse it to be nice but no biggie if we can't
      }

      const p = new Participant(<HTMLIFrameElement>this.iframe.nativeElement).connect({
        xAuthUser,
        socketAddress: this.address.address,
        contentAddress: this.address.contentAddress,
      });

      p.on('loaded', () => {
        this.afterConnect();
      });
      p.on('close', code => {
        this.onClose(code);
      });
      p.on('transmit', this.onTransmit);
      this.participant = p;
    });
  }

  public ngOnDestroy() {
    this.participant.destroy();
  }

  /**
   * Called when the participant socket closes, for any reason.
   */
  public onClose(code: number) {
    this.snackRef.open(
      `The interactive connection was closed with code ${code}: ${ErrorCode[code] || 'UNKNOWN'}`,
    );

    this.project.disconnectControls();
  }

  /**
   * Called after the pariticipant socket opens.
   */
  private afterConnect() {
    this.snackRef.open('Connected! Press ESC to exit Interactive.');
  }
}
