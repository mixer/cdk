import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/javascript/javascript';

import * as CodeMirror from 'codemirror';

const json5 = require('json5');

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
export class CodeComponent implements AfterContentInit {
  @ViewChild('target') public target: ElementRef;

  public ngAfterContentInit() {
    CodeMirror.fromTextArea(
      this.target.nativeElement,
      <CodeMirror.EditorConfiguration>{
        theme: 'monokai',
        mode: 'text/javascript',
        lineNumbers: true,
        tabSize: 4,
        foldGutter: true,
        styleActiveLine: true,
        lint: true,
        gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      },
    );
  }
}
