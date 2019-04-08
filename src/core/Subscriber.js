import { Subscription } from './Subscription'
export class Subscriber extends Subscription {
  constructor(destination) {
    super()
    this.destination = destination
    // 关闭阀门，不接收任何数据
    this.stoppedAcceptData = false
  }
  next(value) {
    if(!this.stoppedAcceptData) {
      this._next(value)
    }
  }
    _next(value) {
      this.destination.next(value)
    }
    error(reason) {
      if(!this.stoppedAcceptData) {
        this._error(reason)
      }
    }
    _error(reason) {
      this.destination.error(reason)
    }
    complete() {
      if(!this.stoppedAcceptData) {
        this._complete()
      }
    }
    _complete() {
      this.destination.complete()
    }
    unsubscribe() {
      if(this.hasUnsubscribed) return
      this.stoppedAcceptData = true
      super.unsubscribe()
    }
}
