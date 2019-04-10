export class Subscription {
  constructor(teardownLogic) {
    if (teardownLogic) {
      this._unsubscribe = teardownLogic
    }
    this.hasUnsubscribed = false
    this._subscriptions = null
    this._parents = null
  }
  unsubscribe() {
    if (this.hasUnsubscribed) return
    const {
      _parent,
      _subscriptions,
      _unsubscribe
    } = this

    this.hasUnsubscribed = true
    this._parent = null

    _parent && (_parent.remove(this))
    if (_unsubscribe) {
      // 暂时不考虑error
      _unsubscribe.call(this)
    }
    if (Array.isArray(_subscriptions)) {
      let index = -1
      let len = _subscriptions.length
      while (++index < len) {
        const sub = _subscriptions[index]
        sub && (sub.unsubscribe.call(sub))
      }
    }
  }
  add(teardownLogic) {
    if(!teardownLogic) return Subscription.EMPTY
    let subscription = teardownLogic
    switch (typeof teardownLogic) {
      case 'function':
        subscription = new Subscription(teardownLogic)
      case 'object':
        if (subscription === this || subscription.hasUnsubscribed || typeof subscription.unsubscribe !== 'function') {
          return subscription;
        } else if (this.hasUnsubscribed) {
          subscription.unsubscribe()
          return subscription
        } else if (!(subscription instanceof Subscription)) {
          // TODO:
          // UNKOWN REASON
          const tmp = subscription
          subscription = new Subscription()
          subscription._subscriptions = [tmp]
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
    const subscriptions = this._subscriptions
    if (subscriptions) {
      const subscriptionIndex = subscriptions.indexOf(childSubscription)
      if (subscriptionIndex !== -1) {
        subscriptions.splice(subscriptionIndex, 1)
      }
    }
  }
  _addParent(subscription) {
    let {
      _parent
    } = this
    if (!_parent) {
      this._parent = subscription
    } else {
      throw Error('cannot add parent more than once')
    }
  }
}
Subscription.EMPTY = ((empty => {
  empty.hasUnsubscribed = true;
  return empty
}))(new Subscription())
