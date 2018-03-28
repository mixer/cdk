import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';

import { JsonEditorModule } from '../ui/json-editor/json-editor.module';
import { SchemaEffects } from './schema.effects';
import { schemaReducer } from './schema.reducer';
import { WorldSchemaPanelComponent } from './world-schema-panel/world-schema-panel.component';

/**
 * The schema module contains configuration for the users, groups,
 * and participants within the editor.
 */
@NgModule({
  imports: [
    JsonEditorModule,
    CommonModule,
    StoreModule.forFeature('schema', schemaReducer),
    EffectsModule.forFeature([SchemaEffects]),
  ],
  declarations: [WorldSchemaPanelComponent],
  entryComponents: [WorldSchemaPanelComponent],
})
export class SchemaModule {}
