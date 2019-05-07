import { ConnectableObservable } from '@acha/core'
export function multicast(subjectOrSubjectFactory, projector) {
  return source => {
    let subjectFactory
    if (typeof subjectOrSubjectFactory === 'function') {
      subjectFactory = subjectOrSubjectFactory
    } else {
      subjectFactory = () => subjectOrSubjectFactory
    }
    if(projector) {
      return source.lift(new MulticastOperator(subjectFactory, projector))
    }
    return new ConnectableObservable(source, subjectFactory)
  }
}

class MulticastOperator {
  constructor(subjectFactory, projector) {
    this.subjectFactory = subjectFactory
    this.projector = projector
  }
  call(subscriber, source) {
    const { projector } = this;
    const subject = this.subjectFactory();
    // 核心在于下面两句，projector是将subjet转为了另外一个subject
    const subscription = projector(subject).subscribe(subscriber);
    subscription.add(source.subscribe(subject));
    return subscription;
  }
}
