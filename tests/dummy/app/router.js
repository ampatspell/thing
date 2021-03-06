import EmberRouter from '@ember/routing/router';
import config from './config/environment';

const Router = EmberRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  this.route('people', function() {
    this.route('person', { path: '/:person_id' }, function() {
      this.route('edit');
    });
  });
  this.route('crud');
  this.route('model', { path: '/model/*path' });
  this.route('query');
  this.route('queries');
  this.route('match');
  this.route('auth');
  this.route('storage');
  this.route('things');
  this.route('experimental');
});

export default Router;
