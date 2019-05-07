import {
  Observable,
  Subscription
} from '@acha/core'
import { of, map } from '@acha/operators'

it('should pass basic test', done => {
  let prevVal = 2
  of(1,2,3).pipe(
    map(i => i * 2)
    ).subscribe({
    next(val) {
      expect(val).toBe(prevVal)
      prevVal+=2
    },
    error(error) {

    },
    complete: done
  })
})
