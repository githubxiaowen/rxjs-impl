import { Subscriber } from './Subscriber'
import { fstat } from 'fs';

export class Observable {
  constructor(subscribeLogic) {
    if(subscribeLogic) {
      this._subscribe = subscribeLogic
    }
    this.upstream = null
    this.operator = null
  }
  subscribe(subscriber) {
    const subscriber = new Subscriber(subscriber)
    let subscription
    if(this.operator) {
      subscription = this.operator.call(subscriber, this.upstream)
    } else {
      subscription = this._subscribe(subscriber)
    }
    subscriber.add(subscription)
    return subscriber
  }
  pipe(...fns) {
    if(fns.length === 0) return this
    return fns.reduce((upstream, fn) => fn(upstream), this)
  }
  lift(op) {
    const newOb$ = new Observable()
    newOb$.upstream = this
    newOb$.operator = op
    return newOb$
  }
}

