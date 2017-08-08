#!/usr/bin/env node

"use strict"

const request = require('request'),
    path = require('path'),
    tar = require('tar'),
    zlib = require('zlib'),
    mkdirp = require('mkdirp'),
    fs = require('fs');

// Mapping from Node's `process.arch` to Golang's `$GOARCH`
const ARCH_MAPPING = {
    "ia32": "386",
    "x64": "amd64",
    "arm": "arm"
};

// Mapping between Node's `process.platform` to Golang's 
const PLATFORM_MAPPING = {
    "darwin": "darwin",
    "linux": "linux",
    "win32": "windows",
    "freebsd": "freebsd"
};

function verifyBinary(binName, binPath, callback) {
    if (!fs.existsSync(path.join(binPath, binName))) return callback(`Downloaded binary does not contain the binary specified in configuration - ${binName}`);

    return callback(null);
}

function validateConfiguration(packageJson) {

    if (!packageJson.version) {
        return "'version' property must be specified";
    }

    if (!packageJson.goBinary || typeof(packageJson.goBinary) !== "object") {
        return "'goBinary' property must be defined and be an object";
    }

    if (!packageJson.goBinary.name) {
        return "'name' property is necessary";
    }

    if (!packageJson.goBinary.path) {
        return "'path' property is necessary";
    }

    if (!packageJson.goBinary.url) {
        return "'url' property is required";
    }

    if (!packageJson.bin || typeof(packageJson.bin) !== "object") {
        return "'bin' property of package.json must be defined and be an object";
    }

    if (packageJson.goBinary.path !== packageJson.bin[packageJson.goBinary.name]) {
        return "'bin' property must be a map from 'name' to 'path'. This is necessary for NPM Global install to work";
    }
}

/**
 * Reads the configuration from application's package.json,
 * validates properties, downloads the binary, untars, and stores at
 * ./bin in the package's root. NPM already has support to install binary files
 * specific locations when invoked with "npm install -g"
 *
 *  See: https://docs.npmjs.com/files/package.json#bin
 */
const INVALID_INPUT = "Invalid inputs";
function install(callback) {
    if (!(process.arch in ARCH_MAPPING)) {
        console.error("Installation is not supported for this architecture: " + process.arch);
        return callback(INVALID_INPUT);
    }

    if (!(process.platform in PLATFORM_MAPPING)) {
        console.error("Installation is not supported for this platform: " + process.platform);
        return callback(INVALID_INPUT);
    }

    const packageJsonPath = path.join(".", "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        console.error("Unable to find package.json. " +
            "Please run this script at root of the package you want to be installed");
        return callback(INVALID_INPUT);
    }

    let packageJson = JSON.parse(fs.readFileSync(packageJsonPath));
    let error = validateConfiguration(packageJson);
    if (error && error.length > 0) {
        console.error("Invalid package.json: " + error);
        return callback(INVALID_INPUT);
    }

    // We have validated the config. It exists in all its glory
    let binName = packageJson.goBinary.name;
    let binPath = packageJson.goBinary.path;
    let url = packageJson.goBinary.url;
    let version = packageJson.version;
    if (version[0] === 'v') version = version.substr(1);  // strip the 'v' if necessary v0.0.1 => 0.0.1

    // Interpolate variables in URL, if necessary
    url = url.replace("{{arch}}", ARCH_MAPPING[process.arch]);
    url = url.replace("{{platform}}", PLATFORM_MAPPING[process.platform]);
    url = url.replace("{{version}}", version);
    url = url.replace("{{bin_name}}", binName);


    mkdirp.sync(binPath);
    let ungz = zlib.createGunzip();
    let untar = tar.Extract({path: binPath});

    ungz.on('error', callback);
    untar.on('error', callback);

    // First we will Un-GZip, then we will untar. So once untar is completed,
    // binary is downloaded into `binPath`. Verify the binary and call it good
    untar.on('end', verifyBinary.bind(null, binName, binPath, callback));

    console.log("Downloading from URL: " + url);
    let req = request({uri: url});
    req.on('error', callback.bind(null, "Error downloading from URL: " + url));
    req.on('response', function(res) {
        if (res.statusCode !== 200) return callback("Error downloading binary. HTTP Status Code: " + res.statusCode);

        req.pipe(ungz).pipe(untar);
    })
}


install(function(err) {
    if (err) {
        console.error(err);
        process.exit(1);
    } else {
        process.exit(0);
    }
});

