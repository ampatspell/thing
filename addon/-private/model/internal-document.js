import Internal from './internal';
import Queue from './queue';
import DocumentState from './document-state';

export default class InternalDocument extends Internal {

  constructor(context, reference, data, state) {
    super();
    this.context = context;
    this._data = data;
    this._queue = new Queue(context.operations);
    this._state = new DocumentState(this);
    this._reference = null;
    this._skipDirtying = 0;

    this.withPropertyChanges(false, changed => {
      this.assignReference(reference, changed);
      this._state.set(state, changed);
    });

    data.attach(this);
  }

  factoryFor(name) {
    return this.context.factoryFor(name);
  }

  createModel() {
    return this.factoryFor('zug:document').create({ _internal: this });
  }

  get documents() {
    return this.context.documentsManager;
  }

  //

  get immutablePath() {
    return this._reference.immutablePath;
  }

  get state() {
    return this._state;
  }

  get isNew() {
    return this._reference.referenceType === 'local';
  }

  get data() {
    return this._data;
  }

  //

  assignReference(reference, changed) {
    let current = this._reference;

    if(current === reference) {
      return;
    }

    reference.assignDocument(this);
    this._reference = reference;

    if(current) {
      current.destroy();
    }

    changed('id');
    changed('path');
    changed('collection');
    changed('metadata');
  }

  get id() {
    return this._reference.id;
  }

  get collection() {
    return this._reference.collection;
  }

  get path() {
    return this._reference.path;
  }

  set id(value) {
    this._reference.id = value;
  }

  set collection(value) {
    this._reference.collection = value;
  }

  set path(value) {
    this._reference.path = value;
  }

  get metadata() {
    return this._reference.metadata;
  }

  //

  _schedule(name, fn) {
    return this._queue.schedule({ name: `document-${name}`, document: this }, fn);
  }

  //

  onMetadata() {
    this.withPropertyChanges(true, changed => changed('metadata'));
  }

  //

  deserialize(json) {
    this.ignoringDataUpdates(() => this.context.dataManager.updateInternal(this.data, json, 'storage'));
  }

  didLoad(snapshot) {
    let exists = snapshot.exists;
    if(!(this.state.exists === undefined && !exists)) {
      let data = snapshot.data({ serverTimestamps: 'estimate' });
      this.deserialize(data);
    }
    this.withPropertyChanges(true, changed => this.state.onLoaded(exists, changed));
  }

  didCreate(ref) {
    let documents = this.documents;
    let reference = documents.createPersistedReferenceWithRef(ref, true);

    this.withPropertyChanges(true, changed => {
      this.assignReference(reference, changed);
      this.state.onCreated(changed);
    });

    documents.localInternalDocumentDidSave(this);
  }

  willSave() {
    this.withPropertyChanges(true, changed => this.state.onSaving(changed));
  }

  didSave() {
    this.withPropertyChanges(true, changed => this.state.onSaved(changed));
  }

  willDelete() {
    this.willSave();
  }

  didDelete() {
    this.withPropertyChanges(true, changed => this.state.onDeleted(changed));
  }

  // { optional }
  load(opts) {
    return this._schedule('load', () => this._reference.load(opts).then(() => this));
  }

  save() {
    return this._schedule('save', () => this._reference.save().then(() => this));
  }

  delete() {
    return this._schedule('delete', () => this._reference.delete().then(() => this));
  }

  //

  ignoringDataUpdates(cb) {
    this._skipDirtying++;
    cb();
    this._skipDirtying--;
  }

  didUpdateChildInternalData() {
    if(this._skipDirtying > 0) {
      return;
    }
    this.withPropertyChanges(true, changed => this.state.onDirty(changed));
  }

  //

  willDestroy() {
    this.documents.internalDocumentWillDestroy(this);
    this._queue.destroy();
    this._reference.destroy();
    this._data.destroy();
    super.willDestroy();
  }

}
