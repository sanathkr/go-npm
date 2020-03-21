const { join } = require('path');
const { existsSync, renameSync, chmodSync } = require('fs');
const { getInstallationPath } = require('../common');

function verifyAndPlaceBinary(binName, binPath, callback) {
  if (!existsSync(join(binPath, binName))) {
    return callback(`Downloaded binary does not contain the binary specified in configuration - ${binName}`);
  }

  getInstallationPath((err, installationPath) => {
      if (err) {
        return callback(err);
      }

      // Move the binary file and make sure it is executable
      renameSync(join(binPath, binName), join(installationPath, binName));
      chmodSync(join(installationPath, binName), '755');

      console.log('Placed binary on', join(installationPath, binName));

      callback(null);
  });
}

module.exports = verifyAndPlaceBinary;
