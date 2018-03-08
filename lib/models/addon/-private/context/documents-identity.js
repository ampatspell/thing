import { A } from '@ember/array';
import Destroyable from '../model/destroyable';

export default class DocumentsIdentity extends Destroyable {

  constructor(context) {
    super();
    this.context = context;
    this.storage = {
      all: A(),
      ref: Object.create(null)
    };
  }

  storeLocalInternalDocument(internal) {
    let storage = this.storage;
    storage.all.addObject(internal);
  }

  storePersistedInternalDocument(internal) {
    let storage = this.storage;
    storage.all.addObject(internal);
    let path = internal.immutablePath;
    if(path) {
      storage.ref[path] = internal;
    }
  }

  persistedInternalDocument(path) {
    return this.storage.ref[path];
  }

  removeInternalDocument(internal) {
    let storage = this.storage;
    storage.all.removeObject(internal);
    let path = internal.immutablePath;
    if(path) {
      delete storage.ref[path];
    }
  }

  serialize(format) {
    let json = {};
    this.storage.all.forEach(doc => {
      let { ref, data } = doc.serialize(format);
      json[ref] = data;
    });
    return json;
  }

  willDestroy() {
    this.storage.all.map(internal => internal.destroy());
    super.willDestroy();
  }

}
