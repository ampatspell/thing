import module from '../helpers/module-for-firebase';
import { test } from '../helpers/qunit';
import { recreateCollection, waitForCollectionSize } from '../helpers/runloop';

module('document', {
  beforeEach() {
    this.coll = this.firestore.collection('ducks');
    this.recreate = () => recreateCollection(this.coll);
    this.create = props => this.store._internal.documents.createNewDocument(props);
  }
});

test('create a document', function(assert) {
  let doc = this.create({ collection: 'ducks', id: 'yellow', data: { name: 'Yellow' } });

  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: 'yellow',
    collection: 'ducks',
    path: 'ducks/yellow'
  });

  assert.deepEqual(doc.get('data.serialized'), {
    name: 'Yellow'
  });
});

test('create document without data', function(assert) {
  let doc = this.create({ collection: 'ducks', id: 'yellow' });

  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: 'yellow',
    collection: 'ducks',
    path: 'ducks/yellow'
  });

  assert.deepEqual(doc.get('data.serialized'), {});
});

test('create document with path', function(assert) {
  let doc = this.create({ path: 'ducks/yellow' });
  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: 'yellow',
    collection: 'ducks',
    path: 'ducks/yellow'
  });
});

test('create document with collection', function(assert) {
  let doc = this.create({ collection: 'ducks' });
  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: undefined,
    collection: 'ducks',
    path: undefined
  });
});

test('create blank document', function(assert) {
  let doc = this.create({});
  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: undefined,
    collection: undefined,
    path: undefined
  });
});

test('create document with id', function(assert) {
  let doc = this.create({ id: 'yellow' });
  assert.deepEqual(doc.getProperties('id', 'collection', 'path'), {
    id: 'yellow',
    collection: undefined,
    path: undefined
  });
});
