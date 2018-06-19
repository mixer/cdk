const yaml = require('node-yaml');
const crypto = require('crypto');
const fs = require('fs');
const sha512ForWin = crypto.createHash('sha512');
const sha256ForWin = crypto.createHash('sha256');
const sha512ForMac = crypto.createHash('sha512');
const sha256ForMac = crypto.createHash('sha256');
const fdExe = fs.createReadStream('signed_release/Mixer-Forge.exe');
const fdZip = fs.createReadStream('signed_release/Mixer-Forge.zip');
sha512ForWin.setEncoding('binary');
sha512ForMac.setEncoding('binary');

console.log('Reading latest.yml');
yaml.read('signed_release/latest.yml', function(err, data) {
  if (err) {
    console.log('Failed to read latest.yml');
    throw err;
  }
  console.log('Obtaining SHA512 of signed exe...');
  fdExe.on('end', function() {
    sha512ForWin.end();
    sha256ForWin.end();
    var newSha512 = Buffer.from(sha512ForWin.read(), 'binary').toString('base64');
    var newSha256 = Buffer.from(sha256ForWin.read()).toString('hex');
    data.sha512 = newSha512;
    data.sha2 = newSha256;
    data.files.map(function(file) {
      file.sha512 = newSha512;
    });
    console.log('Updating latest.yml...');
    yaml.write('signed_release/latest.yml', data, function(err) {
      if (err) {
        console.log('Failed to write to latest.yml');
        throw err;
      }
      console.log('Updated latest.yml with new sha512 and sha256');
    });
  });

  fdExe.pipe(sha512ForWin);
  fdExe.pipe(sha256ForWin);
});

console.log('Reading latest-mac.yml');
yaml.read('signed_release/latest-mac.yml', function(err, data) {
  if (err) {
    console.log('Failed to read latest-mac.yml, ignoring...');
    return;
  }
  console.log('Obtaining SHA512 of signed zip...');
  fdZip.on('end', function() {
    sha512ForMac.end();
    sha256ForMac.end();
    var newSha512 = Buffer.from(sha512ForMac.read(), 'binary').toString('base64');
    var newSha256 = Buffer.from(sha256ForMac.read()).toString('hex');
    data.sha512 = newSha512;
    data.sha2 = newSha256;
    data.files.map(function(file) {
      file.sha512 = newSha512;
    });
    console.log('Updating latest-mac.yml...');
    yaml.write('signed_release/latest-mac.yml', data, function(err) {
      if (err) {
        console.log('Failed to write to latest-mac.yml');
        throw err;
      }
      console.log('Updated latest-mac.yml with new sha512 and sha256');
    });
  });

  fdZip.pipe(sha512ForMac);
  fdZip.pipe(sha256ForMac);
});
