import SnapshotObserver from './snapshot-observer';

export default class BasicDocumentObserver extends SnapshotObserver {

  constructor(context, ref, delegate) {
    super(context, ref, delegate, { includeMetadataChanges: true });
  }

  _onSnapshot(snapshot) {
    return this._delegate.onSnapshot(snapshot);
  }

}
