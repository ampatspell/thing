import { getOwner } from '@ember/application';
import { A } from '@ember/array';
import { all } from 'rsvp';
import Internal from './model/internal';
import InternalRootContext from './context/internal-root-context';
import InternalNestedContext from './context/internal-nested-context';
import FastbootManager from './stores/fastboot-manager';

export default class InternalStores extends Internal {

  constructor(model) {
    super();
    this._model = model;
    this.contexts = A();
    this.fastbootManager = new FastbootManager(this);
  }

  get isFastBoot() {
    return this.fastbootManager.isFastBoot;
  }

  getOwner() {
    return getOwner(this.model(true));
  }

  factoryFor(name) {
    return this.getOwner().factoryFor(name);
  }

  registerFactory(name, factory) {
    this.getOwner().register(name, factory);
  }

  createInternalRootContext(identifier, opts) {
    let internal = new InternalRootContext(this, identifier, opts);
    this.contexts.pushObject(internal);
    return internal;
  }

  createInternalNestedContext(parent, identifier) {
    return new InternalNestedContext(parent, identifier);
  }

  rootContextWillDestroy(internal) {
    this.contexts.removeObject(internal);
  }

  settle() {
    return all(this.contexts.map(context => context.settle()));
  }

  serialize(format) {
    let contexts = {};
    this.contexts.map(context => context.flatContexts.map(context => {
      contexts[context.absoluteIdentifier] = context.serialize(format);
    }));
    return contexts;
  }

  willDestroy() {
    this.contexts.map(context => context.destroy());
    super.willDestroy();
  }

}
