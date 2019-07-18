import { assert } from '@ember/debug'
import Internal from './internal';
import QueryState from './query-state';

const normalize = opts => {
  assert(`opts must be object`, typeof opts === 'object');
  let { query } = opts;
  assert(`opts.query must be function`, typeof query === 'function');
  return opts;
}

export default class InternalQuery extends Internal {

  constructor(context, opts) {
    super();
    this.context = context;
    this.opts = normalize(opts);
    this.state = new QueryState(this);
    this.observer = this._createObserver();
  }

  get id() {
    return this.opts.id;
  }

  get content() {
    return this.observer.content;
  }

  get metadata() {
    return this.observer.metadata;
  }

  createModel() {
    return this.context.factoryFor('zug:query').create({ _internal: this });
  }

  load() {
    return this.observer.promise;
  }

  modelForSnapshot(snapshot) {
    return this.context.loadedInternalPersistedModelForSnapshot(snapshot).model(true);
  }

  get query() {
    let firestore = this.context.firestore;
    let query = this.opts.query;
    return query(firestore);
  }

  get observerDelegate() {
    return {
      onMetadata: () => this.onMetadata(),
      onLoading: () => this.onLoading(),
      onLoaded: () => this.onLoaded(),
      onUpdated: () => this.notifyContentDidChange(),
      createModel: snapshot => this.modelForSnapshot(snapshot),
      updateModel: (model, snapshot) => this.modelForSnapshot(snapshot),
      destroyModel: () => {}
    };
  }

  _createObserver() {
    return this.createObserver(this.context, this.query, this.observerDelegate);
  }

  withState(cb) {
    this.withPropertyChanges(true, changed => cb(this.state, changed));
  }

  notifyContentDidChange() {
    this.withPropertyChanges(true, changed => changed('content'));
  }

  onMetadata() {
    this.withPropertyChanges(true, changed => changed('metadata'));
  }

  onLoading() {
    this.withState((state, changed) => state.onLoading(changed));
  }

  onLoaded() {
    this.withState((state, changed) => state.onLoaded(changed));
  }

  onError(err) {
    this.withState((state, changed) => state.onError(err, changed));
  }

  willDestroy() {
    this.observer.destroy();
    this.context.queriesManager.removeInternalQuery(this);
    super.willDestroy();
  }

}
