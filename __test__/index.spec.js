const rewire = require('rewire');
const EventEmitter = require('events').EventEmitter;

describe('go-npm', function() {
    let mod;

    beforeEach(function() {
        mod = rewire('../src/index.js');
    });

    describe('Resource handling strategies', function() {

        describe('untarStrategy()', function() {

            let untarStrategy, ungzEvents, untarEvents, pipe, callback, zlib, createGunzip, tar;

            beforeEach(function() {
                untarStrategy = mod.__get__('untarStrategy');
                zlib = mod.__get__('zlib');
                tar = mod.__get__('tar');
                ungzEvents = new EventEmitter();
                untarEvents = new EventEmitter();

                createGunzip = jest.fn();
                pipe = jest.fn();
                callback = jest.fn();

                pipe.mockReturnValueOnce({ pipe });
                createGunzip.mockReturnValueOnce(ungzEvents);
                jest.spyOn(tar, 'Extract').mockReturnValueOnce(untarEvents);

                // jest.spyOn not working on read-only properties
                Object.defineProperty(zlib, 'createGunzip', { value: createGunzip });
            });

            it('should download resource and untar to given binPath', function() {

                untarStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                expect(tar.Extract).toHaveBeenCalledWith({ path: './bin' });
            });

            it('should call verifyAndPlaceBinary on untar end', function() {

                const verifyAndPlaceBinary = jest.fn();

                mod.__set__('verifyAndPlaceBinary', verifyAndPlaceBinary);

                untarStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                untarEvents.emit('end');

                expect(verifyAndPlaceBinary).toHaveBeenCalledWith('command', './bin', callback);
            });

            it('should call callback with error on ungz error', function() {

                const error = new Error();

                untarStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                ungzEvents.emit('error', error);

                expect(callback).toHaveBeenCalledWith(error);
            });

            it('should call callback with error on untar error', function() {

                const error = new Error();

                untarStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                untarEvents.emit('error', error);

                expect(callback).toHaveBeenCalledWith(error);
            });
        });

        describe('moveStrategy()', function() {

            let moveStrategy, streamEvents, pipe, callback, fs;

            beforeEach(function() {

                moveStrategy = mod.__get__('moveStrategy');
                fs = mod.__get__('fs');
                streamEvents = new EventEmitter();

                pipe = jest.fn();
                callback = jest.fn();

                jest.spyOn(fs, 'createWriteStream').mockReturnValueOnce(streamEvents);
            });

            it('should download resource to given binPath', function() {

                moveStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                expect(fs.createWriteStream).toHaveBeenCalledWith('bin/command');
            });

            it('should call verifyAndPlaceBinary on stream closed', function() {

                const verifyAndPlaceBinary = jest.fn();

                mod.__set__('verifyAndPlaceBinary', verifyAndPlaceBinary);

                moveStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                streamEvents.emit('close');

                expect(verifyAndPlaceBinary).toHaveBeenCalledWith('command', './bin', callback);
            });

            it('should call callback with error on write stream error', function() {

                const error = new Error();

                moveStrategy({ binPath: './bin', binName: 'command' }, { pipe }, callback);

                streamEvents.emit('error', error);

                expect(callback).toHaveBeenCalledWith(error);
            });
        });
    });
});
