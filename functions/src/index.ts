import * as functions from 'firebase-functions';
import * as express from 'express';
import * as fastbootMiddleware from 'fastboot-express-middleware';
import * as path from 'path';

const dist = path.resolve(__dirname, '../dist');

const app = express();

app.use(express.static(dist, { index: false }));
app.get('/*', fastbootMiddleware(dist));

exports.fastboot = functions.https.onRequest((req, res) => {
  if(!req.path) {
    req.url = `/${req.url}`;
  }
  return app(req, res);
});
