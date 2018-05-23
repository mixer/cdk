import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { DomSanitizer, SafeStyle } from '@angular/platform-browser';
import { IVideoPositionOptions } from '@mixer/cdk-std/dist/internal';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { mapValues } from 'lodash';
import { Observable } from 'rxjs/Observable';
import { combineLatest as combineLatestObs } from 'rxjs/observable/combineLatest';
import {
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  startWith,
} from 'rxjs/operators';

import * as fromRoot from '../../bedrock.reducers';
import { LayoutActionTypes } from '../../layout/layout.actions';
import { truthy, untilDestroyed } from '../../shared/operators';
import { IBlock, IDevice } from '../devices';
import { SetEffectiveDimensions, SetFittedVideoSize } from '../emulation.actions';
import {
  emulationState,
  IEmulationState,
  selectDevice,
  selectedMovedVideo,
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

const defaultVideoPosition: { [key in keyof IVideoPositionOptions]: string } = {
  width: 'auto',
  height: 'auto',
  left: 'auto',
  right: 'auto',
  top: 'auto',
  bottom: 'auto',
};

/**
 * Returns a ClientRect for a 16:9 video fitted inside the target rect.
 */
function getFittedBounds(boundingRect: ClientRect, videoRatio: number = 16 / 9) {
  const output = {
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  };

  if (boundingRect.width / boundingRect.height > videoRatio) {
    const newWidth = boundingRect.height * videoRatio;
    output.width = newWidth;
    output.left = boundingRect.left + (boundingRect.width - newWidth) / 2;
    output.height = boundingRect.height;
    output.top = 0;
  } else {
    const newHeight = boundingRect.width / videoRatio;
    output.width = boundingRect.width;
    output.left = 0;
    output.height = newHeight;
    output.top = boundingRect.top + (boundingRect.height - newHeight) / 2;
  }

  return output;
}

/**
 * Normalizes the CDK IVideoPositionOptions to style strings that can
 * be applied to an element.
 */
function videoOptionsToStyles(position: IVideoPositionOptions) {
  return mapValues(
    { ...defaultVideoPosition, ...position },
    value => (typeof value === 'number' && value !== -1 ? `${value}px` : String(value)),
  );
}

/**
 * The EmulationContainerComponent hosts the frame containing the developer's controls.
 */
@Component({
  selector: 'emulation-container',
  templateUrl: './emulation-container.component.html',
  styleUrls: ['./emulation-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmulationContainerComponent implements AfterViewInit, OnDestroy {
  /**
   * Padding in all directions within the frame.
   */
  public static readonly padding = 32;

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
   * Whether the stub blocks contains the video element.
   */
  public hasStubbedVideo = false;

  /**
   * Device "frame" to display.
   */
  public state = this.store.select(selectEffectiveDimensions).pipe(truthy());

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
          (a, b) =>
            a.device === b.device &&
            a.effectiveDimensions === b.effectiveDimensions &&
            a.orientation === b.orientation,
        ),
      ),
    this.actions.ofType(LayoutActionTypes.PANELS_SAVE).pipe(startWith(<any>null)),
    state => state,
  );

  /**
   * Container for the video
   */
  @ViewChildren('videoBlock') public videoBlock: QueryList<ElementRef>;

  constructor(
    private readonly actions: Actions,
    public readonly el: ElementRef,
    private readonly cdRef: ChangeDetectorRef,
    private readonly store: Store<fromRoot.IState>,
    private readonly sanitizer: DomSanitizer,
  ) {}

  public ngAfterViewInit() {
    this.layoutResized
      .pipe(debounceTime(1), untilDestroyed(this))
      .subscribe(state => this.refreshBlocks(state));

    this.store
      .select(selectedMovedVideo)
      .pipe(
        combineLatest(this.videoBlock.changes, this.layoutResized),
        debounceTime(1),
        filter(() => !!this.videoBlock.first),
      )
      .subscribe(([position]) => {
        const container: HTMLElement = this.videoBlock.first.nativeElement;
        const video = <HTMLElement>container.children[0];
        Object.assign(container.style, videoOptionsToStyles(position));

        const fittedVideoBounds = getFittedBounds(container.getBoundingClientRect());
        Object.keys(fittedVideoBounds).forEach(
          (key: keyof typeof fittedVideoBounds) =>
            ((<any>video.style)[key] = `${fittedVideoBounds[key]}px`),
        );

        this.store.dispatch(new SetFittedVideoSize(<ClientRect>fittedVideoBounds));
      });
  }

  public ngOnDestroy() {
    /* noop */
  }

  private refreshBlocks({ device, orientation, effectiveDimensions }: IEmulationState) {
    const wasManual = !!effectiveDimensions && effectiveDimensions.wasManual;
    let { width, height } = (<HTMLElement>this.el.nativeElement).getBoundingClientRect();
    if (wasManual) {
      width = effectiveDimensions!.width;
      height = effectiveDimensions!.height;
    } else {
      width -= 2 * EmulationContainerComponent.padding;
      height -= 2 * EmulationContainerComponent.padding;
    }

    const blocks = device.display(width, height, wasManual, orientation);
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
    this.hasStubbedVideo = blocks.some(b => b.type === 'video');
    this.controlsBlock = controlBlock;
    this.cdRef.markForCheck();
    this.cdRef.detectChanges();
  }
}
