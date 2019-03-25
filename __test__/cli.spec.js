const cli = require('../src/cli');
const install = require('../src/actions/install');

jest.mock('../src/actions/install');

describe('cli()', () => {
  let exit;

  beforeEach(() => {
    exit = jest.fn();
  });

  it('should exit with error if not enough args are supplied', () => {
    cli({ argv: [], exit });

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('should exit with error if command does not exist', () => {
    cli({ argv: [ '/usr/local/bin/node', 'index.js', 'command' ], exit });

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('should exit with error if command returns error', () => {
    install.mockImplementationOnce((cb) => cb(new Error()));

    cli({ argv: [ '/usr/local/bin/node', 'index.js', 'install' ], exit });

    expect(exit).toHaveBeenCalledWith(1);
  });

  it('should exit with success if command runs fine', () => {
    install.mockImplementationOnce((cb) => cb(null));

    cli({ argv: [ '/usr/local/bin/node', 'index.js', 'install' ], exit });

    expect(exit).toHaveBeenCalledWith(0);
  });
});
