import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { IVideoPositionOptions } from '@mcph/miix-std/dist/internal';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest as combineLatestObs } from 'rxjs/observable/combineLatest';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  publishReplay,
  refCount,
} from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { ControlStateSyncService } from '../../controls/sync/control-state-sync.service';
import { LayoutActionTypes } from '../../layout/layout.actions';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { IBlock, IDevice } from '../devices';
import { SetEffectiveDimensions } from '../emulation.actions';
import {
  emulationState,
  IEmulationState,
  selectDevice,
  selectEffectiveDimensions,
} from '../emulation.reducer';

/**
 * One random background is chosen eac
 */
const backgrounds = [
  'https://mixer.com/_latest/assets/img/backgrounds/generic-001.jpg',
  'https://mixer.com/_latest/assets/img/backgrounds/generic-002.jpg',
  'https://mixer.com/_latest/assets/img/backgrounds/generic-art-001.jpg',
  'https://mixer.com/_latest/assets/img/backgrounds/generic-coding-001.jpg',
];

/**
 * The EmulationContainerComponent hosts the frame containing the developer's controls.
 */
@Component({
  selector: 'emulation-container',
  templateUrl: './emulation-container.component.html',
  styleUrls: ['./emulation-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmulationContainerComponent implements AfterContentInit, OnDestroy {
  /**
   * Padding in all directions within the frame.
   */
  public static readonly padding = 32;

  /**
   * Aspect ratio of the fitted, virtual video.
   */
  public static readonly videoRatio = 16 / 9;

  /**
   * Background to display behind the frame.
   */
  public readonly background: SafeStyle = this.sanitizer.bypassSecurityTrustStyle(
    `url('${backgrounds[Math.floor(backgrounds.length * Math.random())]}')`, // tslint:disable-line
  );

  /**
   * The control block for the current device. This is separate from the
   * "stubs" as we don't want to *ngFor it to avoid refreshes during resizes.
   */
  public controlsBlock: IBlock;

  /**
   * List of blocks *other than* the control block for the current device.
   */
  public stubBlocks: IBlock[];

  /**
   * Device "frame" to display.
   */
  public state = this.store.select(selectEffectiveDimensions).pipe(filter(Boolean));

  /**
   * The currently selected device.
   */
  public device: Observable<IDevice> = this.store.select(selectDevice);

  /**
   * Fired when something that happens chat changes the layout.
   */
  public layoutResized = combineLatestObs(
    this.store
      .select(emulationState)
      .pipe(
        distinctUntilChanged(
          (a, b) => a.device === b.device && a.effectiveDimensions === b.effectiveDimensions,
        ),
      ),
    this.actions.ofType(LayoutActionTypes.SET_GOLDEN_LAYOUT),
    state => state,
  );

  /**
   * Observable for the computed video position, fitted with a 16:9 ratio into
   * the bounds provided by the controls.
   */
  public videoFilledSize = this.controls
    .getVideoSize()
    .pipe(
      combineLatest(this.layoutResized),
      debounceTime(1),
      map(([rect]) => this.getFittedVideo(rect)),
      filter(rect => !!rect),
      publishReplay(1),
      refCount(),
    );

  constructor(
    private readonly actions: Actions,
    public readonly el: ElementRef,
    private readonly cdRef: ChangeDetectorRef,
    private readonly store: Store<fromRoot.IState>,
    private readonly sanitizer: DomSanitizer,
    public readonly controls: ControlStateSyncService,
  ) {}

  public ngAfterContentInit() {
    this.layoutResized
      .pipe(debounceTime(1), untilDestroyed(this))
      .subscribe(state => this.refreshBlocks(state));

    this.videoFilledSize
      .pipe(untilDestroyed(this))
      .subscribe(rect => this.controls.updateFittedVideoSize(rect!));
  }

  public ngOnDestroy() {
    /* noop */
  }

  private refreshBlocks({ device, orientation, effectiveDimensions }: IEmulationState) {
    const el = (<HTMLElement>this.el.nativeElement).getBoundingClientRect();
    const blocks = device.display(
      el.width - 2 * EmulationContainerComponent.padding,
      el.height - 2 * EmulationContainerComponent.padding,
      orientation,
    );

    if (!effectiveDimensions || !effectiveDimensions.wasManual) {
      this.store.dispatch(
        new SetEffectiveDimensions({
          width: Math.round(blocks.reduce((max, b) => Math.max(max, b.width + b.x), 0)),
          height: Math.round(blocks.reduce((max, b) => Math.max(max, b.height + b.y), 0)),
          wasManual: false,
        }),
      );
    }

    const controlBlock = blocks.find(b => b.type === 'controls');
    if (!controlBlock) {
      throw new Error('Could not find control block for current layout');
    }

    this.stubBlocks = blocks.filter(b => b.type !== 'controls');
    this.controlsBlock = controlBlock;
    this.cdRef.markForCheck();
    this.cdRef.detectChanges();
  }

  private getFittedVideo(rect: IVideoPositionOptions): ClientRect | null {
    const videoBlock = (<HTMLElement>this.el.nativeElement).querySelector('.frame-backdrop');
    if (!videoBlock) {
      return null;
    }

    const backdropRect = videoBlock.getBoundingClientRect();
    const out = {
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      width: 0,
      height: 0,
      ...rect,
    };

    // Normalize any bottom/right bounds to width/height to make things easier.

    if (!out.width) {
      out.width = backdropRect.width - out.left - out.right;
      delete out.right;
    }
    if (!rect.height) {
      out.height = backdropRect.height - out.top - out.bottom;
      delete out.bottom;
    }

    if (out.width / out.height > EmulationContainerComponent.videoRatio) {
      const newWidth = out.height * EmulationContainerComponent.videoRatio;
      out.left = out.left + (out.width - newWidth) / 2;
      out.width = newWidth;
    } else {
      const newHeight = out.width / EmulationContainerComponent.videoRatio;
      out.top = out.top + (out.height - newHeight) / 2;
      out.height = newHeight;
    }

    out.right = backdropRect.width - backdropRect.left;
    out.bottom = backdropRect.height - backdropRect.top;

    return out;
  }
}
