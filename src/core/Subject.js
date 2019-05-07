import { Observable, Subscription } from '@acha/core'

export class Subject extends Observable {
  constructor() {
    super()
    this.stoppedAcceptData = false
    this.hasUnsubscribed = false
    this.observers = []
    this.hasError = false
    this.thrownError = null
  }
  next(value) {
    if (this.hasUnsubscribed) throw Error('subject has unsubscribed')
    if (!this.stoppedAcceptData) {
      const { observers } = this
      const copy = observers.slice()
      for (let i = 0; i < copy.length; i++) {
        copy[i].next(value)
      }
    }
  }
  error(error) {
    if (this.hasUnsubscribed) throw Error('subject has unsubscribed')
    if (!this.stoppedAcceptData) {
      this.hasError = true
      this.thrownError = error
      this.stoppedAcceptData = true

      const { observers } = this
      const copy = observers.slice()
      for (let i = 0; i < copy.length; i++) {
        copy[i].error(value)
      }

      this.observers.length = 0
    }
  }
  complete() {
    if (this.hasUnsubscribed) throw Error('subject has unsubscribed')
    this.stoppedAcceptData = true;
    const { observers } = this;
    const len = observers.length;
    const copy = observers.slice();
    for (let i = 0; i < len; i++) {
      copy[i].complete();
    }
    this.observers.length = 0;
  }
  _subscribe(subscriber) {
    if (this.hasUnsubscribed) {
      throw Error('subject has unsubscribed')
    } else if (this.hasError) {
      subscriber.error(this.thrownError);
      return Subscription.EMPTY;
    } else if (this.stoppedAcceptData) {
      subscriber.complete();
      return Subscription.EMPTY;
    } else {
      this.observers.push(subscriber);
      return new SubjectSubscription(this, subscriber);
    }
  }
  unsubscribe() {
    this.stoppedAcceptData = true;
    this.hasUnsubscribed = true;
    this.observers = null;
  }
}

class SubjectSubscription extends Subscription {
  constructor(subject, subscriber) {
    super()
    this.subject = subject
    this.subscriber = subscriber
    this.hasUnsubscribed = false
  }
  unsubscribe() {
    if (this.hasUnsubscribed) return

    this.hasUnsubscribed = true;

    const subject = this.subject;
    const observers = subject.observers;

    this.subject = null;

    if (!observers || observers.length === 0 || subject.isStopped || subject.stoppedAcceptData) {
      return;
    }

    const subscriberIndex = observers.indexOf(this.subscriber);

    if (subscriberIndex !== -1) {
      observers.splice(subscriberIndex, 1);
    }
  }
}
