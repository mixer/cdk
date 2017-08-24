import { Response } from '@angular/http';
import { stringify } from 'querystring';
import { unindent } from './ds';

export function reportIssue(title: string, body: string) {
  const url = `https://github.com/mixer/miix/issues/new?${stringify({ title, body })}`;
  window.open(url, '_blank');
}

export function reportHttpError(title: string, res: Response) {
  reportIssue(
    title,
    unindent(`
      ### Steps to Reproduce

      <!-- Add your reproduction steps here! -->

      ### Error

      \`\`\`
      ${res.text()}
      \`\`\`
    `),
  );
}
