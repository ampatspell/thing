const playground = async (/*store*/) => {
  // let app = store.get('app');
  // let functions = app.functions();
  // let fn = functions.httpsCallable('callable');
  // let result = await fn({ hello: 'world' });

  // let functions = store.get('functions');
  // let fn = functions.function('callable');
  // let result = await fn({ hello: 'world' });
  // console.log(result);
};

export default {
  name: 'dummy:dev',
  after: 'dummy:store',
  initialize(app) {
    let store = app.lookup('service:store');
    store.get('ready').then(() => playground(store));
  }
};
