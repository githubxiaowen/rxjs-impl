import { Subject } from '@bjs/core'
import { interval,take } from "@bjs/operators"

it('[subject] should pass basic test', done => {
  const sub = new Subject()
  const tick$ = interval(1000).pipe(take(3))
  const subject = new Subject()
  let mockNext = jest.fn(x => x)
  const observer1 = {
    next(val) {

    },
    error() {},
    complete() {}
  }
  const observer2 = {
    next(val) {
      mockNext()
    },
    error() {},
    complete() {
      expect(mockNext.mock.calls.length).toBe(2)
    }
  }
  tick$.subscribe(subject)

  subject.subscribe(observer1)
  setTimeout(() => {
    subject.subscribe(observer2)
  }, 1000)
  setTimeout(() => {
    done()
  }, 4000)
})
