import EventEmitter from "./EventEmitter";

export default class WindowDetails extends EventEmitter {
  width: number;
  height: number;
  pixelRatio: number;
  aspectRatio: number;

  constructor() {
    super();
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.aspectRatio = this.width / this.height;
    this.listenToWindowResizeEvent();
  }

  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    this.trigger("resize");
  }

  listenToWindowResizeEvent() {
    window.addEventListener("resize", this.onWindowResize.bind(this));
  }

  cleanUp() {
    window.removeEventListener("resize", this.onWindowResize.bind(this));
  }
}
