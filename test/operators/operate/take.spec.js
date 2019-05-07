import { of, take } from '@acha/operators'
it('operator [take] should pass basic test', () => {
  const TAKETIMES = 2
  let prevVal = 1
  let mockNext = jest.fn(x => x)
  of(1,2,3,4,5).pipe(
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
      expect(mockNext.mock.results[0].value).toBe(1)
      expect(mockNext.mock.results[1].value).toBe(2)
      expect(mockNext.mock.calls.length).toBe(TAKETIMES)
    }
  })
})
