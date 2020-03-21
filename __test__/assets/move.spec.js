const { EventEmitter } = require('events');
const fs = require('fs');
const move = require('../../src/assets/move');

jest.mock('fs');

describe('move()', () => {

  let streamEvents, pipe, onSuccess, onError;

  beforeEach(() => {

    streamEvents = new EventEmitter();

    pipe = jest.fn();
    onSuccess = jest.fn();
    onError = jest.fn();
    createWriteStream = jest.fn();

    fs.createWriteStream.mockReturnValueOnce(streamEvents);
  });

  it('should download resource to given binPath', () => {

    move({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    expect(fs.createWriteStream).toHaveBeenCalledWith('bin/command');
  });

  it('should call onSuccess on stream closed', () => {

    move({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    streamEvents.emit('close');

    expect(onSuccess).toHaveBeenCalled();
  });

  it('should call onError with error on write stream error', () => {

    const error = new Error();

    move({ opts: { binPath: './bin', binName: 'command' }, req: { pipe }, onSuccess, onError });

    streamEvents.emit('error', error);

    expect(onError).toHaveBeenCalledWith(error);
  });
});
