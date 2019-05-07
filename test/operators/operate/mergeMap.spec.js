import {
  forkJoin,
  of,
  interval,
  take,
  map,
  mergeMap
} from '@acha/operators'

// https://rxjs.dev/api/operators/mergeMap
it('operator [mergeMap] should pass basic test', (done) => {
  let mockNext = jest.fn(x => x)
  let letters = ['a','b','c']
  of(...letters).pipe(
    mergeMap(letter => interval(100).pipe(
      take(2),
      map(i => letter + i)
    ))
  ).subscribe({
    next(val) {
      mockNext(val)
    },
    error() {},
    complete() {
      expect(mockNext.mock.results[0].value).toBe('a0')
      expect(mockNext.mock.results[1].value).toBe('b0')
      expect(mockNext.mock.results[2].value).toBe('c0')
      expect(mockNext.mock.results[3].value).toBe('a1')
      expect(mockNext.mock.results[4].value).toBe('b1')
      expect(mockNext.mock.results[5].value).toBe('c1')
      expect(mockNext).toHaveBeenCalledTimes(6)
      done()
    }
  })
})
