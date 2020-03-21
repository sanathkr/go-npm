const { EventEmitter } = require('events');
const unzipper = require('unzipper');
const unzip = require('../../src/assets/unzip');

jest.mock('unzipper', () => ({
  Extract: jest.fn()
}));

describe('unzip()', () => {

  let unzipEvents, pipe, onSuccess, onError;

  beforeEach(() => {
    unzipEvents = new EventEmitter();

    pipe = jest.fn();
    onSuccess = jest.fn();
    onError = jest.fn();

    pipe.mockReturnValueOnce({ pipe });
    unzipper.Extract.mockReturnValueOnce(unzipEvents);
  });

  it('should download resource and unzip to given binPath', () => {

    unzip({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    expect(unzipper.Extract).toHaveBeenCalledWith({ path: './bin' });
  });

  it('should call onSuccess on unzip close', () => {

    unzip({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    unzipEvents.emit('close');

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should call onError with error on unzip error', () => {

    const error = new Error();

    unzip({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    unzipEvents.emit('error', error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
