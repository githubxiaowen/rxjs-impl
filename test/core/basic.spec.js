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
    const timer = setTimeout(() => {
      subscriber.next(1)
    }, 1000)

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
    complete() {
      console.log('complete!')
    }
  }

  const ob$ = new Observable(subscriber => {
    const timer = setTimeout(() => {
      subscriber.next(i)
    }, 3000)
    const unsubscribe = () => {
      clearTimeout(timer)
    }
    return new Subscription(unsubscribe)
  })
  const sub = ob$.subscribe(subscriber)
  setTimeout(() => {
    sub.unsubscribe()
  }, 1000)
  setTimeout(() => {
    expect(mockNext).not.toBeCalled()
    done()
  }, 4000)
})

