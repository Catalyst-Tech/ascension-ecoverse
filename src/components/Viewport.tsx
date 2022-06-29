import { useEffect, useRef, useState } from "react";
import {
  AmbientLight,
  AnimationAction,
  AnimationMixer,
  ArrowHelper,
  BasicShadowMap,
  BoxGeometry,
  BufferAttribute,
  CameraHelper,
  Clock,
  Color,
  ConeGeometry,
  DirectionalLight,
  DirectionalLightHelper,
  Fog,
  GLSL3,
  GridHelper,
  Group,
  HemisphereLight,
  HemisphereLightHelper,
  Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshNormalMaterial,
  MeshStandardMaterial,
  MeshToonMaterial,
  Object3D,
  OctahedronGeometry,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  RawShaderMaterial,
  Raycaster,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
// import { Sky } from "three/examples/jsm/objects/Sky";
import { Pane } from "tweakpane";
import Stats from "three/examples/jsm/libs/stats.module";
import shader_01 from "../shaders/shader_01";
import shader_02 from "../shaders/shader_02";
import { degreesToRadian } from "../helpers";
import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import { clamp } from "three/src/math/MathUtils";
import shader_sea from "../shaders/shader_sea";
// import gsap from "gsap";

const heightRatio = 1;

const Viewport: React.FC = () => {
  const viewport = useRef<HTMLCanvasElement | null>(null);

  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);
  const [viewportHeight, setViewportHeight] = useState(
    window.innerHeight * heightRatio
  );
  const [viewportAspectRatio, setViewportAspectRatio] = useState(
    viewportWidth / viewportHeight
  );
  const destination = useRef(new Vector3());
  const mouseCoordinates = useRef(new Vector2());
  const mouseLocation = useRef(new Vector3());

  useEffect(() => {
    // stats
    let stats = Stats();
    document.body.appendChild(stats.dom);

    // variables
    let skyColor = "#a3c9fe";
    let sunColor = "#f4f3f1";
    let grassColor = "#2b4626";
    let grassLightReflection = "#6ec47d";

    // pane
    const pane = new Pane();
    // pane.addInput(ground.position, "y", { min: -10, max: 10, step: 0.01 });

    // materials
    const material = new MeshStandardMaterial({ color: grassColor });
    const material2 = new MeshStandardMaterial({ color: "#441f28" });
    const material3 = new MeshStandardMaterial({ color: "#1b4077" });
    const material4 = new MeshStandardMaterial({ color: "#793096" });
    const material5 = new MeshStandardMaterial({
      color: "#2b4626",
      flatShading: true,
      // wireframe: true,
    });
    const seaMat = new ShaderMaterial({
      vertexShader: shader_sea.vertex,
      fragmentShader: shader_sea.fragment,
      uniforms: {
        uTime: { value: 0 },
        uLightPosition: { value: new Vector3(0, 400, 125) },
      },
      glslVersion: GLSL3,
      transparent: true,
      // wireframe: true,
    });

    // loading models
    let mixer: AnimationMixer;
    let char: Group;
    let charReady: boolean = false;
    let animationActions: AnimationAction[] = [];
    let activeAction: AnimationAction;
    let lastAction: AnimationAction;
    const fbxLoader = new FBXLoader();
    fbxLoader.load("/models/jenna_idle.fbx", (charFBX) => {
      charFBX.scale.set(0.1, 0.1, 0.1);
      // charFBX.position.set(100, 0, 100);
      charFBX.traverse((child) => {
        if ((child as any).isMesh) {
          child.castShadow = true;
          // let mesh = child as Mesh;
          // let materials = mesh.material as Material[];
          // materials[3] = myMat;
        }
      });
      mixer = new AnimationMixer(charFBX);
      const animationAction = mixer.clipAction(charFBX.animations[0]);
      animationActions.push(animationAction);
      activeAction = animationActions[0];

      fbxLoader.load("models/jenna_run.fbx", (charFBX) => {
        const animationAction = mixer.clipAction(charFBX.animations[0]);
        animationActions.push(animationAction);
        charReady = true;
      });

      char = charFBX;
      scene.add(char);
    });
    // animations
    const setAction = (action: AnimationAction) => {
      if (action !== activeAction) {
        lastAction = activeAction;
        activeAction = action;
        lastAction.fadeOut(0.2);
        activeAction.reset();
        activeAction.fadeIn(0.2);
        activeAction.play();
      }
    };
    const animations = {
      idle: () => setAction(animationActions[0]),
      run: () => setAction(animationActions[1]),
    };

    let land: Group;
    fbxLoader.load("models/land_1.fbx", (landFBX) => {
      // @ts-ignore
      landFBX.children[0].material = material5;
      land = landFBX;
      land.children[0].receiveShadow = true;
      scene.add(land);
    });

    // sea
    const seaGeo = new PlaneGeometry(256, 256, 40, 40);
    const sea = new Mesh(seaGeo, seaMat);
    sea.rotation.x = (Math.PI / 2) * -1;
    sea.position.set(128, -10, 128);
    // sea.position.set(0, 15, 0);

    // box
    const cursorBoxGeo = new BoxGeometry(2, 2, 2);
    const cursorBox = new Mesh(cursorBoxGeo, material2);
    cursorBox.castShadow = true;
    cursorBox.position.y = 1;
    cursorBox.position.x = 50;

    // box
    const destinationBoxGeo = new BoxGeometry(1, 1, 1);
    const destinationBox = new Mesh(destinationBoxGeo, material3);
    destinationBox.castShadow = true;
    destinationBox.position.y = 0.5;
    destinationBox.position.x = 0;
    destinationBox.rotateY(Math.PI / 2);

    // rotation proxy
    const rotationProxyGeo = new OctahedronGeometry(1, 0);
    const rotationProxy = new Mesh(rotationProxyGeo, material4);
    rotationProxy.visible = false;

    // setup camera
    let cameraSettings = {
      zoom: 50,
      angle: -45,
    };
    const camera = new PerspectiveCamera(50, viewportAspectRatio);
    // camera.position.x = -cameraSettings.zoom / 1.5;
    camera.position.y = cameraSettings.zoom;
    camera.position.z = cameraSettings.zoom;
    camera.rotateX(degreesToRadian(cameraSettings.angle));

    // setup controls
    // const controls = new OrbitControls(camera, viewport.current || undefined);
    // controls.enableDamping = true;
    // controls.enabled = false;
    // pane.addInput(controls, "enabled");

    // setup scene
    const scene = new Scene();
    scene.background = new Color(skyColor);
    // scene.fog = new Fog(skyColor, 180, 200);
    scene.add(camera, cursorBox, destinationBox, rotationProxy, sea);
    const grid = new GridHelper();
    scene.add(grid);

    // light
    const ambientLight = new AmbientLight(skyColor, 1);
    scene.add(ambientLight);

    const hemiLight = new HemisphereLight(skyColor, grassLightReflection, 0.4);
    scene.add(hemiLight);

    const sunLight = new DirectionalLight(sunColor, 1.3);
    sunLight.position.set(0, 400, 125);
    scene.add(sunLight);
    // shadows
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 512 * 4;
    sunLight.shadow.mapSize.height = 512 * 4;
    const shadowCameraSize = 400;
    sunLight.shadow.camera.left = -shadowCameraSize / 2;
    sunLight.shadow.camera.right = shadowCameraSize / 2;
    sunLight.shadow.camera.top = shadowCameraSize / 2;
    sunLight.shadow.camera.bottom = -shadowCameraSize / 2;

    // const helper = new CameraHelper( sunLight.shadow.camera );
    // scene.add( helper );
    // const sunLightHelper = new DirectionalLightHelper(sunLight, 10);
    // scene.add(sunLightHelper);

    // setup renderer
    const renderer = new WebGLRenderer({
      canvas: viewport.current || undefined,
      antialias: true,
    });
    renderer.setSize(viewportWidth, viewportHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    // setup composer
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    // const resolution = new Vector2(viewportWidth, viewportHeight);
    // composer.addPass(new OutlinePass(resolution, scene, camera));

    // setup clock
    const clock = new Clock();

    // movement
    let velocity = 0.2;
    // let destination = new Vector3(5, 0, 5);
    let destinationErrorMargin = 4;

    // ray caster
    const raycaster = new Raycaster();

    // update
    const update = () => {
      // call next frame
      window.requestAnimationFrame(update);
      // get delta
      const delta = clock.getDelta();
      // get seconds
      let elapsedTime = clock.getElapsedTime();
      // update materials
      seaMat.uniforms.uTime.value = elapsedTime;
      // update controls
      // controls.update();
      // animation
      if (mixer) mixer.update(delta);

      // ground ray tracing
      if (land) {
        destinationBox.position.x = destination.current.x;
        destinationBox.position.z = destination.current.z;
        destinationBox.position.y = clamp(destination.current.y, -5, 10);
        raycaster.setFromCamera(mouseCoordinates.current, camera);
        const objectsToTest = [land];
        const intersects = raycaster.intersectObjects(objectsToTest);
        for (const intersect of intersects) {
          cursorBox.position.x = intersect.point.x;
          cursorBox.position.y = clamp(intersect.point.y, -10, 10);
          cursorBox.position.z = intersect.point.z;
          mouseLocation.current.x = intersect.point.x;
          mouseLocation.current.y = clamp(intersect.point.y, -10, 10);
          mouseLocation.current.z = intersect.point.z;
        }
      }

      // character movement
      if (charReady) {
        // move the character towards the destination vector (if not there already)
        if (
          char.position.distanceTo(destinationBox.position) >
          destinationErrorMargin
        ) {
          // attach the proxy position to the character position
          rotationProxy.position.copy(char.position);
          // rotate the proxy towards the destination vector
          rotationProxy.lookAt(destinationBox.position);
          // gradually give the character the rotation of the proxy
          if (!char.quaternion.equals(rotationProxy.quaternion)) {
            const step = 16 * delta;
            char.quaternion.rotateTowards(rotationProxy.quaternion, step);
          }

          // destination.current.y > -2 &&
          // destination.current.y < 10 &&
          // char.position.y > -2

          animations.run();
          char.translateZ(velocity);
          // camera follows the player
          camera.position.x = char.position.x;
          camera.position.z = char.position.z + cameraSettings.zoom;
        } else {
          animations.idle();
        }
      }

      // render
      composer.render();
      stats.update();
    };
    update();

    // events
    const handleClick = () => {
      if (mouseLocation.current.y > -10) {
        destination.current = new Vector3(
          mouseLocation.current.x,
          mouseLocation.current.y,
          mouseLocation.current.z
        );
      }
    };
    window.addEventListener("click", handleClick);

    // handle window resize
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
    window.addEventListener("resize", handleWindowResize);

    // handle full screen
    const handleFullScreen = () => {
      // update viewport
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight * heightRatio);
      setViewportAspectRatio(viewportWidth / viewportHeight);
      //update camera
      camera.aspect = viewportAspectRatio;
      camera.updateProjectionMatrix();
      //update renderer
      renderer.setSize(viewportWidth, viewportHeight);
      if (viewport.current === null) return;
      if (!document.fullscreenElement) {
        viewport.current.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
    };
    window.addEventListener("dblclick", handleFullScreen);

    // clean up
    return () => {
      window.removeEventListener("click", handleFullScreen);
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, [mouseCoordinates, viewportAspectRatio, viewportHeight, viewportWidth]);

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    mouseCoordinates.current.x = (event.clientX / viewportWidth) * 2 - 1;
    mouseCoordinates.current.y = -(event.clientY / viewportHeight) * 2 + 1;
  };

  return (
    <div className="viewport">
      <canvas ref={viewport} onMouseMove={handleMouseMove}></canvas>
    </div>
  );
};

export default Viewport;
