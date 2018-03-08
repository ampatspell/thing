import { Promise as RSVPPromise } from 'rsvp';
import registerContextService from 'models/register-context-service';

const firebase = {
  apiKey: "AIzaSyDyjC_rsH7_BYJwjKgIrHhoSvRBfNnjGrQ",
  databaseURL: "https://ohne-zeit.firebaseio.com",
  storageBucket: "ohne-zeit.appspot.com",
  authDomain: "ohne-zeit.firebaseapp.com",
  messagingSenderId: "491555737764",
  projectId: "ohne-zeit"
};

const modelNameForDocument = (document, context) => {
  let { collection } = document.getProperties('collection');

  if(context.get('absoluteIdentifier').startsWith('store/crud')) {
    if(collection === 'people') {
      return 'crud/person';
    }
    if(collection === 'blogs') {
      return 'crud/blog';
    }
  }

  if(collection === 'people') {
    return 'person';
  }
  if(collection === 'blogs') {
    return 'blog';
  }

  return 'unknown';
};

const storeNameForIdentifier = absoluteIdentifier => {
  if(absoluteIdentifier === 'store') {
    return 'store';
  }
};

export default {
  name: 'thing:store',
  initialize(app) {
    window.Promise = RSVPPromise;

    app.inject('component', 'router', 'service:router');

    registerContextService(app, {
      firebase,
      modelNameForDocument,
      storeNameForIdentifier
    });
  }
};
