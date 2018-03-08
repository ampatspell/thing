import Destroyable from '../model/destroyable';
import ModelsIdentity from './models-identity';
import DocumentsIdentity from './documents-identity';

export default class Identity extends Destroyable {

  constructor(context) {
    super();
    this.context = context;
    this.models = new ModelsIdentity(context);
    this.documents = new DocumentsIdentity(context);
  }

  serialize(format) {
    return {
      documents: this.documents.serialize(format)
    };
  }

  willDestroy() {
    this.models.destroy();
    this.documents.destroy();
    super.willDestroy();
  }

}
