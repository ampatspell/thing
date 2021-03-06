import Component from '@ember/component';
import { query } from 'ember-cli-zug/model/computed';

const passthrough = value => value;

export default Component.extend({

  orderOptions:      passthrough([ '__name__', 'name', 'email', 'message' ]),
  collectionOptions: passthrough([ 'blogs', 'people', 'posts' ]),

  collection: 'people',
  order:      '__name__',

  query: query(function() {
    let { collection, order } = this.getProperties('collection', 'order');
    return {
      type: 'array',
      owner: [ 'collection', 'order' ],
      context: 'store',
      id: `all-${collection}-by-${order}`,
      query: db => db.collection(collection).orderBy(order, 'asc')
    };
  }),

  actions: {
    show(model) {
      this.get('router').transitionTo('model', model.get('doc.path'));
    }
  }

});
