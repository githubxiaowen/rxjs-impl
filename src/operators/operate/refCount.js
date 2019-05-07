import { Subscriber } from "@acha/core/index";

function refCount() {
  return connectable => connectable.lift(new RefCountOperator(connectable))
}

class RefCountOperator {
  constructor(connectable) {
    this.connectable = connectable
  }
  // 通常情况下，这个source就是connectable
  call(subscriber, source) {
    const { connectable } = this
    connectable._refCount++

    const refCounter = new RefCountSubscriber(subscriber, connectable)
    const subscription = source.subscribe(refCounter)

    if(!refCounter.hasUnsubscribed) {
      refCounter.connection = connectable.connect()
    }
    return subscription
  }
}

class RefCountSubscriber extends Subscriber {
  constructor(destination, connectable) {
    super(destination)
    this.connection = null
    this.connectable = connectable
  }

  // TODO:
  _unsubscribe() {
    const { connectable } = this
    if(!connectable) {
      this.connection = null
      return
    }
    this.connectable = null
    const refCount = connectable._refCount
    if(refCount <= 0) {
      this.connection = null
      return
    }
    connectable._refCount--
    if(refCount > 1) {
      // WHY?
      this.connection = null
      return
    }

    const { connection } = this
    const sharedConnection = connectable._connection
    this.conneciton = null
    if(sharedConnection && (!connection || sharedConnection === connection)) {
      sharedConnection.unsubscribe()
    }
  }
}
