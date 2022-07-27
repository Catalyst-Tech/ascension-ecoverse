import EventEmitter from "./EventEmitter";

export default class Time extends EventEmitter {
  start: number;
  lastTime: number;
  elapsed: number;
  delta: number;

  constructor() {
    super();
    this.start = Date.now();
    this.lastTime = this.start;
    this.elapsed = 0;
    this.delta = 16; // delta of 60fps
    window.requestAnimationFrame(() => this.tick());
  }

  tick() {
    const currentTime = Date.now();
    this.delta = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.elapsed = this.lastTime - this.start;

    this.trigger("tick");

    window.requestAnimationFrame(() => this.tick());
  }
}
