import Component from '@ember/component';
import { getOwner } from '@ember/application';
import { computed } from '@ember/object';

export default Component.extend({
  classNameBindings: [ ':ui-block-identity' ],

  context: null,

  isEnabled: computed(function() {
    let fastboot = getOwner(this).lookup('service:fastboot');
    if(!fastboot) {
      return true;
    }
    return !fastboot.get('isFastBoot');
  }),

});
