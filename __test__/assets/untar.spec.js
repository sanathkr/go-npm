const { EventEmitter } = require('events');
const zlib = require('zlib');
const tar = require('tar');
const untar = require('../../src/assets/untar');

jest.mock('zlib');
jest.mock('tar', () => ({
  Extract: jest.fn()
}));

describe('untar()', () => {

  let ungzEvents, untarEvents, pipe, onSuccess, onError;

  beforeEach(() => {
    ungzEvents = new EventEmitter();
    untarEvents = new EventEmitter();

    pipe = jest.fn();
    onSuccess = jest.fn();
    onError = jest.fn();

    pipe.mockReturnValueOnce({ pipe });
    tar.Extract.mockReturnValueOnce(untarEvents);
    zlib.createGunzip.mockReturnValueOnce(ungzEvents);
  });

  it('should download resource and untar to given binPath', () => {

    untar({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    expect(tar.Extract).toHaveBeenCalledWith({ path: './bin' });
  });

  it('should call onSuccess on untar end', () => {

    untar({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    untarEvents.emit('end');

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should call onError with error on ungz error', () => {

    const error = new Error();

    untar({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    ungzEvents.emit('error', error);

    expect(onError).toHaveBeenCalledWith(error);
  });

  it('should call onError with error on untar error', () => {

    const error = new Error();

    untar({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    untarEvents.emit('error', error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
