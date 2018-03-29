import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MatButtonModule,
  MatDialogModule,
  MatIconModule,
  MatInputModule,
  MatListModule,
} from '@angular/material';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { MomentModule } from 'angular2-moment';

import { JsonEditorModule } from '../ui/json-editor/json-editor.module';
import { OpenSnapshotDialogComponent } from './open-snapshot-dialog/open-snapshot-dialog.component';
import { SaveSnapshotDialogComponent } from './save-snapshot-dialog/save-snapshot-dialog.component';
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
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MomentModule,
    StoreModule.forFeature('schema', schemaReducer),
    EffectsModule.forFeature([SchemaEffects]),
  ],
  declarations: [
    WorldSchemaPanelComponent,
    SaveSnapshotDialogComponent,
    OpenSnapshotDialogComponent,
  ],
  entryComponents: [
    WorldSchemaPanelComponent,
    SaveSnapshotDialogComponent,
    OpenSnapshotDialogComponent,
  ],
})
export class SchemaModule {}
