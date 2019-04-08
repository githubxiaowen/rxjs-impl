(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.bjs = {}));
}(this, function (exports) { 'use strict';

  class Subscription {
    constructor(teardownLogic) {
      if (teardownLogic) {
        this._unsubscribe = teardownLogic;
      }
      this.hasUnsubscribed = false;
      this._subscriptions = null;
      this._parent = null;
    }
    unsubscribe() {
      if (this.hasUnsubscribed) return
      const {
        _parent,
        _subscriptions,
        _unsubscribe
      } = this;

      this.hasUnsubscribed = true;
      this._parent = null;

      _parent && (_parent.remove(this));
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
    add(childSubscription) {
      // 暂时只考虑teardownLogic的场景
      if (!childSubscription) return Subscription.EMPTY
      const subscriptions = this._subscriptions || (this._subscriptions = []);
      subscriptions.push(childSubscription);
      childSubscription._addParent(this);
      return childSubscription
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
    _addParent(subscription) {
      let {
        _parent
      } = this;
      if (!_parent) {
        this._parent = subscription;
      } else {
        throw Error('cannot add parent more than once')
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
    }
    subscribe(destination) {
      const subscriber = new Subscriber(destination);
      const subscription = this._subscribe(subscriber);
      subscriber.add(subscription);
      return subscriber
    }
  }

  // export * from './operators'

  exports.Observable = Observable;
  exports.Subscriber = Subscriber;
  exports.Subscription = Subscription;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
