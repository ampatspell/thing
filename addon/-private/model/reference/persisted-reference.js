import Reference from './reference';
import BasicDocumentObserver from '../observer/basic-document-observer';
import FireError from '../../util/error';
import { resolve, reject } from 'rsvp';

export default class PersistedReference extends Reference {

  constructor(context, ref) {
    super();
    this._ref = ref;
    this._observer = null;
  }

  get id() {
    return this._ref.id;
  }

  get collection() {
    return this._ref.parent.path;
  }

  get path() {
    return this._ref.path;
  }

  get immutablePath() {
    return this.path;
  }

  get metadata() {
    let observer = this.observer();
    return observer && observer.metadata;
  }

  //

  _createObserver() {
    let context = this.context;
    let ref = this._ref;
    return new BasicDocumentObserver(context, ref, {
      onMetadata: metadata => this._onMetadata(metadata),
      onSnapshot: snapshot => this._didLoad(snapshot)
    });
  }

  observer(create) {
    let observer = this._observer;
    if(!observer && create) {
      observer = this._createObserver();
      this._observer = observer;
      observer.start();
      console.log('created observer', this.immutablePath);
    }
    return observer;
  }

  _onMetadata() {
    this.withDocument(document => document.onMetadata());
  }

  _didLoad(snapshot) {
    this.withDocument(document => document.didLoad(snapshot));
  }

  _willSave() {
    this.withDocument(document => document.willSave());
  }

  _didSave() {
    this.withDocument(document => document.didSave());
  }

  _saveDidFail(err) {
    console.log('_saveDidFail', this, err);
  }

  save() {
    let document = this.document;

    if(!document.state.isDirty) {
      return resolve();
    }

    let data = document.data.serialize('storage');
    let ref = this._ref;

    this._willSave();
    return this.transaction.refSet(ref, data).then(() => this._didSave(), err => this._saveDidFail(err));
  }

  // { optional }
  load(opts={}) {
    return this.observer(true).promise.then(snapshot => {
      if(!snapshot.exists && !opts.optional) {
        return reject(new FireError({ error: 'document', reason: 'missing' }));
      }
    });
  }

  _willDelete() {
    this.withDocument(document => document.willDelete());
  }

  _didDelete() {
    this.withDocument(document => document.didDelete());
  }

  _deleteDidFail(err) {
    console.log('_deleteDidFail', this, err);
  }

  delete() {
    let ref = this._ref;
    let transaction = this.transaction;
    this._willDelete();
    return transaction.refDelete(ref).then(() => this._didDelete(), err => this._deleteDidFail(err));
  }

  //

  willDestroy() {
    this._observer && this._observer.destroy();
    super.willDestroy();
  }

}
