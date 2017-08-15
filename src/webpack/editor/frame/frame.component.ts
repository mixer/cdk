import { NgRedux } from '@angular-redux/store';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import '../util/takeUntilDestroyed';

import { IFrameState } from '../redux/frame';
import { IProject } from '../redux/project';
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
   * Size of the container of controls.
   */
  public containerSize: { width: number; height: number };

  /**
   * List of blocks *other than* the control block for the current device.
   */
  public stubBlocks: IBlock[];

  /**
   * Device "frame" to display.
   */
  public state: IFrameState;

  constructor(
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private ngRedux: NgRedux<IProject>,
    private sanitizer: DomSanitizer,
  ) {}

  public ngOnInit() {
    this.ngRedux.select('frame').takeUntilDestroyed(this).subscribe((frame: IFrameState) => {
      this.state = frame;
      this.refreshBlocks();
    });
  }

  public ngOnDestroy() {
    /* noop */
  }

  @HostListener('window:resize')
  public onResize() {
    if (this.state) {
      this.refreshBlocks();
    }
  }

  private refreshBlocks() {
    const el = (<HTMLElement>this.el.nativeElement).getBoundingClientRect();
    const blocks = devices[this.state.chosenDevice].display(
      el.width - 2 * FrameComponent.padding,
      el.height - 2 * FrameComponent.padding,
      this.state.orientation,
    );

    this.containerSize = {
      width: blocks.reduce((max, b) => Math.max(max, b.width + b.x), 0),
      height: blocks.reduce((max, b) => Math.max(max, b.height + b.y), 0),
    };

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
