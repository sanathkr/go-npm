const fs = require('fs');
const common = require('../../src/common');
const uninstall = require('../../src/actions/uninstall');

jest.mock('fs');
jest.mock('../../src/common');

describe('uninstall()', () => {

  let callback;

  beforeEach(() => {

    callback = jest.fn();

    common.parsePackageJson.mockReturnValueOnce({ binName: 'command' });
  });

  it('should call callback with error if binary not found', () => {
    const error = new Error();

    common.getInstallationPath.mockImplementationOnce((cb) => cb(error));

    uninstall(callback);

    expect(callback).toHaveBeenCalledWith(error);
  });

  it('should call unlinkSync with binary and installation path', () => {

    common.getInstallationPath.mockImplementationOnce((cb) => cb(null, './bin'));

    uninstall(callback);

    expect(fs.unlinkSync).toHaveBeenCalledWith('bin/command');
  });

  it('should call callback on success', () => {

    common.getInstallationPath.mockImplementationOnce((cb) => cb(null, './bin'));

    uninstall(callback);

    expect(callback).toHaveBeenCalledWith(null);
  });

  it('should call callback regardless of errors on unlink', () => {

    common.getInstallationPath.mockImplementationOnce((cb) => cb(null, './bin'));

    fs.unlinkSync.mockImplementationOnce(() => {
      throw new Error();
    });

    uninstall(callback);

    expect(callback).toHaveBeenCalledWith(null);
  });
});
