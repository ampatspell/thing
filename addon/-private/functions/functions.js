import EmberObject from '@ember/object';
import { InternalMixin, invoke } from '../model/internal';

export default EmberObject.extend(InternalMixin, {

  function: invoke('function')

});
