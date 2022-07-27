import { createNanoEvents, Emitter } from "nanoevents";

type Events = {
  [x: string]: (...args: any) => void;
};

export default class EventEmitter {
  emitter: Emitter<Events>;

  constructor() {
    this.emitter = createNanoEvents<Events>();
  }

  on<E extends keyof Events>(event: E, callback: Events[E]) {
    return this.emitter.on(event, callback);
  }

  trigger(eventName: string) {
    this.emitter.emit(eventName);
  }
}
