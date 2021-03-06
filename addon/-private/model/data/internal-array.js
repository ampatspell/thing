import { A } from '@ember/array';
import InternalData, { typed } from './internal-data';
import { toModel, nothing } from './util';

export default typed(class InternalArray extends InternalData {

  constructor(context, parent) {
    super(context, parent, A());
    this.observing = false;
  }

  createModel() {
    return this.factoryFor('zug:data/array').create({ _internal: this, content: this.content });
  }

  withPropertyChanges(notify, cb) {
    let { result, updated } = super.withPropertyChanges(notify, changed => {

      let result = cb(changed);
      let updated = !!changed.properties.length;

      if(updated) {
        changed('serialized');
      }

      return { result, updated };
    }, [ 'inserted', 'removed' ]);

    if(updated) {
      this.didUpdate(notify);
    }

    return result;
  }

  removeInternal(array, changed) {
    if(array.length === 0) {
      return;
    }
    array.map(internal => this.detachInternal(internal));
    this.content.removeObjects(array);
    changed('removed');
  }

  insertInternal(array, changed) {
    if(array.length === 0) {
      return false;
    }
    array.forEach(({ internal, idx }) => {
      this.attachInternal(internal);
      this.content.insertAt(idx, internal);
    });
    changed('inserted');
  }

  get valueObserverOptions() {
    return {
      willChange: this.contentWillChange,
      didChange: this.contentDidChange
    };
  }

  contentWillChange(array, start, removeCount) {
    if(removeCount) {
      let removing = array.slice(start, start + removeCount);
      removing.forEach(internal => this.detachInternal(internal));
    }
  }

  contentDidChange(array, start, removeCount, addCount) {
    if(addCount) {
      let adding = array.slice(start, start + addCount);
      adding.forEach(internal => this.attachInternal(internal));
    }
    this.didUpdate(true);
  }

  startObserving() {
    if(this.observing || this.isDetached || !this.model(false)) {
      return;
    }
    this.observing = true;
    this.content.addArrayObserver(this, this.valueObserverOptions);
  }

  stopObserving() {
    if(!this.observing) {
      return;
    }
    this.observing = false;
    this.content.removeArrayObserver(this, this.valueObserverOptions);
  }

  didDetach() {
    this.stopObserving();
    super.didDetach();
  }

  didAttach() {
    this.startObserving();
    super.didAttach();
  }

  didCreateModel() {
    super.didCreateModel();
    this.startObserving();
  }

  didDestroyModel() {
    this.stopObserving();
    super.didDestroyModel();
  }

  //

  transformedAsInternal(value) {
    let { internal } = this.manager.update(nothing, value, 'model', false);
    return internal;
  }

  transformedAsModel(value) {
    return toModel(value);
  }

}, 'array');
