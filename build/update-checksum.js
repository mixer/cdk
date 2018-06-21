const yaml = require('node-yaml');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const version = require('../package.json').version;

function abortOnError(callback) {
  return (err, data) => {
    if (!err) {
      if (callback) {
        callback(data);
      }
      return;
    }

    console.error(err);
    process.exit(1);
  };
}

function rewriteYaml(file, mod, callback) {
  yaml.read(file, (err, data) => {
    if (err) {
      callback(err);
      return;
    }

    const output = mod(data) || data;
    yaml.write(file, output, callback);
  });
}

function checksumFile(file, algorithms, callback) {
  const stream = fs.createReadStream(file);
  const hashes = algorithms.map(a => crypto.createHash(a));

  stream.on('data', b => hashes.forEach(h => h.update(b)));
  stream.on('error', callback);
  stream.on('end', () => callback(null, hashes.map(h => h.digest())));
}

function rehashWindows(baseDir, callback) {
  checksumFile(path.resolve(baseDir, `CDK-${version}.exe`), ['sha256', 'sha512'], (err, hashes) => {
    if (err) {
      callback(err);
      return;
    }

    const sha256 = hashes[0];
    const sha512 = hashes[1];
    rewriteYaml(
      path.resolve(baseDir, 'latest.yml'),
      data => {
        data.sha512 = sha512.toString('base64');
        data.sha2 = sha256.toString('hex');
        data.files.forEach(file => (file.sha512 = data.sha512));
      },
      callback
    );
  });
}

function rehashOSX(baseDir, callback) {
  checksumFile(path.resolve(baseDir, `CDK-${version}.zip`), ['sha256', 'sha512'], (err, hashes) => {
    if (err) {
      callback(err);
      return;
    }

    const sha256 = hashes[0];
    const sha512 = hashes[1];
    rewriteYaml(
      path.resolve(baseDir, 'latest-mac.yml'),
      data => {
        data.sha512 = sha512.toString('base64');
        data.sha2 = sha256.toString('hex');
        data.files
          .filter(file => file.url.indexOf('.zip') > -1)
          .forEach(file => (file.sha512 = data.sha512));
      },
      callback
    );
  });
}

if (require.main === module) {
  rehashWindows(process.argv[2], abortOnError((() => console.log('Windows checksum completed'))));
  rehashOSX(process.argv[2], abortOnError((() => console.log('OSX checksum completed'))));
}
