const fs = require('fs');

const channel = process.env.CDK_CHANNEL || 'beta';
const original = fs.readFileSync(`${__dirname}/../package.json`, 'utf-8');
const replaced = original.replace(
  /cdkreleases\.blob\.core\.windows\.net\/cdk-[a-z]+/g,
  `cdkreleases.blob.core.windows.net/cdk-${channel}`
);

fs.writeFileSync(`${__dirname}/../package.json`, replaced);
