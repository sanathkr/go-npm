const mkdirp = require('mkdirp');
const request = require('request');
const { parsePackageJson } = require('../common');
const verifyAndPlaceBinary = require('../assets/binary');

/**
 * Select a resource handling strategy based on given options.
 */
function getStrategy({ url }) {

  if (url.endsWith('.tar.gz')) {
      return require('../assets/untar');
  } else if (url.endsWith('.zip')) {
      return require('../assets/unzip');
  } else {
      return require('../assets/move');
  }
}

/**
 * Reads the configuration from application's package.json,
 * validates properties, downloads the binary, untars, and stores at
 * ./bin in the package's root. NPM already has support to install binary files
 * specific locations when invoked with "npm install -g"
 *
 *  See: https://docs.npmjs.com/files/package.json#bin
 */
function install(callback) {

  const opts = parsePackageJson();
  if (!opts) return callback('Invalid inputs');

  mkdirp.sync(opts.binPath);

  console.log('Downloading from URL: ' + opts.url);

  const req = request({ uri: opts.url });

  req.on('error', () => callback('Error downloading from URL: ' + opts.url));
  req.on('response', (res) => {
      if (res.statusCode !== 200) return callback('Error downloading binary. HTTP Status Code: ' + res.statusCode);

      const strategy = getStrategy(opts);

      strategy({
          opts,
          req,
          onSuccess: () => verifyAndPlaceBinary(opts.binName, opts.binPath, callback),
          onError: callback
      });
  });
}

module.exports = install;
