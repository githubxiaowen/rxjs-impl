import {
  Observable,
  Subscription
} from '@acha/core'
it('should pass basic test', done => {
  const subscriber = {
    next(value) {
      expect(value).toEqual(1)
    },
    error(reason) {
      console.error(reason)
    },
    complete: done
  }

  const ob$ = new Observable(subscriber => {
    const timer = setTimeout(() => {
      subscriber.next(1)
      subscriber.complete()
    }, 10)

    const unsubscribe = () => {
      clearTimeout(timer)
    }

    return new Subscription(unsubscribe)
  })
  ob$.subscribe(subscriber)
})

it('should never be called when unsubscribed', (done) => {
  const mockNext = jest.fn(console.log);
  const subscriber = {
    next: mockNext,
    error(reason) {
      console.error(reason)
    },
    complete: () => {}
  }
  const ob$ = new Observable(subscriber => {
    const timer = setTimeout(() => {
      subscriber.next(1)
    }, 30)
    const unsubscribe = () => {
      clearTimeout(timer)
    }
    return new Subscription(unsubscribe)
  })
  const sub = ob$.subscribe(subscriber)
  setTimeout(() => {
    sub.unsubscribe()
  }, 10)
  setTimeout(() => {
    expect(mockNext).not.toBeCalled()
    done()
  }, 40)
})

