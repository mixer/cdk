import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Store } from '@ngrx/store';

import 'rxjs/add/operator/filter';
import '../util/takeUntilDestroyed';

import { CodeState } from '../redux/code';
import { IProject, ProjectService } from '../redux/project';

/**
 * The code component displays the code editor for participants/control state/
 */
@Component({
  selector: 'editor-code-nav',
  templateUrl: './code-nav.component.html',
  styleUrls: ['./code-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeNavComponent implements OnInit, OnDestroy {
  /**
   * Target CodeMirror text box.
   */
  @Input('value') public value: keyof typeof CodeState;

  /**
   * Icon to display in the
   */
  @Input('icon') public icon: string;

  /**
   * Element role (button for accessibility)
   */
  @HostBinding('attr.role') public role = 'button';

  /**
   * Whether the nav item is active.
   */
  public isActive = false;

  constructor(
    private readonly store: Store<IProject>,
    private readonly project: ProjectService,
    private readonly cdRef: ChangeDetectorRef,
  ) {}

  public ngOnInit() {
    this.store
      .select('code')
      .takeUntilDestroyed(this)
      .subscribe(code => {
        this.isActive = code.state === CodeState[this.value];
        this.cdRef.markForCheck();
        this.cdRef.detectChanges();
      });
  }

  public ngOnDestroy() {
    /* noop */
  }

  @HostListener('click')
  public onClick() {
    this.project.setCodeState(this.isActive ? CodeState.Closed : CodeState[this.value]);
  }
}
