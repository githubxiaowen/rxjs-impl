import { Subscriber } from '@bjs/core'

export function map(project) {
    return upstream$ => upstream$.lift(new MapOperator(project))
}
class MapOperator {
    constructor(project) {
        this.project = project
    }
    call(subscriber, upstream$) {
      return upstream$.subscribe(new MapSubscriber(subscriber, this.project))
    }
}

class MapSubscriber extends Subscriber {
    constructor(destination, project) {
        super(destination)
        this.project = project
        this.index = 0
    }
    _next(val) {
      const mappedVal = this.project.call(this, val, this.index++)
      this.destination.next(mappedVal)
    }
}
