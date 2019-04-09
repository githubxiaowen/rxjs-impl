import { Subscriber } from '@bjs/core'
export function take(count) {
  return source => source.lift(new TakeOperator(count))
}

class TakeOperator {
  constructor(count) {
    this.count = count
  }
  call(subscriber, upstream) {
    return upstream.subscribe(new TakeSubscriber(subscriber, this.count))
  }
}

class TakeSubscriber extends Subscriber {
  constructor(destination, count) {
    super(destination)
    this.count = count
    this.index = 0
  }
  _next(val) {
    const count = this.count
    const index = ++this.index
    if(index <= count) {
      this.destination.next(val)
      if(index === count) {
        this.destination.complete()
        this.unsubscribe()
      }
    }
  }
}
