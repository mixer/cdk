import { NgModule } from '@angular/core';

import { ContentMaskModule } from '../content-mask/content-mask.module';
import { JsonEditorComponent } from './json-editor.component';

/**
 * The jsoneditormodule contains modules for manipulating various JSON
 * objects.
 */
@NgModule({
  imports: [ContentMaskModule],
  declarations: [JsonEditorComponent],
  exports: [JsonEditorComponent],
})
export class JsonEditorModule {}
