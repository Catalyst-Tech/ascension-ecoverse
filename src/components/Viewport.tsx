import { useEffect, useRef, useState } from "react";
import {
  BoxGeometry,
  Clock,
  GridHelper,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector2,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { Pane } from "tweakpane";
import gsap from "gsap";

const heightRatio = 0.9;

const Viewport: React.FC = () => {
  const viewport = useRef<HTMLCanvasElement | null>(null);

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(
    window.innerHeight * heightRatio
  );
  const [viewportAspectRatio, setViewportAspectRatio] = useState(
    viewportWidth / viewportHeight
  );

  useEffect(() => {
    // pane
    const pane = new Pane();

    // setup objects
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: "#e4302f" });
    const box = new Mesh(geometry, material);
    box.rotation.x = 45;
    pane.addInput(box.position, "y", { min: -10, max: 10, step: 0.01 });
    pane.addInput(box.position, "x", { min: -10, max: 10, step: 0.01 });
    pane.addInput(box.position, "z", { min: -10, max: 10, step: 0.01 });

    // setup camera
    const camera = new PerspectiveCamera(50, viewportAspectRatio);
    camera.position.z = 20;

    // setup scene
    const scene = new Scene();
    const grid = new GridHelper();
    scene.add(box);
    scene.add(camera);
    scene.add(grid);

    // setup renderer
    const renderer = new WebGLRenderer({
      canvas: viewport.current || undefined,
    });
    renderer.setSize(viewportWidth, viewportHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // setup composer
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const resolution = new Vector2(viewportWidth, viewportHeight);
    // composer.addPass(new OutlinePass(resolution, scene, camera, [box]));

    // setup controls
    const controls = new OrbitControls(camera, viewport.current || undefined);
    controls.enableDamping = true;

    // setup clock
    const clock = new Clock();

    // gsap animations
    // gsap.to(box.position, { x: 2, duration: 1, delay: 1 });
    // gsap.to(box.position, { x: -2, duration: 1, delay: 2 });

    const seed = (length: number = 10) =>
      Array.from({ length }, () => Math.random());

    // let grid = [];
    // let nodes = 8;

    function random_unit_vector(){
      let theta = Math.random() * 2 * Math.PI;
      return {
          x: Math.cos(theta),
          y: Math.sin(theta)
      };
  }

    // update
    const update = () => {
      // get seconds
      let seconds = clock.getElapsedTime();
      // update controls
      controls.update();
      // animation
      box.rotation.x = Math.sin(4 * seconds) / 4;
      box.rotation.y = Math.cos(0.5 * seconds) / 4;
      // let seed = Array.from({ length: 10 }, () => Math.floor(Math.random() * 10));
      // console.log(seed());
      // box.position.x = Math.cos(theta) * (seconds * 1);
      // box.position.z = Math.sin(theta) * (seconds * 1);

      // render
      // renderer.render(scene, camera);
      composer.render();
      // call next frame
      window.requestAnimationFrame(update);
    };
    update();

    // other
    const handleWindowResize = () => {
      // update viewport
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight * heightRatio);
      setViewportAspectRatio(viewportWidth / viewportHeight);
      //update camera
      camera.aspect = viewportAspectRatio;
      camera.updateProjectionMatrix();
      //update renderer
      renderer.setSize(viewportWidth, viewportHeight);
    };

    // handle window resize
    window.addEventListener("resize", handleWindowResize);

    // clean up
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, [viewportAspectRatio, viewportHeight, viewportWidth]);

  const handleFullScreen = () => {
    if (viewport.current === null) return;
    if (!document.fullscreenElement) {
      viewport.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="viewport">
      <canvas ref={viewport} onDoubleClick={handleFullScreen}></canvas>
    </div>
  );
};

export default Viewport;
