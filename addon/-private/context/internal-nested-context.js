import InternalContext from './internal-context';

export default class InternalNestedContext extends InternalContext {

  constructor(parent, identifier) {
    super(parent.stores, identifier);
    this.parent = parent;
    this.root = parent.root;
    this._configure(parent);
  }

  get opts() {
    return this.parent.opts;
  }

  get absoluteIdentifier() {
    return `${this.parent.absoluteIdentifier}/${this.identifier}`;
  }

  _configure(parent) {
    this.firebase  = parent.firebase;
    this.firestore = parent.firestore;
    this.auth      = parent.auth;
    this.functions = parent.functions;
    this.ready     = parent.ready;
  }

  willDestroy() {
    this.parent.nestedContextWillDestroy(this);
    super.willDestroy();
  }

}
