import { useEffect, useRef } from "react";
import {
  AmbientLight,
  AnimationAction,
  AnimationMixer,
  BackSide,
  BoxGeometry,
  Clock,
  Color,
  DirectionalLight,
  Fog,
  FogExp2,
  GLSL3,
  GridHelper,
  Group,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
// import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
// import { Sky } from "three/examples/jsm/objects/Sky";
// import { Pane } from "tweakpane";
import Stats from "three/examples/jsm/libs/stats.module";
// import shader_01 from "../shaders/shader_01";
// import shader_02 from "../shaders/shader_02";
import { degreesToRadian } from "../helpers";
// import { ImprovedNoise } from "three/examples/jsm/math/ImprovedNoise";
import shader_sky from "../shaders/shader_sky";
import shader_sea from "../shaders/shader_sea";
// import gsap from "gsap";

const Viewport: React.FC = () => {
  const viewport = useRef<HTMLCanvasElement | null>(null);
  const viewportDimensions = useRef(
    new Vector2(window.innerWidth, window.innerHeight)
  );
  const viewportAspectRatio = useRef(window.innerWidth / window.innerHeight);
  const destination = useRef(new Vector3());
  const pointerCoordinates = useRef(new Vector2());
  const pointerLocation = useRef(new Vector3());
  const cameraZoom = useRef(50);
  const cameraAngle = useRef(-20);
  const cameraPosition = useRef(
    new Vector3(0, cameraZoom.current / 2, cameraZoom.current)
  );
  const characterPosition = useRef(new Vector3(0, 0, 0));

  useEffect(() => {
    console.log("INITIALIZE");
    console.log(cameraPosition.current);

    // stats
    let stats = Stats();
    document.body.appendChild(stats.dom);

    // variables
    let skyColor = "#a3c9fe";
    let sunColor = "#f4f3f1";
    // let grassColor = "#2b4626";
    let grassLightReflection = "#6ec47d";

    // setup scene
    const scene = new Scene();
    scene.background = new Color(skyColor);

    // pane
    // const pane = new Pane();
    // pane.addInput(ground.position, "y", { min: -10, max: 10, step: 0.01 });

    // materials
    // const material = new MeshStandardMaterial({ color: grassColor });
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
    const skyMat = new ShaderMaterial({
      vertexShader: shader_sky.vertex,
      fragmentShader: shader_sky.fragment,
      uniforms: {
        topColor: { value: new Color(skyColor) },
        bottomColor: { value: new Color(sunColor) },
        offset: { value: 50 },
        exponent: { value: 0.2 },
      },
      glslVersion: GLSL3,
      side: BackSide,
    });
    const skyGeo = new SphereGeometry(1200, 32, 15);
    const sky = new Mesh(skyGeo, skyMat);
    scene.add(sky);

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
      charFBX.position.copy(characterPosition.current);
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

    let land: Object3D;
    fbxLoader.load("models/land_3.fbx", (landFBX) => {
      // @ts-ignore
      landFBX.children[0].material = material5;
      landFBX.children[0].receiveShadow = true;
      land = landFBX.children[0];
      scene.add(land);
    });

    // sea
    const seaGeo = new PlaneGeometry(1024, 1024, 64, 64);
    const sea = new Mesh(seaGeo, seaMat);
    sea.rotation.x = (Math.PI / 2) * -1;
    sea.position.set(128, -10, 128);
    sea.position.set(0, -10, 0);
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
    const camera = new PerspectiveCamera(50, viewportAspectRatio.current);
    // camera.position.x = -cameraSettings.zoom / 1.5;
    // camera.position.y = cameraSettings.zoom;
    // camera.position.z = cameraSettings.zoom;
    camera.position.copy(cameraPosition.current);
    camera.rotateX(degreesToRadian(cameraAngle.current));

    // setup controls
    // const controls = new OrbitControls(camera, viewport.current || undefined);
    // controls.enableDamping = true;
    // controls.enabled = false;
    // pane.addInput(controls, "enabled");

    // scene.fog = new Fog(skyColor, 200, 500);
    scene.fog = new FogExp2(skyColor, 0.002);
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
    renderer.setSize(
      viewportDimensions.current.x,
      viewportDimensions.current.y
    );
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
    let velocity = 0.23;
    let destinationErrorMargin = 4;

    // ray caster
    const destinationRaycaster = new Raycaster();
    const characterGravityRaycaster = new Raycaster();

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

      if (charReady && land) {
        // gravity raycaster
        const gravityRayOrigin = new Vector3(
          char.position.x,
          100,
          char.position.z
        );
        const gravityRayDirection = new Vector3(0, -1, 0);
        gravityRayDirection.normalize();
        characterGravityRaycaster.set(gravityRayOrigin, gravityRayDirection);
        const gravityRaycasterIntersects =
          characterGravityRaycaster.intersectObject(land);
        char.position.y = gravityRaycasterIntersects[0].point.y;

        // character movement
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

          animations.run();
          char.translateZ(velocity);
          characterPosition.current.x = char.position.x;
          characterPosition.current.y = char.position.y;
          characterPosition.current.z = char.position.z;
          // camera follows the player
          camera.position.x = char.position.x;
          camera.position.z = char.position.z + cameraZoom.current;
          cameraPosition.current.x = char.position.x;
          cameraPosition.current.z = char.position.z + cameraZoom.current;
          // console.log(cameraPosition.current);
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

    // handle pointer move
    const handlePointerMove = (event: PointerEvent) => {
      // set pointer coordinates
      pointerCoordinates.current.x =
        (event.clientX / viewportDimensions.current.x) * 2 - 1;
      pointerCoordinates.current.y =
        -(event.clientY / viewportDimensions.current.y) * 2 + 1;
      // ray cast
      if (land) {
        destinationRaycaster.setFromCamera(pointerCoordinates.current, camera);
        const intersects = destinationRaycaster.intersectObject(land, false);
        if (intersects.length) {
          cursorBox.position.x = intersects[0].point.x;
          cursorBox.position.y = intersects[0].point.y + 1;
          cursorBox.position.z = intersects[0].point.z;
          pointerLocation.current.x = intersects[0].point.x;
          pointerLocation.current.y = intersects[0].point.y;
          pointerLocation.current.z = intersects[0].point.z;
        }
      }
    };
    window.addEventListener("pointermove", handlePointerMove);

    // handle click
    const handleClick = () => {
      if (pointerLocation.current.y > -10) {
        destination.current = new Vector3(
          pointerLocation.current.x,
          pointerLocation.current.y,
          pointerLocation.current.z
        );
        // can i plug in the pointer location directly? without destination var?
        destinationBox.position.x = destination.current.x;
        destinationBox.position.y = destination.current.y + 0.5;
        destinationBox.position.z = destination.current.z;
      }
    };
    window.addEventListener("click", handleClick);
    // handle click
    const handleKeyboardInput = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyW":
          // cube.rotation.x += 0.1;
          console.log("w");
          break;
        case "KeyS":
          console.log("s");
          // cube.rotation.z -= 0.1;
          break;
        case "KeyA":
          console.log("a");
          // cube.rotation.x -= 0.1;
          break;
        case "KeyD":
          console.log("d");
          // camera.rotateZ(0.05);
          // cube.rotation.z += 0.1;
          break;
      }
    };
    window.addEventListener("keydown", handleKeyboardInput);

    // handle window resize
    const handleWindowResize = () => {
      // update viewport dimensions
      viewportDimensions.current.x = window.innerWidth;
      viewportDimensions.current.y = window.innerHeight;
      viewportAspectRatio.current = window.innerWidth / window.innerHeight;
      //update camera
      camera.aspect = viewportAspectRatio.current;
      camera.updateProjectionMatrix();
      //update renderer
      renderer.setSize(
        viewportDimensions.current.x,
        viewportDimensions.current.y
      );
    };
    window.addEventListener("resize", handleWindowResize);

    // handle full screen
    const handleFullScreen = () => {
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
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("click", handleFullScreen);
      window.removeEventListener("keydown", handleKeyboardInput);
      window.removeEventListener("resize", handleWindowResize);
      window.removeEventListener("dblclick", handleFullScreen);
    };
  }, [pointerCoordinates, viewportAspectRatio]);

  return (
    <div className="viewport">
      <canvas ref={viewport}></canvas>
    </div>
  );
};

export default Viewport;
