import { HttpErrorResponse } from '@angular/common/http';
import { stringify } from 'querystring';
import { unindent } from './ds';

export function reportIssue(title: string, body: string) {
  const url = `https://github.com/mixer/miix-cli/issues/new?${stringify({ title, body })}`;
  window.open(url, '_blank');
}

export function reportHttpError(title: string, res: HttpErrorResponse) {
  reportIssue(
    title,
    unindent(`
      ### Steps to Reproduce

      <!-- Add your reproduction steps here! -->

      ### Error

      \`\`\`
      ${res.status} from ${res.url}:
      ${res.message}
      \`\`\`
    `),
  );
}
