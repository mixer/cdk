import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl, SafeStyle } from '@angular/platform-browser';
import { Store } from '@ngrx/store';
import * as qs from 'querystring';
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

import { IFrameState } from '../redux/frame';
import { IProject, ProjectService } from '../redux/project';
import { devices, IBlock, IDevice } from './devices';
import { StateSyncService } from './state-sync.service';

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
  providers: [StateSyncService],
})
export class FrameComponent implements AfterContentInit, OnDestroy {
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
   * Device "frame" to display.
   */
  public state = this.store.select('frame');

  /**
   * The currently selected device.
   */
  public device: Observable<IDevice> = this.state.map(s => devices[s.chosenDevice]);

  /**
   * URL for the iframe to display
   */
  public frameUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl('about:blank');

  /**
   * The nested iframe containing the control.
   */
  @ViewChild('iframe') public iframe: ElementRef;

  constructor(
    private el: ElementRef,
    private cdRef: ChangeDetectorRef,
    private project: ProjectService,
    private store: Store<IProject>,
    private sanitizer: DomSanitizer,
    public sync: StateSyncService,
  ) {}

  public ngAfterContentInit() {
    Observable.combineLatest(
      this.state.distinctUntilChanged(
        (a, b) => a.chosenDevice === b.chosenDevice && a.orientation === b.orientation,
      ),
      this.store.select('code').map(c => c.width).distinctUntilChanged(),
      this.store.select('code').map(c => c.state).distinctUntilChanged(),
      Observable.fromEvent(window, 'resize').debounceTime(5).startWith(null),
      state => state,
    )
      .delay(1)
      .takeUntilDestroyed(this)
      .subscribe(state => {
        this.refreshBlocks(state);
      });

    this.sync.bind((<HTMLIFrameElement>this.iframe.nativeElement).contentWindow);
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

    const queryString = qs.stringify({
      isMobile: device.isMobile,
      language: navigator.language,
    });
    this.frameUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`/?${queryString}`);

    this.cdRef.markForCheck();
    this.cdRef.detectChanges();
  }
}
