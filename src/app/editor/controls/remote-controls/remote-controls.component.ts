import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ICloseData, Participant } from '@mixer/cdk-std/dist/participant';
import { Store } from '@ngrx/store';
import { throttle } from 'lodash';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  startWith,
  withLatestFrom,
} from 'rxjs/operators';

import { MatSnackBar } from '@angular/material';
import { Subject } from 'rxjs/Subject';
import * as fromRoot from '../../bedrock.reducers';
import { selectISettings } from '../../emulation/emulation.reducer';
import {
  IInteractiveJoin,
  RemoteState,
  SetRemoteState,
  SetStateDump,
} from '../../remote-connect/remote-connect.actions';
import * as fromRemote from '../../remote-connect/remote-connect.reducer';
import { selectParticipant } from '../../schema/schema.reducer';
import { truthy, untilDestroyed } from '../../shared/operators';
import { BaseStateSyncService } from '../sync/base-state-sync.service';
import { LocalStateSyncService } from '../sync/local-state-sync.service';

/**
 * The LocalControlsComponent hosts the frame containing
 * the developer's local controls.
 */
@Component({
  selector: 'remote-controls',
  templateUrl: './remote-controls.component.html',
  styleUrls: ['../controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LocalStateSyncService],
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
    private readonly store: Store<fromRoot.IState>,
    private readonly sync: BaseStateSyncService,
    private readonly snack: MatSnackBar,
  ) {}

  public ngAfterContentInit() {
    this.store
      .select(fromRemote.selectJoin)
      .pipe(
        truthy(),
        untilDestroyed(this),
        distinctUntilChanged((a, b) => a.address === b.address && a.key === b.key),
        combineLatest(this.sync.refresh.pipe(startWith(undefined))),
      )
      .subscribe(([join]) => {
        this.startConnect(join);
      });
  }

  @HostListener('window:keydown', ['$event'])
  public onExit(ev: KeyboardEvent) {
    // escape
    if (ev.keyCode === 27) {
      this.markDisconnected();
    }
  }

  public ngOnDestroy() {
    if (this.participant) {
      this.participant.destroy();
      this.participant = undefined;
    }
  }

  /**
   * startConnect is called when we get interactive join data from the state.
   */
  private startConnect(join: IInteractiveJoin) {
    const changed = new Subject<void>();

    this.sync.controlsAddress
      .pipe(
        withLatestFrom(
          this.store.select(selectParticipant).pipe(
            map(participant => ({
              ID: participant.userID || 1,
              Username: participant.username || 'tester',
            })),
          ),
          this.store.select(selectISettings),
        ),
        untilDestroyed(this),
      )
      .subscribe(
        ([address, xAuthUser, settings]) => {
          if (this.participant) {
            changed.next();
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
            .on('unload', () => {
              this.sync.refresh.next();
            })
            .connect({
              contentAddress: address,
              socketAddress: join.address,
              ugcAddress: join.ugcAddress,
              xAuthUser,
              key: join.key,
            });

          this.participant.runOnRpc(rpc => {
            this.sync.attachInternalMethods(rpc);
          });
        },
        undefined,
        () => changed.next(),
      );
  }

  /**
   * Called when the participant socket closes, for any reason.
   */
  private onClose(close: ICloseData) {
    if (close.expected) {
      // webpack reloaded the controls
      return;
    }

    this.snack.open(
      `The interactive connection was closed with code ${close.code}${
        close.message ? `: ${close.message}` : ''
      }`,
      undefined,
      { duration: 8000 },
    );

    this.markDisconnected();
  }

  /**
   * Called after the pariticipant socket opens.
   */
  private afterConnect() {
    this.snack.open('Connected! Press ESC to exit Interactive.', undefined, { duration: 2000 });
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
          this.store.dispatch(new SetStateDump(dump));
        }
      })
      .catch(() => undefined); // ignored
  }

  /**
   * Called to signal the UI that the remote controls are no longer attached.
   */
  private markDisconnected() {
    this.store.dispatch(new SetRemoteState(RemoteState.Disconnected));
  }
}
