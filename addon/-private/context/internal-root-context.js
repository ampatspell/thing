import InternalContext from './internal-context';
import Auth from '../auth/internal-auth';
import Functions from '../functions/internal-functions';
import configureFirebase from './firebase-initializer';
import { assert } from '@ember/debug';
import { resolve } from 'rsvp';

const validate = opts => {
  assert(`options must be object`, typeof opts === 'object');
  let { firebase, modelNameForDocument, storeNameForIdentifier, restoreUser, firestorePersistenceEnabled } = opts;
  assert(`options.firebase must be object`, !firebase || typeof firebase === 'object');
  assert(`options.modelNameForDocument must be function`, typeof modelNameForDocument === 'function');
  assert(`options.storeNameForIdentifier must be function`, !storeNameForIdentifier || typeof storeNameForIdentifier === 'function');
  assert(`options.restoreUser must be function`, !restoreUser || typeof restoreUser === 'function');
  if(typeof firestorePersistenceEnabled === 'undefined') {
    opts.firestorePersistenceEnabled = true;
  }
  return opts;
}

export default class InternalRootContext extends InternalContext {

  constructor(stores, identifier, opts) {
    super(stores, identifier);
    this.root = this;
    this.opts = validate(opts);
    this.auth = new Auth(this);
    this.functions = new Functions(this);
    this._configure(identifier, opts);
  }

  get absoluteIdentifier() {
    return this.identifier;
  }

  _configureFirebase(identifier, opts) {
    return configureFirebase(identifier, opts.firestorePersistenceEnabled, opts.firebase).then(firebase => {
      this.firebase = firebase;
      this.firestore = firebase.firestore();
    });
  }

  _configureAuth() {
    return this.auth.configure();
  }

  _configure(identifier, opts) {
    this.ready = resolve()
      .then(() => this._configureFirebase(identifier, opts))
      .then(() => this._configureAuth())
      .then(() => undefined);
  }

  onAuthUser(user) {
    let opts = this.opts;
    let promise;
    if(opts.restoreUser) {
      promise = opts.restoreUser(user.model(true), this.model(true));
    }
    return resolve(promise);
  }

  willDestroy() {
    this.stores.rootContextWillDestroy(this);
    this.auth.destroy();
    this.functions.destroy();
    this.firebase && this.firebase.delete();
    super.willDestroy();
  }

}
