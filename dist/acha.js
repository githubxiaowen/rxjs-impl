(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('fs')) :
  typeof define === 'function' && define.amd ? define(['exports', 'fs'], factory) :
  (global = global || self, factory(global.acha = {}, global.fs));
}(this, function (exports, fs) { 'use strict';

  class Subscription {
    constructor(teardownLogic) {
      if (teardownLogic) {
        this._unsubscribe = teardownLogic;
      }
      this.hasUnsubscribed = false;
      this._subscriptions = null;
      this._parents = null;
    }
    unsubscribe() {
      if (this.hasUnsubscribed) return
      const {
        _parents,
        _subscriptions,
        _unsubscribe
      } = this;

      this.hasUnsubscribed = true;
      this._parents = null;

      if(_parents) {
        _parents.forEach(parent => {
          parent.remove(this);
        });
      }
      if (_unsubscribe) {
        // 暂时不考虑error
        _unsubscribe.call(this);
      }
      if (Array.isArray(_subscriptions)) {
        let index = -1;
        let len = _subscriptions.length;
        while (++index < len) {
          const sub = _subscriptions[index];
          sub && (sub.unsubscribe.call(sub));
        }
      }
    }
    add(teardownLogic) {
      if(!teardownLogic) return Subscription.EMPTY
      let subscription = teardownLogic;
      switch (typeof teardownLogic) {
        case 'function':
          subscription = new Subscription(teardownLogic);
        case 'object':
          if (subscription === this || subscription.hasUnsubscribed || typeof subscription.unsubscribe !== 'function') {
            return subscription;
          } else if (this.hasUnsubscribed) {
            subscription.unsubscribe();
            return subscription
          } else if (!(subscription instanceof Subscription)) {
            // TODO:
            // UNKOWN REASON
            const tmp = subscription;
            subscription = new Subscription();
            subscription._subscriptions = [tmp];
          }
          break;
        default: {
          throw new Error('unrecognized teardown ' + teardown + ' added to Subscription.')
        }
      }

      let { _parents } = subscription;
      if (_parents && _parents.indexOf(this) > -1)  return subscription;
      if (_parents === null) {
        subscription._parents = [this];
      } else {
        _parents.push(this);
      }

      // Optimize for the common case when adding the first subscription.
      const subscriptions = this._subscriptions;
      if (subscriptions === null) {
        this._subscriptions = [subscription];
      } else {
        subscriptions.push(subscription);
      }

      return subscription;
    }
    handleRelations(subscription) {
      let { _parents } = subscription;
      if(_parents && _parents.indexOf(subscription) > -1) return subscription
      if (_parents === null) {
        // If we don't have a parent, then set `subscription._parents` to
        // the `this`, which is the common case that we optimize for.
        subscription._parents = [this];
      } else {
        // 新增
        _parents.push(this);
      }
      // Optimize for the common case when adding the first subscription.
      const subscriptions = this._subscriptions;
      if (subscriptions === null) {
        this._subscriptions = [subscription];
      } else {
        subscriptions.push(subscription);
      }

      return subscription;
    }
    remove(childSubscription) {
      const subscriptions = this._subscriptions;
      if (subscriptions) {
        const subscriptionIndex = subscriptions.indexOf(childSubscription);
        if (subscriptionIndex !== -1) {
          subscriptions.splice(subscriptionIndex, 1);
        }
      }
    }
  }
  Subscription.EMPTY = ((empty => {
    empty.hasUnsubscribed = true;
    return empty
  }))(new Subscription());

  class Subscriber extends Subscription {
    constructor(destination) {
      super();
      this.destination = destination;
      // 关闭阀门，不接收任何数据
      this.stoppedAcceptData = false;
    }
    next(value) {
      if(!this.stoppedAcceptData) {
        this._next(value);
      }
    }
      _next(value) {
        this.destination.next(value);
      }
      error(reason) {
        if(!this.stoppedAcceptData) {
          this._error(reason);
        }
      }
      _error(reason) {
        this.destination.error(reason);
      }
      complete() {
        if(!this.stoppedAcceptData) {
          this._complete();
        }
      }
      _complete() {
        this.destination.complete();
      }
      unsubscribe() {
        if(this.hasUnsubscribed) return
        this.stoppedAcceptData = true;
        super.unsubscribe();
      }
  }

  class Observable {
    constructor(subscribeLogic) {
      if(subscribeLogic) {
        this._subscribe = subscribeLogic;
      }
      this.upstream = null;
      this.operator = null;
    }
    subscribe(observer) {
      let subscriber;
      if(observer instanceof Subscriber) {
        subscriber = observer;
      } else {
        subscriber = new Subscriber(observer);
      }
      let subscription;
      if(this.operator) {
        subscription = this.operator.call(subscriber, this.upstream);
      } else {
        subscription = this._subscribe(subscriber);
      }
      subscriber.add(subscription);
      return subscriber
    }
    pipe(...fns) {
      if(fns.length === 0) return this
      return fns.reduce((upstream, fn) => fn(upstream), this)
    }
    lift(op) {
      const newOb$ = new Observable();
      newOb$.upstream = this;
      newOb$.operator = op;
      return newOb$
    }
  }

  class AsyncScheduler {
    constructor(AsyncAction) {
      this.AsyncAction = AsyncAction;
      this.actionQueue = [];
      this.isExecutingWork = false;
    }
    flushQueue(action) {
      if (this.isExecutingWork) {
        this.actionQueue.push(action);
        return
      }
      this.isExecutingWork = true;
      do {
        action.execute(action.state);
      } while (action = this.actionQueue.shift())
      this.isExecutingWork = false;
    }
    schedule(work, delay, state) {
      const asyncAction = new this.AsyncAction(this, work);
      return asyncAction.schedule(state, delay)
    }
  }
  class AsyncAction extends Subscription {
    constructor(scheduler, work) {
      super();
      this.scheduler = scheduler;
      this.work = work;

      this.delay = undefined;
      this.state = undefined;
      this.timerId = undefined;
      this.pending = false;
    }
    schedule(state, delay) {
      /* 在delay后执行this.work， 传入的值为this.state */
      if (this.hasUnsubscribed) return
      this.state = state;

      const timerId = this.timerId;
      if (timerId != null) {
        // 如果timerId已有，即之前已经schedule过一次任务了，则首先判断是否需要执行cancenAsyncTask
        this.timerId = this.cancelAsyncTask(timerId, delay);
      }
      this.pending = true;
      this.delay = delay;
      // 如果是等时间间隔的相同任务，那么timerId不变，否则重新执行setupAsyncTask
      this.timerId = this.timerId || this.setupAsyncTask(this.scheduler, delay);
      return this
    }
    setupAsyncTask(scheduler, delay = 0) {
      /* 在delay时间后，执行scheduler的flushQueue操作 */
      return setInterval(scheduler.flushQueue.bind(scheduler, this), delay)
    }
    cancelAsyncTask(id, delay) {
      /* 同delay的相同任务，不用执行clearInterval */
      if (delay !== null && this.delay === delay && this.pending === false) return id
      clearInterval(id);
    }
    execute(state) {
      this.pending = false;
      /* 执行work */
      this.work(state);
    }
    _unsubscribe() {
      /* 取消任务 */
      const timerId = this.timerId;
      const scheduler = this.scheduler;
      const index = scheduler.actionQueue.indexOf(this);

      this.pending = false;
      this.task = null;
      this.scheduler = null;
      this.state = undefined;
      if (index !== -1) {
        scheduler.actionQueue.splice(index, 1);
      }
      if (timerId != null) {
        // 传入delay为null,强制clearInterval
        this.cancelAsyncTask(timerId, null);
      }
      this.delay = null;
    }
  }
  const async = new AsyncScheduler(AsyncAction);

  class InnerSubscriber extends Subscriber {
    constructor(parent, outerValue, outerIndex) {
      // InnerSubscriber是没有destination的，它只是一个中间订阅者，实际接触observer的是OuterSubscriber
      super();
      // 这里的parent就是outerSubscriber
      this.parent = parent;
      this.outerValue = outerValue;
      this.outerIndex = outerIndex;
      this.innerIndex = 0;
    }
    _next(value) {
      this.parent.gotNextMessageFromInner(this.outerValue, value, this.outerIndex, this.innerIndex++, this);
    }
    _error(reason) {
      this.parent.gotErrorMessageFromInner(reason, this);
      this.unsubscribe();
    }
    _complete() {
      this.parent.gotCompleteMessageFromInner(this);
      this.unsubscribe();
    }
  }

  class OuterSubscriber extends Subscriber {
    constructor(destination) {
      super(destination);
    }
    // 携带足够的信息
    gotNextMessageFromInner(outerVal, innerVal, outerIndex, innerIndex, innerSub) {
        this.destination.next(innerVal);
    }
    gotErrorMessageFromInner(error, innerSub) {
        this.destination.error(error);
    }
    gotCompleteMessageFromInner(innerSub) {
        this.destination.complete();
    }
  }

  class Subject extends Observable {
    constructor() {
      super();
      this.stoppedAcceptData = false;
      this.hasUnsubscribed = false;
      this.observers = [];
      this.hasError = false;
      this.thrownError = null;
    }
    next(value) {
      if (this.hasUnsubscribed) throw Error('subject has unsubscribed')
      if (!this.stoppedAcceptData) {
        const { observers } = this;
        const copy = observers.slice();
        for (let i = 0; i < copy.length; i++) {
          copy[i].next(value);
        }
      }
    }
    error(error) {
      if (this.hasUnsubscribed) throw Error('subject has unsubscribed')
      if (!this.stoppedAcceptData) {
        this.hasError = true;
        this.thrownError = error;
        this.stoppedAcceptData = true;

        const { observers } = this;
        const copy = observers.slice();
        for (let i = 0; i < copy.length; i++) {
          copy[i].error(value);
        }

        this.observers.length = 0;
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
      super();
      this.subject = subject;
      this.subscriber = subscriber;
      this.hasUnsubscribed = false;
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

  class ConnectableObservable extends Observable {
    constructor(source, subjectFactory) {
      this.source = source;
      this.subjectFactory = subjectFactory;

      this._subject = null;
      this._refCount = 0;
      this._connection = null;
      this._isCompleted = false;
    }
    _subscribe(subscriber) {
      return this._getSubject().subscribe(subscriber)
    }

    _getSubject() {
      const subject = this._subject;
      if (!subject || subject.stoppedAcceptData) {
        this._subject = this.subjectFactory();
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
      super(subject);
      this.connectable = connectable;
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

  // export * from './operators'

  exports.AsyncScheduler = AsyncScheduler;
  exports.ConnectableObservable = ConnectableObservable;
  exports.InnerSubscriber = InnerSubscriber;
  exports.Observable = Observable;
  exports.OuterSubscriber = OuterSubscriber;
  exports.Subject = Subject;
  exports.Subscriber = Subscriber;
  exports.Subscription = Subscription;
  exports.async = async;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
