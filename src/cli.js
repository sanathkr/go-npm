const actions = {
  install: (callback) => require('./actions/install')(callback),
  uninstall: (callback) => require('./actions/uninstall')(callback)
};

// Parse command line arguments and call the right action
module.exports = ({ argv, exit }) => {
  if (argv && argv.length > 2) {
    const cmd = argv[2];

    if (!actions[cmd]) {
      console.log('Invalid command to go-npm. `install` and `uninstall` are the only supported commands');
      exit(1);
    } else {
      actions[cmd]((err) => {
        if (err) {
          console.error(err);
          exit(1);
        } else {
          exit(0);
        }
      });
    }
  } else {
    console.log('No command supplied. `install` and `uninstall` are the only supported commands');
    exit(1);
  }
};
