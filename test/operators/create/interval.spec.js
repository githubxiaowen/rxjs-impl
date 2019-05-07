import {
  interval,
  take
} from '@acha/operators'


it('operator [interval] should pass basic test', (done) => {
  const TAKETIMES = 2
  let prevVal = 0
  let mockNext = jest.fn(x => x)
  interval(1000).pipe(
    take(TAKETIMES),
    ).subscribe({
    next: val => {
      mockNext(val)
      expect(val).toBe(prevVal)
      prevVal++
    },
    error(error) {
    },
    complete: () => {
      expect(mockNext.mock.results[0].value).toBe(0)
      expect(mockNext.mock.results[1].value).toBe(1)
      expect(mockNext.mock.calls.length).toBe(TAKETIMES)
      done()
    }
  })
})
