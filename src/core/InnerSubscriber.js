
import { Subscriber } from '@acha/core'

export class InnerSubscriber extends Subscriber {
  constructor(parent, outerValue, outerIndex) {
    // InnerSubscriber是没有destination的，它只是一个中间订阅者，实际接触observer的是OuterSubscriber
    super()
    // 这里的parent就是outerSubscriber
    this.parent = parent
    this.outerValue = outerValue
    this.outerIndex = outerIndex
    this.innerIndex = 0
  }
  _next(value) {
    this.parent.gotNextMessageFromInner(this.outerValue, value, this.outerIndex, this.innerIndex++, this)
  }
  _error(reason) {
    this.parent.gotErrorMessageFromInner(reason, this)
    this.unsubscribe();
  }
  _complete() {
    this.parent.gotCompleteMessageFromInner(this)
    this.unsubscribe()
  }
}

