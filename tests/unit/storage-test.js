import module from '../helpers/module-for-firebase';
import { test } from '../helpers/qunit';
import { run } from '@ember/runloop';
import { resolve } from 'rsvp';
import { typeOf } from '@ember/utils';

module('storage', {
  beforeEach() {
    this.storage = this.store.get('storage');
    this.identity = this.store._internal.identity.storage;
    this.signIn = () => this.store.get('auth.methods.anonymous').signIn();

    this.ref = this.storage.ref({ path: 'hello' });

    this.put = () => this.ref.put({
      type: 'string',
      data: 'hello world as a raw string',
      format: 'raw',
      metadata: {
        contentType: 'text/plain',
        customMetadata: { ok: true }
      }
    });

    this._put = (path='hello') => {
      let storage = this.store.get('app').storage();
      let ref = storage.ref(path);
      return resolve(ref.putString('hello world', 'raw', { contentType: 'text/plain' }));
    }
  }
});

test('storage exists', async function(assert) {
  let storage = this.store.get('storage');
  assert.ok(storage);
});

test('storage is not shared between contexts', async function(assert) {
  let root = this.store.get('storage');
  let nested = this.store.nest('foo').get('storage');
  assert.ok(nested);
  assert.ok(root !== nested);
});

test('storage is destroyed on context destroy', async function(assert) {
  let storage = this.store.get('storage');
  run(() => this.store.destroy());
  assert.ok(storage.isDestroyed);
});

test('create ref', async function(assert) {
  let ref = this.storage.ref({ path: 'hello' });
  assert.ok(ref);
  assert.ok(ref._internal);
  let bucket = ref.get('bucket');
  assert.equal(bucket, this.store.get('app').options.storageBucket);
  assert.deepEqual(ref.get('serialized'), {
    "bucket": bucket,
    "fullPath": "hello",
    "name": "hello"
  });
});

test('create ref from url', async function(assert) {
  let ref = this.storage.ref({ url: 'gs://foo/bar' });
  assert.ok(ref);
  assert.ok(ref._internal);
  assert.deepEqual(ref.get('serialized'), {
    "bucket": "foo",
    "fullPath": "bar",
    "name": "bar"
  });
});

test('put string', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'hello' });

  let task = ref.put({
    type: 'string',
    data: 'hello world as a raw string',
    format: 'raw',
    metadata: {
      contentType: 'text/plain',
      customMetadata: { ok: true }
    }
  });

  assert.ok(task);
  assert.equal(task.get('type'), 'string');

  let promise = task.get('promise');
  assert.ok(promise);

  await promise;
});

test('put blob', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'hello' });

  let task = ref.put({
    type: 'data',
    data: new Blob([ 'hello world as a blob' ]),
    metadata: {
      contentType: 'text/plain',
      customMetadata: { ok: true }
    }
  });

  assert.ok(task);
  assert.equal(task.get('type'), 'data');

  let promise = task.get('promise');
  assert.ok(promise);

  await promise;
});

test('settle', async function(assert) {
  await this.signIn();
  let task = this.put();

  await this.store.settle();

  assert.ok(task.get('isCompleted'));
  assert.ok(this.storage.get('tasks.length') === 0);
});

test('running tasks are registered in storage', async function(assert) {
  await this.signIn();
  let tasks = this.storage.get('tasks');

  assert.ok(tasks.get('length') === 0);

  let task = this.put();

  assert.ok(tasks.get('length') === 1);
  assert.ok(tasks.includes(task));

  await task.get('promise');

  assert.ok(tasks.get('length') === 0);
});

test('task has ref', async function(assert) {
  await this.signIn();
  let task = this.put();
  assert.ok(task.get('reference') === this.ref);
});

test('task properties', async function(assert) {
  await this.signIn();
  let task = this.put();

  assert.deepEqual(task.get('serialized'), {
    "bytesTransferred": 0,
    "downloadURL": null,
    "error": null,
    "isCompleted": false,
    "isError": false,
    "isRunning": true,
    "percent": 0,
    "totalBytes": 27,
    "type": "string"
  });

  await task.get('promise');

  let downloadURL = task.get('downloadURL');
  assert.ok(downloadURL.includes('https://firebasestorage.googleapis.com'));
  assert.deepEqual(task.get('serialized'), {
    "bytesTransferred": 27,
    "downloadURL": downloadURL,
    "error": null,
    "isCompleted": true,
    "isError": false,
    "isRunning": false,
    "percent": 100,
    "totalBytes": 27,
    "type": "string"
  });
});

test('destroy nested context while uploading', async function(assert) {
  await this.signIn();

  let nested = this.store.nest('nested');
  let ref = nested.get('storage').ref({ path: 'hello' });
  let task = ref.put({ type: 'string', data: 'hey', format: 'raw', metadata: { contentType: 'text/plain' } });

  run(() => nested.destroy());

  assert.ok(task.isDestroyed);
});

test('task upload error', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'forbidden/hello' });

  let task = ref.put({
    type: 'string',
    data: 'hello world as a raw string',
    format: 'raw',
    metadata: {
      contentType: 'text/plain',
    }
  });

  let error;
  await task.get('promise').catch(err => error = err);

  assert.deepEqual(task.get('serialized'), {
    "bytesTransferred": 0,
    "downloadURL": null,
    "error": error,
    "isCompleted": true,
    "isError": true,
    "isRunning": false,
    "percent": 0,
    "totalBytes": 27,
    "type": "string"
  });

  assert.ok(error);
  assert.ok(error.code === 'storage/unauthorized');
});

test('ref load resolves with ref', async function(assert) {
  await this.signIn();
  await this._put();

  let ref = this.storage.ref({ path: 'hello' });
  let result = await ref.load();
  assert.ok(ref === result);
});

test('ref load reject', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'missing' });
  try {
    await ref.load();
    assert.ok(false, 'should throw');
  } catch(err) {
    assert.ok(true);
    assert.equal(err.code, 'storage/object-not-found');
  }
});

test('ref load optional', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'missing' });
  let result = await ref.load({ optional: true });
  assert.ok(result === ref);
});

test('ref has metadata', async function(assert) {
  let ref = this.storage.ref({ path: 'missing' });
  let metadata = ref.get('metadata');
  assert.ok(metadata);
  assert.ok(metadata._internal);
  assert.ok(metadata.get('reference') === ref);

  assert.deepEqual(metadata.get('serialized'), {
    "error": null,
    "isError": false,
    "isExisting": undefined,
    "isLoading": false,
    "isLoaded": false
  });
});

test('metadata is destroyed with ref', async function(assert) {
  let ref = this.storage.ref({ path: 'missing' });
  let metadata = ref.get('metadata');
  run(() => ref.destroy());
  assert.ok(metadata.isDestroyed);
});

test('load metadata', async function(assert) {
  await this.signIn();
  await this._put();

  let ref = this.storage.ref({ path: 'hello' });
  let metadata = ref.get('metadata');

  assert.deepEqual(metadata.get('serialized'), {
    "error": null,
    "isError": false,
    "isExisting": undefined,
    "isLoaded": false,
    "isLoading": false
  });

  await metadata.load();

  assert.deepEqual(metadata.get('serialized'), {
    "contentType": "text/plain",
    "error": null,
    "isError": false,
    "isExisting": true,
    "isLoaded": true,
    "isLoading": false,
    "name": "hello",
    "size": 11
  });
});

test('load optional metadata for missing', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'missing' });
  let metadata = ref.get('metadata');

  assert.deepEqual(metadata.get('serialized'), {
    "error": null,
    "isError": false,
    "isExisting": undefined,
    "isLoaded": false,
    "isLoading": false
  });

  await metadata.load({ optional: true });

  assert.deepEqual(metadata.get('serialized'), {
    "error": null,
    "isError": false,
    "isExisting": false,
    "isLoaded": true,
    "isLoading": false
  });
});

test('load metadata for missing', async function(assert) {
  await this.signIn();

  let ref = this.storage.ref({ path: 'missing' });
  let metadata = ref.get('metadata');

  assert.deepEqual(metadata.get('serialized'), {
    "error": null,
    "isError": false,
    "isExisting": undefined,
    "isLoaded": false,
    "isLoading": false
  });

  try {
    await metadata.load();
  } catch(err) {
    assert.equal(err.code, 'storage/object-not-found');
  }

  let error = metadata.get('error');

  assert.ok(error);

  assert.deepEqual(metadata.get('serialized'), {
    "error": error,
    "isError": true,
    "isExisting": false,
    "isLoaded": true,
    "isLoading": false
  });
});

test('metadata load succeeds', async function(assert) {
  await this.signIn();
  await this._put();

  let ref = this.storage.ref({ path: 'hello' });
  let metadata = ref.get('metadata');

  await metadata.load();

  assert.ok(metadata.get('raw'));

  assert.deepEqual(metadata.get('serialized'), {
    "isLoading": false,
    "isLoaded": true,
    "isExisting": true,
    "isError": false,
    "error": null,
    "name": "hello",
    "size": 11,
    "contentType": "text/plain"
  });

  assert.ok(typeOf(metadata.get('createdAt')) === 'date');
});

test('ref download url', async function(assert) {
  await this.signIn();
  await this._put();

  let ref = this.storage.ref({ path: 'hello' });

  assert.equal(ref.get('url'), undefined);

  await ref.load();

  assert.ok(ref.get('url').includes('/o/hello'));
});

test('metadata update', async function(assert) {
  await this.signIn();
  await this._put();

  let ref = this.storage.ref({ path: 'hello' });
  let metadata = ref.get('metadata');

  await metadata.update({ contentType: 'text/plainest', customMetadata: { hello: 'world' } });

  assert.deepEqual(metadata.get('serialized'), {
    "isLoading": false,
    "contentType": "text/plainest",
    "error": null,
    "isError": false,
    "isExisting": true,
    "isLoaded": true,
    "name": "hello",
    "size": 11,
    "customMetadata": {
      "hello": "world"
    }
  });
});

test('ref as a string', async function(assert) {
  let images = this.storage.ref('images/hello');
  assert.equal(images.get('fullPath'), 'images/hello');
});

test('ref child', async function(assert) {
  let images = this.storage.ref('images');
  let image = images.child('image');
  assert.equal(image.get('fullPath'), 'images/image');
  assert.ok(this.storage.ref('images') === images);
});

test('ref parent', async function(assert) {
  let image = this.storage.ref('images/image');
  let images = image.get('parent');
  assert.equal(images.get('fullPath'), 'images');
  assert.ok(this.storage.ref('images') === images);
});

test('reference is added to identity', async function(assert) {
  let one = this.storage.ref('images/image');
  let two = this.storage.ref('images/image');
  assert.ok(one === two);
});

test('destroy ref is removed from identity', async function(assert) {
  let ref = this.storage.ref('images/image');
  let internal = ref._internal;

  let url = internal.ref.toString();

  assert.ok(this.identity.storage.all.includes(internal));
  assert.ok(this.identity.storage.ref[url] === internal);

  run(() => ref.destroy());

  assert.ok(!this.identity.storage.all.includes(internal));
  assert.ok(!this.identity.storage.ref[url]);
});
