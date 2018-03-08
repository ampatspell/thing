import Destroyable from '../model/destroyable';
import { afterRender } from '../util/runloop-promise';

const prefix = 'zug';

export default class FastbootManager extends Destroyable {

  constructor(context) {
    super();
    this.context = context;
    this.parent = context.stores.fastbootManager;
  }

  get fastboot() {
    return this.parent.fastboot;
  }

  get isFastBoot() {
    return this.parent.isFastBoot;
  }

  defer() {
    return afterRender().then(() => this.context.settle());
  }

  serialize() {
    return this.context.serialize('preview');
  }

  deserialize(payload) {
    this.payload = payload;
  }

  get identifier() {
    let identifier = this.context.absoluteIdentifier.replace(/\//g, '-');
    return `${prefix}-${identifier}`;
  }

  enable() {
    if(!this.context.isFastbootShoeboxEnabled) {
      return;
    }

    let fastboot = this.fastboot;
    if(!fastboot) {
      return;
    }

    let shoebox = fastboot.get('shoebox');
    if(!shoebox) {
      return;
    }

    let manager = this;
    let identifier = this.identifier;

    if(this.isFastBoot) {
      fastboot.deferRendering(this.defer());
      shoebox.put(identifier, {
        get payload() {
          return manager.serialize();
        }
      });
    } else {
      let object = shoebox.retrieve(identifier);
      if(!object) {
        return;
      }
      let payload = object.payload;
      if(!payload) {
        return;
      }
      manager.deserialize(payload);
    }
  }

}
