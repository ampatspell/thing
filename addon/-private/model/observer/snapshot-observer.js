import Destroyable from '../destroyable';
import { join } from '@ember/runloop';
import { defer } from 'rsvp';
import { DeferredOperation } from '../operation';

export default class SnapshotObserver extends Destroyable {

  constructor(context, query, delegate, options) {
    super();
    this._context = context;
    this._query = query;
    this._options = options;
    this._delegate = delegate;
    this._deferred = null;
    this._loaded = false;
    this._metadata = null;
    this._isStarted = false;
    this._content = null;
    this._operation = null;
  }

  get promise() {
    this.start();
    return this._deferred && this._deferred.promise;
  }

  get metadata() {
    let metadata = this._metadata;
    if(!metadata) {
      return;
    }
    let hash = {};
    for(let key in metadata) {
      let value = metadata[key];
      if(typeof value === 'function') {
        continue;
      }
      hash[key] = value;
    }
    return hash;
  }

  get content() {
    return this._content;
  }

  get loaded() {
    return this._loaded;
  }

  _onLoading() {
    let onLoading = this._delegate.onLoading;
    onLoading && onLoading();
  }

  _onLoaded() {
    let onLoaded = this._delegate.onLoaded;
    onLoaded && onLoaded();
  }

  _createModel(doc) {
    return this._delegate.createModel(doc);
  }

  _updateModel(model, doc) {
    return this._delegate.updateModel(model, doc);
  }

  _destroyModel(model) {
    return this._delegate.destroyModel(model);
  }

  _onUpdated() {
    this._delegate.onUpdated();
  }

  _onMetadata(metadata) {
    if(this._metadata && this._metadata.isEqual(metadata)) {
      return;
    }
    this._metadata = metadata;
    this._delegate.onMetadata(metadata);
  }

  _onSnapshotInternal(snapshot) {
    this._onMetadata(snapshot.metadata);

    this._onSnapshot(snapshot);

    if(this._loaded) {
      return;
    }

    this._loaded = true;
    this._onLoaded();
    this._deferred.resolve(snapshot);
  }

  _registerOperation(operation) {
    let operations = this._context.operations;
    return operations.invoke(operation);
  }

  _start() {
    if(this._isStarted || this.isDestroyed) {
      return;
    }
    this._deferred = defer();
    this._operation = new DeferredOperation(this._deferred, { name: 'query' });
    this._cancel = this._query.onSnapshot(this._options, snapshot => join(() => this._onSnapshotInternal(snapshot)));
    this._isStarted = true;
    this._registerOperation(this._operation);
    this._onLoading();
  }

  start() {
    this._start();
  }

  _stop() {
  }

  _stopInternal() {
    if(!this._isStarted) {
      return;
    }

    this._cancel();
    this._deferred.resolve();

    this._stop();

    this._cancel = null;
    this._query = null;
    this._deferred = null;
    this._operation = null;
  }

  willDestroy() {
    this._stopInternal();
    super.willDestroy();
  }

}
