import * as THREE from "three";
import Game from "./game";

export default class Camera {
  game: Game;
  camera: THREE.PerspectiveCamera | undefined;

  constructor(game: Game) {
    this.game = game;
    console.log(game);
    this.setupCamera();
  }

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.game.windowDetails.aspectRatio
    );
    this.camera.position.set(0, 25, 50);
    this.game.scene.add(this.camera);
  }

  // init
  // const offset = new Vector3();
  // update
  // offset.copy( position ).sub( scope.target );
  // spherical.setFromVector3( offset );
}
