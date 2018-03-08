import { assign } from '@ember/polyfills';

const toProps = args => {
  let props = args[0];
  if(args.length === 2) {
    let app = args[0];
    props = args[1];
    props = assign({ app }, props);
  }
  return props;
};


// let store = registerContextService({
//   app,
//   identifier: 'store',
//   firebase: { ... }
//   firestorePersistenceEnabled: true,
//   fastbootShoeboxEnabled: true,
//   exportServiceInDevelopment: true,
//   injectService: true,
//   injectServiceAs: 'store',
//   injectServiceInto: [ 'route', 'controller', 'component' ],
//   modelNameForDocument(document, store) {
//     let { collection } = document.getProperties('collection');
//     if(collection === 'people') {
//       return 'person';
//     }
//   },
//   storeNameForIdentifier(absoluteIdentifier, identifier) {
//     if(absoluteIdentifier === 'store') {
//       return 'store';
//     }
//   }
// });
export default (...args) => {
  let props = toProps(args);

  let {
    app,
    identifier,
    firebase,
    firestorePersistenceEnabled,
    fastbootShoeboxEnabled,
    exportServiceInDevelopment,
    modelNameForDocument,
    storeNameForIdentifier,
    injectService,
    injectServiceAs,
    injectServiceInto
  } = assign({ identifier: 'store', fastbootShoeboxEnabled: true, injectService: true, exportServiceInDevelopment: true }, props);


  // create context

  let stores = app.lookup('models:stores');

  let store = stores.createContext(identifier, {
    firebase,
    firestorePersistenceEnabled,
    fastbootShoeboxEnabled,
    modelNameForDocument,
    storeNameForIdentifier
  });


  // register service

  let factoryName = `service:${identifier}`;

  app.register(factoryName, store, { instantiate: false });


  // inject service

  if(injectService) {
    injectServiceAs = injectServiceAs || identifier;
    injectServiceInto = injectServiceInto || [ 'route', 'controller', 'component' ];
    injectServiceInto.forEach(target => app.inject(target, injectServiceAs, factoryName));
  }


  // export global

  let env = app.factoryFor('config:environment').class;
  let isDevelopment = env.environment === 'development';

  /* global window */
  if(exportServiceInDevelopment && isDevelopment && typeof window !== 'undefined') {
    window[identifier] = store;
    app.reopen({
      willDestroy() {
        this._super(...arguments);
        delete window[identifier];
      }
    });
  }

  return store;
}
