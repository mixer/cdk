import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared.module';
import { RadioIconComponent, RadioIconListComponent } from './radio-icon.component';

@NgModule({
  imports: [CommonModule, SharedModule],
  exports: [RadioIconComponent, RadioIconListComponent],
  declarations: [RadioIconComponent, RadioIconListComponent],
})
export class RadioIconsModule {}
