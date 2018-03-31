import Method from './internal-method';
import { resolve } from 'rsvp';

export default class InternalAnonymous extends Method {

  get type() {
    return 'anonymous';
  }

  onSignedIn() {
    let user = this.auth.user;
    return user && user.model(true);
  }

  signIn() {
    let auth = this.auth.auth;
    return resolve(auth.signInAnonymouslyAndRetrieveData()).then(res => this.onSignedIn(res));
  }

}
