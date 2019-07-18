import EmberObject from '@ember/object';
import { InternalMixin, prop, modelprop, model, promise, invoke } from '../model/internal';
import { property } from '../model/model-array-proxy';

const identity = property(internal => internal.identity.models);

export default EmberObject.extend(InternalMixin, {

  identifier:         prop('identifier'),
  absoluteIdentifier: prop('absoluteIdentifier'),
  ready:              prop('ready'),

  identity:  identity(),
  auth:      modelprop('auth'),
  storage:   modelprop('storage'),
  functions: modelprop('functions'),

  // identifier
  nest: model('nest'),

  // { name, id, collection, path, data: { ... } }
  model: model('build'),

  // { name, id, collection, path, create }
  existing: model('existing'),

  // { type, id, query() }
  query: model('query'),

  // { type, model: [], matches() }
  matcher: model('matcher'),

  // { id, collection, path, query: q => { ... } }
  load: invoke('load'),

  // { id, collection, path, query: q => { ... }, optional }
  first: invoke('first'),

  //
  settle: promise('settle'),

  // name
  hasModelClassForName: invoke('hasModelClassForName'),

  // firebase.app.App
  app: prop('firebase'),

  toStringExtension() {
    let identifier = this.get('absoluteIdentifier');
    return `${identifier}`;
  }

});
