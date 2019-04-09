import { Subscriber } from '@bjs/core'

export class OuterSubscriber extends Subscriber {
  constructor(destination) {
    super(destination)
  }
  // 携带足够的信息
  gotNextMessageFromInner(outerVal, innerVal, outerIndex, innerIndex, innerSub) {
      this.destination.next(innerVal)
  }
  gotErrorMessageFromInner(error, innerSub) {
      this.destination.error(error)
  }
  gotCompleteMessageFromInner(innerSub) {
      this.destination.complete()
  }
}
