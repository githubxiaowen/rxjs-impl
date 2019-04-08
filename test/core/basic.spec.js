import {
  Observable,
  Subscription
} from '@bjs/core'

it('should pass basic test', done => {
  const subscriber = {
    next(value) {
      expect(value).toEqual(1)
      done()
    },
    error(reason) {
      console.error(reason)
    },
    complete() {
      console.log('complete!')
    }
  }

  const ob$ = new Observable(subscriber => {
    let i = 1
    const timer = setTimeout(() => {
      subscriber.next(i)
    }, 1000)

    const unsubscribe = () => {
      clearTimeout(timer)
    }

    return new Subscription(unsubscribe)
  })
  ob$.subscribe(subscriber)
})

