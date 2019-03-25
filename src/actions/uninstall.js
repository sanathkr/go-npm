const { join } = require('path');
const { unlinkSync } = require('fs');
const { parsePackageJson, getInstallationPath } = require('../common');

function uninstall(callback) {

  const { binName } = parsePackageJson();

  getInstallationPath((err, installationPath) => {
      if (err) {
          return callback(err);
      }

      try {
          unlinkSync(join(installationPath, binName));
      } catch(ex) {
          // Ignore errors when deleting the file.
      }

      return callback(null);
  });
}

module.exports = uninstall;
