## Go NPM
### Distribute cross-platform Go binaries via NPM

Applications written in Golang are portable - you can easily cross-compile binaries that work on Windows, Mac, and Linux. But how do you distribute the binaries to customers? When you publish new releases, how do they update the binary? 

**Use NPM to distribute cross-platform Go binaries**

## Kidding me! Why NPM?
* **Cross-platform**: NPM is the only popular package manager that works cross-platform. 
* **Lower barier to entry**: Most developers have NPM installed already. 
* **Pain free publishing**: It just takes one command to publish - `npm publish`
* **Dead simple install & update story**: `npm install/update -g your-awesome-app`
* **Adds $PATH**: NPM will automatically add your binary location to $PATH and generate .cmd file for Windows. Your app just works after installation! 

## Okay, tell me how?
### 1. Publish your binaries
Setup your Go application to compile and publish binaries to a file server. This could be Github Releases or Amazon S3 or even Dropbox. All you need is a link.

I like to use [GoReleaser](https://github.com/goreleaser/goreleaser) to setup by release process. You create a simple YAML configuration file like this and run `goreleaser` CLI to publish binaries for various platform/architecture combination to Github:

```
# .goreleaser.yml
# Build customization
builds:
  - binary: drum-roll
    goos:
      - windows
      - darwin
      - linux
    goarch:
      - amd64
```

`go-npm` will pull the appropriate binary for the platform & architecture where the package is being installed.

### 2. Create a package.json file for your NPM app
To publish to NPM, you need to create a `package.json` file. You give your application a name, link to Readme, Github repository etc, and more importantly add `go-npm` as a dependency. You can create this file in an empty directory in your project or in a separate Git repository altogether. It is your choice.

**Create package.json**

`$ npm init`

Answer the questions to create an initial package.json file

**Add go-npm dependency**

From the directory containing package.json file, do

`$ npm install go-npm --save`

This will install go-npm under to your package.json file. It will also create a `node_modules` directory where the `go-npm` package is downloaded. You don't need this directory since you are only going to publish the module and not consume it yourself. Let's go ahead and delete it.

`$ rm -r node_modules`

**Add postinstall and preuninstall scripts**
Here is the magic: You ask to run `go-npm install` after it completes installing your package. This will pull down binaries from Github or Amazon S3 and install in NPM's `bin` directory. Binaries under bin directory are immediately available for use in your Terminal.

Edit `package.json` file and add the following:
```
{
    "postinstall": "go-npm install",
    "preuninstall": "go-npm uninstall",
}
```

`go-npm uninstall` simply deletes the binary from `bin` directory before NPM uninstalls your package.

**Configure your binary path**

You need to tell `go-npm` where to download the binaries from, and where to install them. Edit `package.json` file and add the following configuration.

```
"goBinary": {
      "name": "command-name",
      "path": "./bin",
      "url": "https://github.com/user/my-go-package/releases/download/v{{version}}/myGoPackage_{{version}}_{{platform}}_{{arch}}.tar.gz"
```

* *name*: Name of the command users will use to run your binary. 
* *path*: Temporary path where binaries will be downloaded to
* *url*: HTTP Web server where binaries are hosted.

Following variables are available to customize the URL:
* `{{version}}`: Version number read from  `package.json` file. When you publish your package to NPM, it will use this version number. Ex: 0.0.1
* `{{platform}}`: `$GOOS` value for the platform
* `{{arch}}`: `$GOARCH` value for the architecture

If you use `goreleaser` to publish your modules, it will automatically set the right architecture & platform in your URL.

**Publish to NPM**

All that's left now is publish to NPM. As I promised before, just one command

`$ npm publish`

### 3. Distribute to users

To install:

`npm install -g your-app-name`

To Update:

`npm update -g your-app-name`


---

With ❤️ to the community by [Sanath Kumar Ramesh](http://twitter.com/sanathkr_)