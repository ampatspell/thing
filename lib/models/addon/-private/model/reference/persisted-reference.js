import Reference from './reference';
import BasicDocumentObserver from '../observer/basic-document-observer';
import FireError from '../../util/error';
import { resolve, reject } from 'rsvp';

export default class PersistedReference extends Reference {

  constructor(context, ref) {
    super();
    this._ref = ref;
    this._observer = new BasicDocumentObserver(context, ref, {
      update: props => this._didLoad(props)
    });
    this._observer.start();
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

  //

  _didLoad({ exists, data, metadata }) {
    this.withDocument(document => document.didLoad(exists, data, metadata));
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
    return this._observer.promise.then(snapshot => {
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

  serialize() {
    return this.path;
  }

  //

  willDestroy() {
    this._observer.destroy();
    this._ref = null;
    super.willDestroy();
  }

}
