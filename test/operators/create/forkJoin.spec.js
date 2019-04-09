import {
  forkJoin,
  of,
  interval,
  take,
  map
} from '@bjs/operators'
it('operator [forkJoin] should pass basic test', (done) => {
  let mockNext = jest.fn(x => x)
  forkJoin(
    of(1,2,3,4),
    of(5,6,7,8)
  ).subscribe({
    next(val) {
      mockNext(val)
      expect(val).toEqual([4,8])
    },
    error() {

    },
    complete() {
      expect(mockNext).toHaveBeenCalledTimes(1)
      done()
    }
  })
})

it('operator [forkJoin] should pass basic test', (done) => {
  let mockNext = jest.fn(x => x)
  forkJoin(
    interval(1000).pipe(take(1)),
    interval(500).pipe(take(4))
  ).subscribe({
    next(val) {
      mockNext(val)
      expect(val).toEqual([0,3])
    },
    error() {
    },
    complete() {
      expect(mockNext).toHaveBeenCalledTimes(1)
      done()
    }
  })
})

it('operator [forkJoin] should pass basic test', (done) => {
  let mockNext = jest.fn(x => x)
  forkJoin(
    interval(20).pipe(take(1)),
    interval(10).pipe(take(3))
  ).pipe(
    map(([n,m]) => n + m)
  ).subscribe({
    next(val) {
      mockNext(val)
      expect(val).toBe(2)
    },
    error() {
    },
    complete() {
      expect(mockNext).toHaveBeenCalledTimes(1)
      done()
    }
  })
})
