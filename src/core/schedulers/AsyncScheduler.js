import { Subscription } from '@bjs/core'

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
export class AsyncAction extends Subscription {
  constructor(scheduler, work) {
    super()
    this.scheduler = scheduler
    this.work = work

    this.delay = undefined
    this.state = undefined
    this.timerId = undefined
  }
  schedule(state, delay) {
    /* 在delay后执行this.work， 传入的值为this.state */
    if (this.hasUnsubscribed) return
    this.state = state
    this.delay = delay

    this.timerId = this.setupAsyncTask(this.scheduler, delay)
    return this
  }
  setupAsyncTask(scheduler, delay = 0) {
    /* 在delay时间后，执行scheduler的flushQueue操作 */
    return setTimeout(scheduler.flushQueue.bind(scheduler, this), delay)
  }
  cancelAsyncTask(id) {
    /* 取消任务 */
    clearTimeout(id)
  }
  execute(state) {
    /* 执行work */
    this.work(state)
  }
  _unsubscribe() {
    /* 取消任务 */
    const timerId = this.timerId
    const scheduler = this.scheduler
    const index = scheduler.actions.indexOf(this)

    this.task = null
    this.scheduler = null
    this.state = undefined
    if(index !== -1) {
      scheduler.actions.splice(index, 1)
    }
    if(timerId != null) {
      this.cancelAsyncTask(timerId)
    }
    this.delay = null
   }
}
export const async = new AsyncScheduler(AsyncAction)
