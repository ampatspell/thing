'use strict';

let create = require('broccoli-file-creator');
let mergeTrees = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');
let firebase = require('firebase');
let pkg = require('./package.json');
let path = require('path');

module.exports = {
  name: 'ember-cli-zug',
  isDevelopingAddon() {
    return false;
  },
  included(app) {
    this._super.apply(this, arguments);
    app.import('vendor/ember-cli-zug/firebase.js');
    app.import('vendor/ember-cli-zug/firebase.js.map');
    app.import('vendor/ember-cli-zug/firebase-firestore.js');
    app.import('vendor/ember-cli-zug/firebase-firestore.js.map');
    app.import('vendor/ember-cli-zug/firebase-functions.js');
    app.import('vendor/ember-cli-zug/firebase-functions.js.map');
    app.import('vendor/ember-cli-zug/firebase-shim.js');
    app.import('vendor/ember-cli-zug/versions.js');
  },
  treeForVendor(vendorTree) {
    let trees = [];

    if(vendorTree) {
      trees.push(vendorTree);
    }

    trees.push(create('ember-cli-zug/versions.js', [
      `Ember.libraries.register('${pkg.name}', '${pkg.version}');`,
      `Ember.libraries.register('Firebase SDK', '${firebase.SDK_VERSION}');`
    ].join('\n')));

    trees.push(new Funnel(path.dirname(require.resolve('firebase/firebase')), {
      files: [
        'firebase.js',
        'firebase.js.map',
        'firebase-firestore.js',
        'firebase-firestore.js.map',
        'firebase-functions.js',
        'firebase-functions.js.map'
      ],
      destDir: '/ember-cli-zug'
    }));

    return mergeTrees(trees);
  }
};
