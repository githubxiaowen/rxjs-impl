import {
  Observable,
  Subscription
} from '@acha/core'
import { of } from '@acha/operators'

it('should pass basic test', done => {
  let prevVal = 1
  of(1,2,3).subscribe({
    next(val) {
      expect(val).toBe(prevVal)
      prevVal++
    },
    error(error) {

    },
    complete: done
  })
})
