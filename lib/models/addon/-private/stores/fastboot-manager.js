import Destroyable from '../model/destroyable';

export default class FastbootManager extends Destroyable {

  constructor(stores) {
    super();
    this.stores = stores;
  }

  get fastboot() {
    let fastboot = this._fastboot;
    if(fastboot === undefined) {
      fastboot = this.stores.getOwner().lookup('service:fastboot') || null;
      this._fastboot = fastboot;
    }
    return fastboot;
  }

  get isFastBoot() {
    let fastboot = this.fastboot;
    return fastboot && fastboot.get('isFastBoot');
  }

}
