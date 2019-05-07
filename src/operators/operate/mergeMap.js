import {
  OuterSubscriber,
  InnerSubscriber
} from '@acha/core'

export function mergeMap(project, concurrent = Number.POSITIVE_INFINITY) {
  return source$ => source$.lift(new MergeMapOperator(project, concurrent))
}

class MergeMapOperator  {
  constructor(project, concurrent) {
    this.project = project
    this.concurrent = concurrent
  }
  call(subscriber, source$) {
    return source$.subscribe(new MergeMapSubscriber(subscriber, this.project, this.concurrent))
  }
}

class MergeMapSubscriber extends OuterSubscriber {
  constructor(destination, project, concurrent) {
    super(destination)
    this.project = project
    this.concurrent = concurrent  // 并行merge的最大ob$数

    this.buffer = [] // 缓存的outerValue
    this.active = 0 // 当前正在生产的ob$
    this.index = 0  // 外层值的索引
    this.hasCompleted = false // 最外层是否已经结束了

  }
   _next(outerVal) {
    // 判断是直接订阅还是推入队列
    if(this.active < this.concurrent) {
      this._tryNext(outerVal)
    } else {
      this.buffer.push(outerVal)
    }
  }
  _tryNext(outerVal) {
    const index = this.index++
    // 转换为Observable，并执行订阅
    const mappedOb$ = this.project(outerVal, index)
    this.active++
    this._innerSub(mappedOb$, outerVal, index)
  }
  _innerSub(mappedOb$, outerVal, index) {
    // 实例化一个InnerSubscriber并订阅mappedOb$
    // 注意这里的outerVal
    const innerSubscriber = new InnerSubscriber(this, undefined, index)
    mappedOb$.subscribe(innerSubscriber)
  }
  _complete() {
    this.hasCompleted = true
    if(this.active === 0 && this.buffer.length === 0) {
      this.destination.complete()
    }
    this.unsubscribe()
  }
  gotNextMessageFromInner(outerVal, innerVal, outerIndex, innerIndex, innerSub) {
    this.destination.next(innerVal)
  }
  gotCompleteMessageFromInner(innerSub) {
    const { buffer } = this
    this.remove(innerSub)
    this.active--
    if(buffer.length > 0) {
      this._next(buffer.shift())
    } else if (this.active === 0 && this.hasCompleted) {
      this.destination.complete()
    }
  }
}
