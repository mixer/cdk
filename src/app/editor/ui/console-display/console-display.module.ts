import { NgModule } from '@angular/core';

import { ConsoleDisplayComponent } from './console-display.component';

/**
 * Module containing UI elements for TTY/xterm consoles.
 */
@NgModule({
  imports: [],
  exports: [ConsoleDisplayComponent],
  declarations: [ConsoleDisplayComponent],
})
export class ConsoleModule {}
