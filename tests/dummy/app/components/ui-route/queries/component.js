import Component from '@ember/component';
import { query } from 'ember-cli-zug/model/computed';

export default Component.extend({
  classNameBindings: [ ':ui-route-queries' ],

  arrayFromQuery: query({
    id: 'array-from-query',
    type: 'array',
    query: db => db.collection('people').orderBy('name', 'asc').limit(3)
  }),

  arrayFromCollection: query({
    id: 'array-from-collection',
    type: 'array',
    query: db => db.collection('people').limit(3)
  }),

  arrayFromDocument: query({
    id: 'array-from-document',
    type: 'array',
    query: db => db.doc('people/N2pxhCYUSYtnosbaqZwJ')
  }),

  singleFromQuery: query({
    id: 'single-from-query',
    type: 'single',
    query: db => db.collection('people').orderBy('name', 'asc')
  }),

  singleFromDocument: query({
    id: 'single-from-document',
    type: 'single',
    query: db => db.doc('people/N2pxhCYUSYtnosbaqZwJ')
  })

});
