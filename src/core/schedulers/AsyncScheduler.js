import { Subscription } from '@acha/core'


export class AsyncScheduler {
  constructor(AsyncAction) {
    this.AsyncAction = AsyncAction
    this.actionQueue = []
    this.isExecutingWork = false
  }
  flushQueue(action) {
    if (this.isExecutingWork) {
      this.actionQueue.push(action)
      return
    }
    this.isExecutingWork = true
    do {
      action.execute(action.state)
    } while (action = this.actionQueue.shift())
    this.isExecutingWork = false
  }
  schedule(work, delay, state) {
    const asyncAction = new this.AsyncAction(this, work)
    return asyncAction.schedule(state, delay)
  }
}
class AsyncAction extends Subscription {
  constructor(scheduler, work) {
    super()
    this.scheduler = scheduler
    this.work = work

    this.delay = undefined
    this.state = undefined
    this.timerId = undefined
    this.pending = false
  }
  schedule(state, delay) {
    /* 在delay后执行this.work， 传入的值为this.state */
    if (this.hasUnsubscribed) return
    this.state = state

    const timerId = this.timerId
    if (timerId != null) {
      // 如果timerId已有，即之前已经schedule过一次任务了，则首先判断是否需要执行cancenAsyncTask
      this.timerId = this.cancelAsyncTask(timerId, delay)
    }
    this.pending = true
    this.delay = delay
    // 如果是等时间间隔的相同任务，那么timerId不变，否则重新执行setupAsyncTask
    this.timerId = this.timerId || this.setupAsyncTask(this.scheduler, delay)
    return this
  }
  setupAsyncTask(scheduler, delay = 0) {
    /* 在delay时间后，执行scheduler的flushQueue操作 */
    return setInterval(scheduler.flushQueue.bind(scheduler, this), delay)
  }
  cancelAsyncTask(id, delay) {
    /* 同delay的相同任务，不用执行clearInterval */
    if (delay !== null && this.delay === delay && this.pending === false) return id
    clearInterval(id)
  }
  execute(state) {
    this.pending = false
    /* 执行work */
    this.work(state)
  }
  _unsubscribe() {
    /* 取消任务 */
    const timerId = this.timerId
    const scheduler = this.scheduler
    const index = scheduler.actionQueue.indexOf(this)

    this.pending = false
    this.task = null
    this.scheduler = null
    this.state = undefined
    if (index !== -1) {
      scheduler.actionQueue.splice(index, 1)
    }
    if (timerId != null) {
      // 传入delay为null,强制clearInterval
      this.cancelAsyncTask(timerId, null)
    }
    this.delay = null
  }
}
export const async = new AsyncScheduler(AsyncAction)
