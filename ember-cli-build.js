'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function(defaults) {
  let app = new EmberApp(defaults, {
    addons: {
      // blacklist: [ 'ember-cli-fastboot' ]
    }
  });

  app.import('node_modules/firebase/firebase.js');
  app.import('node_modules/firebase/firebase-firestore.js');
  app.import('vendor/shims/firebase.js');

  return app.toTree();
};
