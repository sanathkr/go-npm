const fs = require('fs');
const common = require('../../src/common');
const verifyAndPlaceBinary = require('../../src/assets/binary');

jest.mock('fs');
jest.mock('../../src/common');

describe('verifyAndPlaceBinary()', () => {
  let callback;

  beforeEach(() => {
    callback = jest.fn();
  });

  it('should call callback with error if binary downloaded differs from config', () => {
    fs.existsSync.mockReturnValueOnce(false);

    verifyAndPlaceBinary('command', './bin', callback);

    expect(callback).toHaveBeenCalledWith('Downloaded binary does not contain the binary specified in configuration - command');
  });

  it('should call callback with error if installation path cannot be found', () => {
    const error = new Error();

    fs.existsSync.mockReturnValueOnce(true);
    common.getInstallationPath.mockImplementationOnce((cb) => cb(error));

    verifyAndPlaceBinary('command', './bin', callback);

    expect(callback).toHaveBeenCalledWith(error);
  });

  it('should call callback with null on success', () => {
    fs.existsSync.mockReturnValueOnce(true);
    common.getInstallationPath.mockImplementationOnce((cb) => cb(null, '/usr/local/bin'));

    verifyAndPlaceBinary('command', './bin', callback);

    expect(callback).toHaveBeenCalledWith(null);
  });

  it('should move the binary to installation directory', () => {
    fs.existsSync.mockReturnValueOnce(true);
    common.getInstallationPath.mockImplementationOnce((cb) => cb(null, '/usr/local/bin'));

    verifyAndPlaceBinary('command', './bin', callback);

    expect(fs.renameSync).toHaveBeenCalledWith('bin/command', '/usr/local/bin/command');
  });
});
