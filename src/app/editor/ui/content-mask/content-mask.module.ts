import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { contentMaskReducer } from './content-mask.reducer';
import { ContentMaskService } from './content-mask.service';

/**
 * The Content Mask is a simple but very important component. It captures
 * the mouse during drags and adds an overlay over the page. This is necessary
 * because normally, once the mouse goes over an iframe, we lose track of
 * it entirely, so we need to add an overlay to prevent that from happening.
 */
@NgModule({
  imports: [StoreModule.forFeature('entryMask', contentMaskReducer)],
  providers: [ContentMaskService],
})
export class ContentMaskModule {}
