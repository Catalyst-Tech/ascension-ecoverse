import * as THREE from "three";
import Camera from "./camera";
import Time from "./utils/Time";
import WindowDetails from "./utils/WindowDetails";

export default class Game {
  windowDetails: WindowDetails;
  time: Time;
  scene: THREE.Scene;
  camera: Camera;

  constructor() {
    console.log("Game Initialized");
    // properties
    this.windowDetails = new WindowDetails();
    this.time = new Time();
    this.scene = new THREE.Scene();
    this.camera = new Camera(this);
    // events
    this.windowDetails.on("resize", this.onWindowResize.bind(this));
    this.time.on("tick", this.update.bind(this));
  }

  onWindowResize() {
    // console.log(this.windowDetails.width);
    // console.log(this.time);
    // console.log("RESIZE!!!");
  }

  update() {}
}
