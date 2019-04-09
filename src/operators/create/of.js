import {
  Observable
} from '@bjs/core'

export function of (...input) {
  return new Observable(subscriber => {
    for (let i = 0, len = input.length; i < len; i++) {
      subscriber.next(input[i])
    }
    if (!subscriber.hasUnsubscribed) {
      subscriber.complete()
    }
  })
}
