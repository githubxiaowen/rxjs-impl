import { async, Observable } from '@bjs/core'

function work(state) {
  const { subscriber, counter, intervalTime } = state
  subscriber.next(counter)
  this.schedule({
    subscriber,
    counter: counter + 1,
    intervalTime
  }, intervalTime)
}

export function interval(intervalTime, scheduler = async) {
  return new Observable(subscriber => {
    const initialState = {
      subscriber,
      counter: 0,
      intervalTime
    }
    subscriber.add(scheduler.schedule(work, intervalTime, initialState))
    return subscriber
  })
}
