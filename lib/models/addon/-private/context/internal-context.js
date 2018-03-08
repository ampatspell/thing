import Internal from '../model/internal';
import { A } from '@ember/array';
import { all } from 'rsvp';
import { assert } from '@ember/debug';
import DataManager from './data-manager';
import DocumentsManager from './documents-manager';
import ModelsManager from './models-manager';
import TransactionManager from './transaction-manager';
import QueriesManager from './queries-manager';
import MatchersManager from './matchers-manager';
import LoadManager from './load-manager';
import FastbootManager from './fastboot-manager';
import Identity from './identity';
import Operations from './operations';

export default class InternalContext extends Internal {

  constructor(stores, identifier) {
    super();

    this.stores = stores;
    this.identifier = identifier;

    this.firebase = null;
    this.firestore = null;
    this.ready = null;

    this.contexts = A();

    this.dataManager = new DataManager(this);
    this.documentsManager = new DocumentsManager(this);
    this.modelsManager = new ModelsManager(this);
    this.transactionManager = new TransactionManager(this);
    this.queriesManager = new QueriesManager(this);
    this.matchersManager = new MatchersManager(this);
    this.loadManager = new LoadManager(this);
    this.fastbootManager = new FastbootManager(this);
    this.operations = new Operations();
    this.identity = new Identity(this);
  }

  _configure() {
    this.fastbootManager.enable();
  }

  get flatContexts() {
    let contexts = [ this ];
    this.contexts.map(context => contexts.push(...context.flatContexts));
    return contexts;
  }

  factoryFor(name) {
    return this.stores.factoryFor(name);
  }

  registerFactory(name, factory) {
    this.stores.registerFactory(name, factory);
  }

  modelFactoryName() {
    let opts = this.root.opts;
    if(opts.storeNameForIdentifier) {
      let parent = this.parent;
      let identifier = this.identifier;
      let absoluteIdentifier;
      if(parent) {
        absoluteIdentifier = `${parent.absoluteIdentifier}/${identifier}`;
      } else {
        absoluteIdentifier = identifier;
      }
      let name = opts.storeNameForIdentifier(absoluteIdentifier, identifier);
      if(name) {
        return `context:${name}`;
      }
    }
    return 'models:context';
  }

  createModel() {
    let factoryName = this.modelFactoryName();
    return this.factoryFor(factoryName).create({ _internal: this });
  }

  fork(identifier) {
    let internal = this.stores.createInternalNestedContext(this, identifier);
    this.contexts.pushObject(internal);
    return internal;
  }

  query(opts) {
    return this.queriesManager.createInternalQuery(opts);
  }

  matcher(opts) {
    return this.matchersManager.createInternalMatcher(opts);
  }

  load(opts) {
    return this.loadManager.load(opts);
  }

  first(opts) {
    return this.loadManager.first(opts);
  }

  // { name, id, collection, path, data: { ... } }
  build(opts) {
    return this.modelsManager.createNewInternalModel(opts);
  }

  // { name, id, collection, path, create }
  existing(opts) {
    return this.modelsManager.existingInternalModel(opts);
  }

  settle() {
    return all([
      this.operations.settle(),
      ...this.contexts.map(context => context.settle())
    ]);
  }

  hasModelClassForName(name) {
    return this.modelsManager.hasModelClassForName(name);
  }

  modelNameForDocument(document) {
    let documentModel = document.model(true);
    let contextModel = this.model(true);
    let modelName = this.opts.modelNameForDocument(documentModel, contextModel);
    assert(
      `opts.modelNameForDocument for '${documentModel.get('path')}' in ${contextModel.get('absoluteIdentifier')} must return a model name`,
      typeof modelName === 'string' && modelName.trim().length
    );
    return modelName;
  }

  loadedInternalPersistedModelForSnapshot(snapshot) {
    let document = this.documentsManager.loadedInternalDocumentForSnapshot(snapshot);
    return this.modelsManager.internalModelForDocument(document);
  }

  localInternalDocumentDidSave(internal) {
    this.modelsManager.localInternalDocumentDidSave(internal);
  }

  internalDocumentWillDestroy(internal) {
    this.modelsManager.internalDocumentWillDestroy(internal);
  }

  nestedContextWillDestroy(internal) {
    this.contexts.removeObject(internal);
  }

  serialize(format) {
    return {
      identity: this.identity.serialize(format)
    };
  }

  willDestroy() {
    this.contexts.map(context => context.destroy());
    this.queriesManager.destroy();
    this.matchersManager.destroy();
    this.identity.destroy();
    super.willDestroy();
  }

}
