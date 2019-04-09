import {
  Subscriber,
  Observable,
  OuterSubscriber,
  InnerSubscriber
} from '@bjs/core'

export function forkJoin(...obs) {
  return new Observable(subscriber => {
    return new ForkJoinSubscriber(subscriber, obs)
  })
}

class ForkJoinSubscriber extends OuterSubscriber {
  constructor(destination, sourceObservables) {
    super(destination)
    this.completedObsCount = 0
    this.valuesGot = 0

    const len = sourceObservables.length
    this.values = new Array(len)
    for (let outerIndex = 0; outerIndex < len; outerIndex++) {
      const outerOb$ = sourceObservables[outerIndex]
      // 实例化一个InnerSubscriber
      const innerSubscriber = new InnerSubscriber(this, outerOb$, outerIndex)
      if (!innerSubscriber.hasUnsubscribed) {
        // 订阅outerOb$
        const innerSubscription = outerOb$.subscribe(innerSubscriber)
        this.add(innerSubscription)
      }
    }
  }
  gotNextMessageFromInner(outerVal, innerVal, outerIndex, innerIndex, innerSubscriber) {
    this.values[outerIndex] = innerVal
    if (!innerSubscriber._hasValue) {
      // 第一次emit值
      innerSubscriber._hasValue = true
      this.valuesGot++
    }
  }
  gotErrorMessageFromInner(reason, innerSubscriber) { }
  gotCompleteMessageFromInner(innerSubscriber) {
    this.completedObsCount++
    const targetCount = this.values.length
    if (this.completedObsCount !== targetCount) return
    if (this.valuesGot === targetCount) {
      this.destination.next(this.values)
    }
    this.destination.complete()
  }
}

