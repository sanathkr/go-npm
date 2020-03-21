const { EventEmitter } = require('events');
const request = require('request');
const common = require('../../src/common');
const install = require('../../src/actions/install');
const move = require('../../src/assets/move');
const untar = require('../../src/assets/untar');
const unzip = require('../../src/assets/unzip');
const verifyAndPlaceCallback = require('../../src/assets/binary');

jest.mock('fs');
jest.mock('mkdirp');
jest.mock('request');
jest.mock('../../src/common');
jest.mock('../../src/assets/move');
jest.mock('../../src/assets/untar');
jest.mock('../../src/assets/unzip');
jest.mock('../../src/assets/binary');

describe('install()', () => {

  let callback, requestEvents;

  beforeEach(() => {

    callback = jest.fn();

    requestEvents = new EventEmitter();
  });

  it('should call callback with error if package.json did not return value' , () => {
    common.parsePackageJson.mockReturnValueOnce(undefined);

    install(callback);

    expect(callback).toHaveBeenCalledWith('Invalid inputs');
  });

  it('should call callback with error on request error', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url' });

    install(callback);

    requestEvents.emit('error');

    expect(callback).toHaveBeenCalledWith('Error downloading from URL: http://url');
  });

  it('should call callback with error on response with status code different than 200', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url' });

    install(callback);

    requestEvents.emit('response', { statusCode: 404 });

    expect(callback).toHaveBeenCalledWith('Error downloading binary. HTTP Status Code: 404');
  });

  it('should pick move strategy if url is an uncompressed binary', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url' });

    install(callback);

    requestEvents.emit('response', { statusCode: 200 });

    expect(move).toHaveBeenCalled();
  });

  it('should pick untar strategy if url ends with .tar.gz', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url.tar.gz' });

    install(callback);

    requestEvents.emit('response', { statusCode: 200 });

    expect(untar).toHaveBeenCalled();
  });

  it('should pick unzip strategy if url ends with .zip', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url.zip' });

    install(callback);

    requestEvents.emit('response', { statusCode: 200 });

    expect(unzip).toHaveBeenCalled();
  });

  it('should call verifyAndPlaceCallback on success', () => {
    request.mockReturnValueOnce(requestEvents);
    common.parsePackageJson.mockReturnValueOnce({ url: 'http://url', binName: 'command', binPath: './bin' });
    move.mockImplementationOnce(({ onSuccess }) => onSuccess());

    install(callback);

    requestEvents.emit('response', { statusCode: 200 });

    expect(verifyAndPlaceCallback).toHaveBeenCalledWith('command', './bin', callback);
  });
});
