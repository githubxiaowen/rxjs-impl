import { Subscriber } from './Subscriber'

export class Observable {
  constructor(subscribeLogic) {
    if(subscribeLogic) {
      this._subscribe = subscribeLogic
    }
  }
  subscribe(destination) {
    const subscriber = new Subscriber(destination)
    const subscription = this._subscribe(subscriber)
    subscriber.add(subscription)
    return subscriber
  }
}

