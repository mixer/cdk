import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngrx/store';
import * as CodeMirror from 'codemirror';
import * as json5 from 'json5';

import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/javascript/javascript';
import 'rxjs/add/operator/filter';
import '../util/takeUntilDestroyed';

import { CodeState, MaxEditableState, stateToProp, stateToUpdateAction } from '../redux/code';
import { IProject } from '../redux/project';

CodeMirror.registerHelper('lint', 'javascript', (contents: string) => {
  try {
    json5.parse(contents);
  } catch (err) {
    const parts = /^(.+) at line ([0-9]+) column ([0-9]+)/.exec(err.message);
    if (!parts) {
      return [
        {
          message: err.message,
          severity: 'error',
          from: CodeMirror.Pos(0, 0),
          to: CodeMirror.Pos(contents.split('\n').length, 0),
        },
      ];
    }

    const [, message, line, column] = parts;
    return [
      {
        message,
        severity: 'error',
        from: CodeMirror.Pos(Number(line) - 1, Number(column)),
        to: CodeMirror.Pos(Number(line), 0),
      },
    ];
  }

  return [];
});

/**
 * The code component displays the code editor for participants/control state/
 */
@Component({
  selector: 'editor-code',
  templateUrl: './code.component.html',
  styleUrls: ['./code.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeComponent implements AfterContentInit, OnDestroy {
  /**
   * Target CodeMirror text box.
   */
  @ViewChild('target') public target: ElementRef;

  /**
   * Current code editor state
   */
  private codeState: CodeState;

  constructor(private readonly store: Store<IProject>) {}

  public ngAfterContentInit() {
    const cm = CodeMirror.fromTextArea(
      this.target.nativeElement,
      <CodeMirror.EditorConfiguration>{
        theme: 'monokai',
        mode: 'text/javascript',
        lineNumbers: true,
        tabSize: 2,
        foldGutter: true,
        styleActiveLine: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      },
    );

    let isTriggeringChange = false;

    this.store
      .select('code')
      .takeUntilDestroyed(this)
      .filter(() => !isTriggeringChange)
      .subscribe(code => {
        const contents = (<any>code)[stateToProp[code.state]];
        if (code.state <= MaxEditableState) {
          this.codeState = code.state;
          isTriggeringChange = true;
          cm.setValue(contents.join('\n'));
          isTriggeringChange = false;
        }
      });

    cm.on('changes', () => {
      if (isTriggeringChange) {
        return;
      }

      isTriggeringChange = true;
      this.store.dispatch({
        type: stateToUpdateAction[this.codeState],
        data: cm.getValue().split('\n'),
      });
      isTriggeringChange = false;
    });
  }

  public ngOnDestroy() {
    /* noop */
  }
}
