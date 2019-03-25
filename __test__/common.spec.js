const fs = require('fs');
const childProcess = require('child_process');
const common = require('../src/common');

jest.mock('fs');
jest.mock('child_process');
jest.mock('mkdirp');

describe('common', () => {
  describe('getInstallationPath()', () => {
    let callback, env;

    beforeEach(() => {
      callback = jest.fn();

      env = { ...process.env };
    });

    afterEach(() => {
      process.env = env;
    });

    it('should get binaries path from `npm bin`', () => {
      childProcess.exec.mockImplementationOnce((_cmd, cb) => cb(null, '/usr/local/bin'));

      common.getInstallationPath(callback);

      expect(callback).toHaveBeenCalledWith(null, '/usr/local/bin');
    });

    it('should get binaries path from env', () => {
      childProcess.exec.mockImplementationOnce((_cmd, cb) => cb(new Error()));

      process.env.npm_config_prefix = '/usr/local';

      common.getInstallationPath(callback);

      expect(callback).toHaveBeenCalledWith(null, '/usr/local/bin');
    });

    it('should call callback with error if binaries path is not found', () => {
      childProcess.exec.mockImplementationOnce((_cmd, cb) => cb(new Error()));

      process.env.npm_config_prefix = undefined;

      common.getInstallationPath(callback);

      expect(callback).toHaveBeenCalledWith(new Error('Error finding binary installation directory'));
    });
  });

  describe('parsePackageJson()', () => {
    let _process;

    beforeEach(() => {
      _process = { ...global.process };
    });

    afterEach(() => {
      global.process = _process;
    });

    describe('validation', () => {
      it('should return if architecture is unsupported', () => {
        process.arch = 'mips';

        expect(common.parsePackageJson()).toBeUndefined();
      });

      it('should return if platform is unsupported', () => {
        process.platform = 'amiga';

        expect(common.parsePackageJson()).toBeUndefined();
      });

      it('should return if package.json does not exist', () => {
        fs.existsSync.mockReturnValueOnce(false);

        expect(common.parsePackageJson()).toBeUndefined();
      });
    });

    describe('variable replacement', () => {
      it('should append .exe extension on windows platform', () => {
        fs.existsSync.mockReturnValueOnce(true);
        fs.readFileSync.mockReturnValueOnce(JSON.stringify({
          version: '1.0.0',
          goBinary: {
            name: 'command',
            path: './bin',
            url: 'https://github.com/foo/bar/releases/v{{version}}/assets/command{{win_ext}}'
          }
        }));

        process.platform = 'win32';

        expect(common.parsePackageJson()).toMatchObject({
          binName: 'command.exe',
          url: 'https://github.com/foo/bar/releases/v1.0.0/assets/command.exe'
        });
      });

      it('should not append .exe extension on platform different than windows', () => {
        fs.existsSync.mockReturnValueOnce(true);
        fs.readFileSync.mockReturnValueOnce(JSON.stringify({
          version: '1.0.0',
          goBinary: {
            name: 'command',
            path: './bin',
            url: 'https://github.com/foo/bar/releases/v{{version}}/assets/command{{win_ext}}'
          }
        }));

        process.platform = 'darwin';

        expect(common.parsePackageJson()).toMatchObject({
          binName: 'command',
          url: 'https://github.com/foo/bar/releases/v1.0.0/assets/command'
        });
      });
    });
  });
});
