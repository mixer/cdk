import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import '../util/takeUntilDestroyed';

import { IFrameState } from '../redux/frame';
import { IProject, ProjectService } from '../redux/project';
import { devices, IBlock } from './devices';

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
})
export class FrameComponent implements OnInit, OnDestroy {
  /**
   * Padding in all directions within the frame.
   */
  public static readonly padding = 32;

  /**
   * Background to display behind the frame.
   */
  public readonly background = this.sanitizer.bypassSecurityTrustStyle(
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
  public device = this.state.map(s => devices[s.chosenDevice]);

  constructor(
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private project: ProjectService,
    private store: Store<IProject>,
    private sanitizer: DomSanitizer,
  ) {}

  public ngOnInit() {
    Observable.combineLatest(
      this.state.distinctUntilChanged(
        (a, b) => a.chosenDevice === b.chosenDevice && a.orientation === b.orientation,
      ),
      Observable.fromEvent(window, 'resize').debounceTime(5).startWith(null),
      state => state,
    )
      .takeUntilDestroyed(this)
      .subscribe(state => this.refreshBlocks(state));
  }

  public ngOnDestroy() {
    /* noop */
  }

  private refreshBlocks(state: IFrameState) {
    const el = (<HTMLElement>this.el.nativeElement).getBoundingClientRect();
    const blocks = devices[state.chosenDevice].display(
      el.width - 2 * FrameComponent.padding,
      el.height - 2 * FrameComponent.padding,
      state.orientation,
    );

    if (!state.dimensionsManuallySet) {
      this.project.setDeviceDisplayedSize(
        blocks.reduce((max, b) => Math.max(max, b.width + b.x), 0),
        blocks.reduce((max, b) => Math.max(max, b.height + b.y), 0),
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
}
