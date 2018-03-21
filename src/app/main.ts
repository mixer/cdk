import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppConfig } from './editor/editor.config';
import { AppModule } from './editor/editor.module';

if (AppConfig.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(AppModule, {
    preserveWhitespaces: false,
  })
  .catch(err => console.error(err));

platformBrowserDynamic().bootstrapModule(AppModule); // tslint:disable-line
