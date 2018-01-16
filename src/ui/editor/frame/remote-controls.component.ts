import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import * as json5 from 'json5';
import { throttle } from 'lodash';
import { IInteractiveJoin } from '../redux/connect';
import { ControlStateSyncService } from './control-state-sync.service';

import 'rxjs/add/operator/combineLatest';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/take';
import '../util/takeUntilDestroyed';

import { ICloseData, Participant } from '@mcph/miix-std/dist/participant';
import { ConsoleService } from '../console/console.service';
import { IProject, ProjectService } from '../redux/project';
import { exists } from '../util/ds';

/**
 * The RemoteControlsComponent hosts the frame containing remote Interactive
 * controls.
 */
@Component({
  selector: 'editor-remote-controls',
  template: '<iframe frameborder="0" #iframe></iframe>',
  styleUrls: ['./controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RemoteControlsComponent implements AfterContentInit, OnDestroy {
  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  /**
   * Participant socket interface.
   */
  private participant: Participant | undefined;

  constructor(
    private readonly store: Store<IProject>,
    private readonly snackRef: MatSnackBar,
    private readonly project: ProjectService,
    private readonly controls: ControlStateSyncService,
    private readonly console: ConsoleService,
  ) {}

  public ngAfterContentInit() {
    this.store
      .select(state => state.connect.join)
      .filter(exists)
      .takeUntilDestroyed(this)
      .distinctUntilChanged((a, b) => a.address === b.address)
      .combineLatest(this.controls.getRefresh().startWith(undefined))
      .subscribe(([join]) => {
        this.startConnect(join);
      });
  }

  public ngOnDestroy() {
    if (this.participant) {
      this.participant.destroy();
      this.participant = undefined;
    }
  }

  @HostListener('window:keydown', ['$event'])
  public onExit(ev: KeyboardEvent) {
    if (ev.keyCode === 27) {
      // escape
      this.project.disconnectControls();
    }
  }

  /**
   * startConnect is called when we get interactive join data from the state.
   */
  private startConnect(join: IInteractiveJoin) {
    this.store
      .map(state => state.code.participant)
      .take(1)
      .map(participant => {
        const xAuthUser = { ID: 1, Username: 'tester' };
        try {
          const parsed = json5.parse(participant.join('\n'));
          xAuthUser.ID = parsed.userID;
          xAuthUser.Username = parsed.username;
        } catch (_e) {
          // ignored. We try to parse it to be nice but no biggie if we can't
        }

        return xAuthUser;
      })
      .combineLatest(this.controls.getSettings())
      .takeUntilDestroyed(this)
      .subscribe(([xAuthUser, settings]) => {
        if (this.participant) {
          this.participant.destroy();
        }

        const iframe = <HTMLIFrameElement>this.iframe.nativeElement;
        this.participant = new Participant(iframe, settings)
          .on('loaded', () => {
            this.afterConnect();
          })
          .on('close', close => {
            this.onClose(close);
          })
          .on(
            'transmit',
            throttle(() => {
              this.onTransmit();
            }, 50),
          )
          .on('moveVideo', size => {
            this.controls.setVideoSize(size);
          })
          .on('unload', () => {
            this.controls.requestRefresh();
          })
          .on('log', data => {
            this.console.addLog(data);
          })
          .connect({
            contentAddress: '/?',
            socketAddress: join.address,
            ugcAddress: join.ugcAddress,
            xAuthUser,
            key: join.key,
          });

        this.participant.runOnRpc(rpc => {
          this.console.bindToRPC(rpc);
        });
      });
  }

  /**
   * Called when the participant socket closes, for any reason.
   */
  private onClose(close: ICloseData) {
    if (close.expected) {
      // webpack reloaded the controls
      return;
    }

    this.snackRef.open(
      `The interactive connection was closed with code ${close.code}${close.message
        ? `: ${close.message}`
        : ''}`,
      undefined,
      { duration: 8000 },
    );

    this.project.disconnectControls();
  }

  /**
   * Called after the pariticipant socket opens.
   */
  private afterConnect() {
    this.snackRef.open('Connected! Press ESC to exit Interactive.', undefined, { duration: 2000 });
  }

  /**
   * Called whenever a packet is transmitted over the Interactive connection.
   */
  private onTransmit() {
    if (!this.participant) {
      return; // could have closed before the throttle fired
    }

    this.participant
      .dumpState()
      .then(dump => {
        if (dump) {
          this.project.setControlsState(dump);
        }
      })
      .catch(() => undefined); // ignored
  }
}
