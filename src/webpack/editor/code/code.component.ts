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
import * as patch from 'fast-json-patch';
import * as json5 from 'json5';

import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/javascript/javascript';
import 'rxjs/add/operator/filter';
import '../util/takeUntilDestroyed';

import { IStateDump } from '@mcph/miix-std/dist/internal';
import {
  CodeState,
  ICodeState,
  MaxEditableState,
  stateToProp,
  stateToUpdateAction,
} from '../redux/code';
import { ConnectState } from '../redux/connect';
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

  /**
   * Whether we're currently programmatically triggering a CodeMirror change.
   */
  private isTriggeringChange = false;

  /**
   * The CodeMirror instance.
   */
  private cm: CodeMirror.Editor;

  /**
   * Whether the editor is currently enabled.
   */
  private isEnabled = true;

  /**
   * The code's element.
   */
  private el: HTMLElement;

  constructor(private readonly store: Store<IProject>, el: ElementRef) {
    this.el = <HTMLElement>el.nativeElement;
  }

  public ngAfterContentInit() {
    const cm = (this.cm = CodeMirror.fromTextArea(
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
    ));

    this.store.select('code').takeUntilDestroyed(this).subscribe(code => {
      this.updateEditorToState(code);
    });

    cm.on('changes', () => {
      this.updateStoredState();
    });

    this.store.takeUntilDestroyed(this).subscribe(state => {
      const enabled = state.connect.state === ConnectState.Idle;
      this.setEnabled(enabled, state.code);
      if (enabled) {
        return;
      }

      const controls = state.connect.controlsState;
      const prop = <keyof IStateDump>stateToProp[state.code.state];
      if (state.code.state > MaxEditableState || !controls || !controls[prop]) {
        return;
      }

      this.updateEditorContents(json5.stringify(controls[prop], null, 2).split('\n'));
    });
  }

  public ngOnDestroy() {
    /* noop */
  }

  private setEnabled(enabled: boolean, state: ICodeState) {
    if (enabled === this.isEnabled) {
      return;
    }

    this.isEnabled = enabled;

    if (enabled) {
      this.el.classList.remove('disabled');
      this.updateEditorToState(state);
      this.cm.setOption('readOnly', false);
    } else {
      this.el.classList.add('disabled');
      this.cm.setOption('readOnly', true);
    }
  }

  private updateStoredState() {
    if (this.isTriggeringChange || !this.isEnabled) {
      return;
    }

    this.isTriggeringChange = true;
    this.store.dispatch({
      type: stateToUpdateAction[this.codeState],
      data: this.cm.getValue().split('\n'),
    });
    this.isTriggeringChange = false;
  }

  private updateEditorToState(code: ICodeState) {
    const contents = (<any>code)[stateToProp[code.state]];
    if (code.state > MaxEditableState || this.isTriggeringChange) {
      return;
    }

    this.codeState = code.state;
    this.updateEditorContents(contents);
  }

  private updateEditorContents(lines: string[]) {
    this.isTriggeringChange = true;

    // Wrap in an operation block so CM can bulk DOM updates
    this.cm.operation(() => {
      const original = this.cm.getValue().split('\n');
      const doc = this.cm.getDoc();

      patch.compare(original, lines).forEach(op => {
        const line = Number(op.path.slice(1));
        const fromLine = (<any>op).from && Number((<any>op).from.slice(1));

        switch (op.op) {
          case 'replace':
            doc.replaceRange(op.value, { line, ch: 0 }, { line, ch: original[line].length });
            break;
          case 'remove':
            doc.replaceRange('', { line, ch: 0 }, { line: line + 1, ch: 0 });
            break;
          case 'add':
            doc.replaceRange(`${op.value}\n`, { line, ch: 0 });
            break;
          case 'copy':
            doc.replaceRange(`${original[fromLine]}\n`, { line, ch: 0 });
            break;
          case 'move':
            const srcLine = Number(op.from.slice(1));
            doc.replaceRange('', { line: srcLine, ch: 0 }, { line: srcLine + 1, ch: 0 });
            doc.replaceRange(`${original[srcLine]}\n`, { line, ch: 0 });
            break;
          default:
          // ignored, test or _get
        }

        patch.applyOperation(original, op);
      });
    });

    this.isTriggeringChange = false;
  }
}
