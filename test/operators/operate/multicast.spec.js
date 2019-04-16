import { Subject } from '@bjs/core'
import { multicast, interval, take } from '@bjs/operators'
jest.setTimeout(30000);
it('operator [multicast] should pass basic test', (done) => {
  const TAKETIMES = 2
  let prevVal = 1
  let mockNext1 = jest.fn(x => x)
  let mockNext2 = jest.fn(x => x)
  // 0 1 2 3
  const cold$ = interval(1000).pipe(
    take(4)
  )
  const connectable = cold$.pipe(
    multicast(new Subject())
  )
  const ob1 = {
    next(val) {
      mockNext1(val)
    },
    error: () => {},
    complete: () => {
      expect(mockNext1.mock.results[0].value).toBe(0)
      expect(mockNext1.mock.results[1].value).toBe(1)
      expect(mockNext1.mock.results[2].value).toBe(2)
      expect(mockNext1.mock.results[3].value).toBe(3)
    }
  }
  const ob2 = {
    next(val) {
      mockNext2(val)
    },
    error: () => {},
    complete: () => {
      // 1.5S后才开始订阅
      expect(mockNext2.mock.results[0].value).toBe(1)
      expect(mockNext2.mock.results[1].value).toBe(2)
    }
  }
  connectable.subscribe(ob1)
  expect(mockNext1).not.toBeCalled()
  setTimeout(() => {
    connectable.subscribe(ob2)
  }, 1500)
  connectable.connect()
  setTimeout(() => {
    expect(mockNext1).toHaveBeenCalled()
    expect(mockNext2).toHaveBeenCalled()
  }, 2600)
  setTimeout(() => {
    done()
  }, 5000)
})
