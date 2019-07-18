import module from '../helpers/module-for-firebase';
import { test } from '../helpers/qunit';
import { run } from '@ember/runloop';

module('functions');

test('functions exists', async function(assert) {
  let functions = this.store.get('functions');
  assert.ok(functions);
});

test('functions is shared between contexts', async function(assert) {
  let functions = this.store.get('functions');
  let nested = this.store.nest('foo').get('functions');
  assert.ok(functions === nested);
});

test('functions is destroyed on context destroy', async function(assert) {
  let functions = this.store.get('functions');
  run(() => this.store.destroy());
  assert.ok(functions.isDestroyed);
});

test('direct', async function(assert) {
  let functions = this.store.get('app').functions();
  let fn = functions.httpsCallable('callable');
  let result = await fn();
  assert.deepEqual(result, {
    "data": {
      "app": "ember-cli-zug",
      "data": null,
      "ok": true
    }
  });
});

test('invoke function', async function(assert) {
  let ops = this.store._internal.operations.operations;

  let fn = this.store.get('functions').function('callable');
  assert.ok(ops.length === 0);

  let promise = fn({ hello: 'world' });
  assert.ok(ops.length === 1);

  let result = await promise;

  assert.ok(ops.length === 0);

  assert.deepEqual(result, {
    "data": {
      "app": "ember-cli-zug",
      "ok": true,
      "data": {
        "hello": "world"
      }
    }
  });
});
