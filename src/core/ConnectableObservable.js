import { Subscriber, Observable, Subscription } from '@acha/core'
export class ConnectableObservable extends Observable {
  constructor(source, subjectFactory) {
    this.source = source
    this.subjectFactory = subjectFactory

    this._subject = null
    this._refCount = 0
    this._connection = null
    this._isCompleted = false
  }
  _subscribe(subscriber) {
    return this._getSubject().subscribe(subscriber)
  }

  _getSubject() {
    const subject = this._subject
    if (!subject || subject.stoppedAcceptData) {
      this._subject = this.subjectFactory()
    }
    return this._subject
  }
  connect() {
    let connection = this._connection;
    if (!connection) {
      this._isCompleted = false;
      connection = this._connection = new Subscription();
      connection.add(this.source
        .subscribe(new ConnectableSubscriber(this._getSubject(), this)));
      if (connection.closed) {
        this._connection = null;
        connection = Subscription.EMPTY;
      }
    }
    return connection
  }
  refCount() { /* TODO */ }
}

class ConnectableSubscriber extends Subscriber {
  constructor(subject, connectable) {
    super(subject)
    this.connectable = connectable
  }
  _error(error) {
    this._unsubscribe();
    super._error(err);
  }
  _complete() {
    this.connectable._isCompleted = true;
    this._unsubscribe();
    super._complete();
  }
  _unsubscribe() {
    const connectable = this.connectable;
    if (connectable) {
      this.connectable = null;
      const connection = connectable._connection;
      connectable._refCount = 0;
      connectable._subject = null;
      connectable._connection = null;
      if (connection) {
        connection.unsubscribe();
      }
    }
  }
}
