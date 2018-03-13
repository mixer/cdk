import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material';

export interface IBundleFile {
  filename: string;
  size: number;
}

export interface IBundleSizeResponse {
  files: IBundleFile[];
}

/**
 * The Login Dialog Component does what it says on the tin!
 */
@Component({
  selector: 'editor-bundle-size-warning-dialog',
  templateUrl: './bundle-size-warning-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BundleSizeWarningComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public readonly data: IBundleSizeResponse) {}

  public sortBySize(data: IBundleFile[]): IBundleFile[] {
    return data
      .filter(file => !!file.size)
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
  }
}
