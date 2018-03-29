import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Actions } from '@ngrx/effects';
import * as CodeMirror from 'codemirror';
import * as json5 from 'json5';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { of } from 'rxjs/observable/of';
import { distinctUntilChanged, filter, map, mapTo, switchMap, take, tap } from 'rxjs/operators';

import 'codemirror/addon/fold/brace-fold';
import 'codemirror/addon/fold/foldcode';
import 'codemirror/addon/fold/foldgutter';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/selection/active-line';
import 'codemirror/mode/javascript/javascript';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { LayoutActionTypes } from '../../layout/layout.actions';
import { captureDrag } from '../../shared/drag';
import { untilDestroyed } from '../../shared/untilDestroyed';
import { ContentMaskService } from '../content-mask/content-mask.service';

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
 * The json editor is a CodeMirror editor that takes and outputs a jsonable
 * plain object. Its contents are parsed and formatted as JSON5.
 */
@Component({
  selector: 'json-editor',
  template: '<textarea #target></textarea>',
  styleUrls: ['./json-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonEditorComponent implements AfterContentInit, OnChanges, OnDestroy {
  /**
   * Target CodeMirror text box.
   */
  @ViewChild('target') public target: ElementRef;

  /**
   * Contents to display in the editor.
   */
  @Input('contents') public contents: object;

  /**
   * Whether the input is currently disabled.
   */
  @Input('disabled') public disabled: boolean;

  /**
   * Fired when the schema content changes. Fired with the valid, JSON5-parsed
   * contents.
   */
  @Output('contentChange') public change = new Subject<object>();

  /**
   * Whether we're currently programmatically triggering a CodeMirror change.
   */
  private isTriggeringChange = false;

  /**
   * The CodeMirror instance.
   */
  private cm: CodeMirror.Editor;

  /**
   * The code's element.
   */
  private el: HTMLElement;

  constructor(
    el: ElementRef,
    private readonly mask: ContentMaskService,
    private readonly actions: Actions,
  ) {
    this.el = el.nativeElement;
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

    fromEvent<MouseEvent>(this.el, 'mousedown')
      .pipe(
        filter(ev => (<HTMLElement>ev.target).classList.contains('cm-number')),
        switchMap(ev =>
          captureDrag(ev).pipe(filter(o => Math.abs(ev.pageX - o.pageX) > 10), take(1), mapTo(ev)),
        ),
        tap(() => this.mask.open()),
        switchMap(ev =>
          this.dragNumber(ev).pipe(tap(() => undefined, () => undefined, () => this.mask.close())),
        ),
        untilDestroyed(this),
      )
      .subscribe(() => undefined, () => undefined, () => this.mask.close());

    this.actions
      .ofType(LayoutActionTypes.PANELS_SAVE)
      .pipe(untilDestroyed(this))
      .subscribe(() => cm.refresh());

    cm.on('changes', () => {
      this.updateStoredState();
    });

    this.setDisabled(this.disabled);
    this.setContents(this.contents);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (!this.cm) {
      return; // first onChanges call will be before the content is initialized
    }

    if ('contents' in changes && !this.isTriggeringChange) {
      this.setContents(changes.contents.currentValue);
    }
    if ('disabled' in changes) {
      this.setDisabled(changes.disabled.currentValue);
    }
  }

  public ngOnDestroy() {
    /* noop */
  }

  private setDisabled(disabled: boolean) {
    if (disabled) {
      this.el.classList.add('disabled');
      this.cm.setOption('readOnly', true);
    } else {
      this.el.classList.remove('disabled');
      this.cm.setOption('readOnly', false);
    }
  }

  private setContents(contents: any) {
    if (contents !== undefined) {
      this.cm.setValue(json5.stringify(contents, null, 2));
    }
  }

  private updateStoredState() {
    if (this.isTriggeringChange || this.disabled) {
      return;
    }

    let parsed: object;
    try {
      parsed = json5.parse(this.cm.getValue());
    } catch (e) {
      return;
    }

    this.isTriggeringChange = true;
    this.change.next(parsed);
    setTimeout(() => (this.isTriggeringChange = false));
  }

  private dragNumber(startEv: MouseEvent): Observable<null> {
    // for batching history, see https://codemirror.net/doc/manual.html#selection_origin
    const eventOrigin = `+dragNumber-${Date.now()}`;
    const doc = this.cm.getDoc();

    let pos: CodeMirror.Position;
    const selections = doc.listSelections();
    if (selections.length > 0) {
      pos = selections[0].anchor;
    } else {
      pos = doc.getCursor();
    }

    const line = doc.getLine(pos.line);
    let start = pos.ch;
    while (/[0-9\.-]/.test(line[start - 1])) {
      start--;
    }

    let end = pos.ch;
    while (/[0-9\.-]/.test(line[end])) {
      end++;
    }

    const originalValue = Number(line.slice(start, end));
    const shouldRound = Math.abs(originalValue) >= 1;
    if (isNaN(originalValue)) {
      return of(null);
    }

    return captureDrag(startEv).pipe(
      map(ev => {
        const inverter = ev.pageX > startEv.pageX ? 1 : -1;
        const newAmount = originalValue * (1 + inverter * ((ev.pageX - startEv.pageX) / 500) ** 2);
        return String(shouldRound ? Math.round(newAmount) : newAmount);
      }),
      distinctUntilChanged(),
      tap(newText => {
        doc.replaceRange(
          newText,
          { line: pos.line, ch: start },
          { line: pos.line, ch: end },
          eventOrigin,
        );
        end = start + newText.length;
        (<any>doc).setSelection(
          { line: pos.line, ch: start },
          { line: pos.line, ch: end },
          { origin: eventOrigin },
        );
      }),
      mapTo(null),
    );
  }
}
