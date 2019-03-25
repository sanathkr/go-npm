const { join } = require('path');
const { exec } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const mkdirp = require('mkdirp');

// Mapping from Node's `process.arch` to Golang's `$GOARCH`
const ARCH_MAPPING = {
  ia32: '386',
  x64: 'amd64',
  arm: 'arm'
};

// Mapping between Node's `process.platform` to Golang's
const PLATFORM_MAPPING = {
  darwin: 'darwin',
  linux: 'linux',
  win32: 'windows',
  freebsd: 'freebsd'
};

function getInstallationPath(callback) {

  // `npm bin` will output the path where binary files should be installed
  exec('npm bin', (err, stdout, stderr) => {

    let dir = null;
    if (err || stderr || !stdout || stdout.length === 0) {

      // We couldn't infer path from `npm bin`. Let's try to get it from
      // Environment variables set by NPM when it runs.
      // npm_config_prefix points to NPM's installation directory where `bin` folder is available
      // Ex: /Users/foo/.nvm/versions/node/v4.3.0
      const env = process.env;

      if (env && env.npm_config_prefix) {
        dir = join(env.npm_config_prefix, 'bin');
      } else {
        return callback(new Error('Error finding binary installation directory'));
      }
    } else {
      dir = stdout.trim();
    }

    mkdirp.sync(dir);

    callback(null, dir);
  });
}

function validateConfiguration({ version, goBinary }) {

  if (!version) {
    return "'version' property must be specified";
  }

  if (!goBinary || typeof (goBinary) !== 'object') {
    return "'goBinary' property must be defined and be an object";
  }

  if (!goBinary.name) {
    return "'name' property is necessary";
  }

  if (!goBinary.path) {
    return "'path' property is necessary";
  }

  if (!goBinary.url) {
    return "'url' property is required";
  }
}

function parsePackageJson() {
  if (!(process.arch in ARCH_MAPPING)) {
    console.error('Installation is not supported for this architecture: ' + process.arch);
    return;
  }

  if (!(process.platform in PLATFORM_MAPPING)) {
    console.error('Installation is not supported for this platform: ' + process.platform);
    return
  }

  const packageJsonPath = join('.', 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.error('Unable to find package.json. ' +
      'Please run this script at root of the package you want to be installed');
    return
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath));
  const error = validateConfiguration(packageJson);

  if (error && error.length > 0) {
    console.error('Invalid package.json: ' + error);
    return
  }

  // We have validated the config. It exists in all its glory
  const binPath = packageJson.goBinary.path;
  let binName = packageJson.goBinary.name;
  let url = packageJson.goBinary.url;
  let version = packageJson.version;

  if (version[0] === 'v') version = version.substr(1);  // strip the 'v' if necessary v0.0.1 => 0.0.1

  // Binary name on Windows has .exe suffix
  if (process.platform === 'win32') {
    binName += '.exe'

    url = url.replace(/{{win_ext}}/g, '.exe');
  } else {
    url = url.replace(/{{win_ext}}/g, '');
  }

  // Interpolate variables in URL, if necessary
  url = url.replace(/{{arch}}/g, ARCH_MAPPING[process.arch]);
  url = url.replace(/{{platform}}/g, PLATFORM_MAPPING[process.platform]);
  url = url.replace(/{{version}}/g, version);
  url = url.replace(/{{bin_name}}/g, binName);

  return {
    binName,
    binPath,
    url,
    version
  };
}

module.exports = { parsePackageJson, getInstallationPath };
