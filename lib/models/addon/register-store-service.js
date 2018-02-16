export default (app, opts=null, identifier='store') => {
  let stores = app.lookup('models:stores');
  let store = stores.store(identifier, opts);
  app.register(`service:${identifier}`, store, { instantiate: false });
  return store;
}