import InternalContext from './internal-context';
import configureFirebase from './firebase-initializer';
import { assert } from '@ember/debug';

const validate = opts => {
  assert(`options must be object`, typeof opts === 'object');
  let { firebase, modelNameForDocument, storeNameForIdentifier, firestorePersistenceEnabled, fastbootShoeboxEnabled } = opts;
  assert(`options.firebase must be object`, !firebase || typeof firebase === 'object');
  assert(`options.modelNameForDocument must be function`, typeof modelNameForDocument === 'function');
  assert(`options.storeNameForIdentifier must be function`, !storeNameForIdentifier || typeof storeNameForIdentifier === 'function');
  if(typeof firestorePersistenceEnabled === 'undefined') {
    opts.firestorePersistenceEnabled = true;
  }
  if(typeof fastbootShoeboxEnabled === 'undefined') {
    opts.fastbootShoeboxEnabled = true;
  }
  return opts;
}

export default class InternalRootContext extends InternalContext {

  constructor(stores, identifier, opts) {
    super(stores, identifier);
    this.root = this;
    this.opts = validate(opts);
    this._configure(identifier, opts);
  }

  get isFastbootShoeboxEnabled() {
    return this.opts.fastbootShoeboxEnabled;
  }

  get absoluteIdentifier() {
    return this.identifier;
  }

  get isFastBoot() {
    return this.stores.isFastBoot;
  }

  _configure(identifier, opts) {
    let persistenceEnabled = opts.firestorePersistenceEnabled;
    if(this.isFastBoot) {
      persistenceEnabled = false;
    }
    this.ready = configureFirebase(identifier, persistenceEnabled, opts.firebase).then(firebase => {
      this.firebase = firebase;
      this.firestore = firebase.firestore();
    });
    super._configure();
  }

  willDestroy() {
    this.stores.rootContextWillDestroy(this);
    this.firebase && this.firebase.delete();
    super.willDestroy();
  }

}
