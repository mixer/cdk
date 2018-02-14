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
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/delay';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import '../util/takeUntilDestroyed';

import { ConnectState } from '../redux/connect';
import { IFrameState } from '../redux/frame';
import { IProject, ProjectService } from '../redux/project';
import { ControlStateSyncService } from './control-state-sync.service';
import { devices, IBlock, IDevice } from './devices';

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
 * The FrameComponent hosts the frame containing the developer's controls.
 */
@Component({
  selector: 'editor-frame',
  templateUrl: './frame.component.html',
  styleUrls: ['./frame.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ControlStateSyncService],
})
export class FrameComponent implements AfterContentInit, OnDestroy {
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
  public state = this.store.select('frame');

  /**
   * The currently selected device.
   */
  public device: Observable<IDevice> = this.state.map(s => devices[s.chosenDevice]);

  /**
   * Whether the controls should be connected to production.
   */
  public isConnectedToRemote = this.store.map(s => s.connect.state === ConnectState.Active);

  /**
   * Fired when something that happens chat changes the layout.
   */
  public layoutResized = Observable.combineLatest(
    this.state.distinctUntilChanged(
      (a, b) => a.chosenDevice === b.chosenDevice && a.orientation === b.orientation,
    ),
    this.store
      .select('code')
      .map(c => c.width)
      .distinctUntilChanged(),
    this.store
      .select('code')
      .map(c => c.state)
      .distinctUntilChanged(),
    Observable.fromEvent(window, 'resize')
      .debounceTime(5)
      .startWith(null),
    state => state,
  );

  /**
   * Observable for the computed video position, fitted with a 16:9 ratio into
   * the bounds provided by the controls.
   */
  public videoFilledSize = this.controls
    .getVideoSize()
    .combineLatest(this.layoutResized.delay(1))
    .map(([rect]) => this.getFittedVideo(rect))
    .filter(rect => !!rect)
    .publishReplay(1)
    .refCount();

  constructor(
    public readonly el: ElementRef,
    private readonly cdRef: ChangeDetectorRef,
    private readonly project: ProjectService,
    private readonly store: Store<IProject>,
    private readonly sanitizer: DomSanitizer,
    public readonly controls: ControlStateSyncService,
  ) {}

  public ngAfterContentInit() {
    this.layoutResized
      .delay(1)
      .takeUntilDestroyed(this)
      .subscribe(state => {
        this.refreshBlocks(state);
      });

    this.videoFilledSize.takeUntilDestroyed(this).subscribe(rect => {
      this.controls.updateFittedVideoSize(rect!);
    });
  }

  public ngOnDestroy() {
    /* noop */
  }

  private refreshBlocks(state: IFrameState) {
    const el = (<HTMLElement>this.el.nativeElement).getBoundingClientRect();
    const device = devices[state.chosenDevice];
    const blocks = device.display(
      el.width - 2 * FrameComponent.padding,
      el.height - 2 * FrameComponent.padding,
      state.orientation,
    );

    if (!state.dimensionsManuallySet) {
      this.project.setDeviceDisplayedSize(
        Math.round(blocks.reduce((max, b) => Math.max(max, b.width + b.x), 0)),
        Math.round(blocks.reduce((max, b) => Math.max(max, b.height + b.y), 0)),
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

    if (out.width / out.height > FrameComponent.videoRatio) {
      const newWidth = out.height * FrameComponent.videoRatio;
      out.left = out.left + (out.width - newWidth) / 2;
      out.width = newWidth;
    } else {
      const newHeight = out.width / FrameComponent.videoRatio;
      out.top = out.top + (out.height - newHeight) / 2;
      out.height = newHeight;
    }

    out.right = backdropRect.width - backdropRect.left;
    out.bottom = backdropRect.height - backdropRect.top;

    return out;
  }
}
