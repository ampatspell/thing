import Internal from '../model/internal';
import { resolve } from 'rsvp';
import { PromiseOperation } from '../model/operation';

export default class InternalFunctions extends Internal {

  constructor(context) {
    super();
    this.context = context;
    this._functions = null;
  }

  createModel() {
    return this.context.factoryFor('zug:functions').create({ _internal: this });
  }

  get functions() {
    let functions = this._functions;
    if(!functions) {
      functions = this.context.firebase.functions();
      this._functions = functions;
    }
    return functions;
  }

  _wrap(fn) {
    return (...args) => {
      let promise = resolve(fn(...args));
      let operation = new PromiseOperation(promise, { name: 'function' });
      this.context.operations.invoke(operation);
      return operation.promise;
    };
  }

  function(name) {
    let functions = this.functions;
    let fn = functions.httpsCallable(name);
    return this._wrap(fn);
  }

}
