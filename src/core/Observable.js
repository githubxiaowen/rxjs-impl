import { Subscriber } from './Subscriber'

export class Observable {
  constructor(subscribeLogic) {
    if(subscribeLogic) {
      this._subscribe = subscribeLogic
    }
  }
  subscribe(subscriber) {
    const subscriber = new Subscriber(subscriber)
    const subscription = this._subscribe(subscriber)
    subscriber.add(subscription)
    return subscriber
  }
}

