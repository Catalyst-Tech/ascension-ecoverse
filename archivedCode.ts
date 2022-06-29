import { Euler, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Quaternion, Vector3 } from "three";

// grass
const GrassBladeMat = new MeshStandardMaterial({ color: "#793096" });
const grassBladeHeight = 8;
const grassBladeWidth = 2;
const grassBladeHeightSegments = 3;
const randomizeMatrix = (function () {
  const position = new Vector3();
  const rotation = new Euler();
  const quaternion = new Quaternion();
  const scale = new Vector3();

  return function (matrix: Matrix4) {
    position.x = Math.random() * 250 - 125;
    position.y = grassBladeHeight / 2;
    position.z = Math.random() * 40 - 20;

    rotation.x = 0;
    rotation.y = Math.random() * 2 * Math.PI;
    rotation.z = 0;

    quaternion.setFromEuler(rotation);

    scale.x = scale.y = scale.z = Math.random() * 1;

    matrix.compose(position, quaternion, scale);
  };
})();
const grassCount = 100;
const matrix = new Matrix4();
const grassBladeGeo = new PlaneGeometry(
  grassBladeWidth,
  grassBladeHeight,
  1,
  grassBladeHeightSegments
);
const grassBlade = new InstancedMesh(grassBladeGeo, GrassBladeMat, grassCount);
// grassBlade.position.set(0, 0, 0);
for (let i = 0; i < grassCount; i++) {
  randomizeMatrix(matrix);
  grassBlade.setMatrixAt(i, matrix);
}
// scene.add(grassBlade);