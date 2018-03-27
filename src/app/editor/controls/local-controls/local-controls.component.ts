import {
  // AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { WebpackState } from '../controls.actions';
import * as fromControls from '../controls.reducer';

// import { LocalStateSyncService } from './local-state-sync.service';

/**
 * The LocalControlsComponent hosts the frame containing
 * the developer's local controls.
 */
@Component({
  selector: 'local-controls',
  template: '<iframe frameborder="0" [iframeSrc]="instance" #iframe></iframe>',
  styleUrls: ['../controls.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // providers: [LocalStateSyncService],
})
export class LocalControlsComponent {
  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  /**
   * Currently attached webpack instance.
   */
  public readonly instance = this.store.select(fromControls.controlState).pipe(
    // Wait until we get past the "starting" stage, before this point the
    // server may not exist and loading the iframe will result in an error.
    filter(
      state =>
        [WebpackState.Compiled, WebpackState.HadError].includes(state.webpackState) &&
        !!state.instance,
    ),
    map(({ instance }) => instance!.address),
    distinctUntilChanged(),
    map(address => `${address}?${Date.now()}`),
  );

  constructor(private readonly store: Store<fromRoot.IState>) {}

  // constructor(public sync: LocalStateSyncService) {}

  // public ngAfterContentInit() {
  //   this.sync.bind(<HTMLIFrameElement>this.iframe.nativeElement);
  // }
}
