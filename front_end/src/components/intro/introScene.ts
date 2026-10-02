import {
  ACESFilmicToneMapping, AdditiveBlending, AnimationMixer, Color, Group,
  HemisphereLight, LoopOnce, Material, Mesh, OrthographicCamera, PMREMGenerator,
  RectAreaLight, Scene, ShaderMaterial, SRGBColorSpace, Texture, WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";

const MODEL_URL = "/models/marshel-intro-v1.glb";
const PLAYBACK_SECONDS = 4;

type StudioLight = {
  name: string; energy: number; color: [number, number, number]; size: number;
  position: [number, number, number]; rotation: [number, number, number];
};

function disposeModel(root: Group) {
  const geometries = new Set<Mesh["geometry"]>();
  const materials = new Set<Material>();
  const textures = new Set<Texture>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    geometries.add(object.geometry);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value instanceof Texture) textures.add(value);
      }
    }
  });
  for (const texture of textures) {
    const bitmap = texture.image;
    if (typeof ImageBitmap !== "undefined" && bitmap instanceof ImageBitmap) bitmap.close();
    texture.dispose();
  }
  for (const material of materials) material.dispose();
  for (const geometry of geometries) geometry.dispose();
}

export function createIntroScene(
  container: HTMLDivElement,
  signal: AbortSignal,
  callbacks: { onReady: () => void; onComplete: () => void; onError: () => void },
) {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const scene = new Scene();
  let gltf: GLTF | undefined;
  let mixer: AnimationMixer | undefined;
  let frameId = 0;
  let disposed = false;
  let camera: OrthographicCamera | undefined;
  let cameraHalfHeight = 6.15;
  let pmrem: PMREMGenerator | undefined;
  let environment: ReturnType<PMREMGenerator["fromScene"]> | undefined;

  const resize = () => {
    const { width, height } = container.getBoundingClientRect();
    renderer.setSize(width, height, false);
    if (camera) {
      const aspect = width / Math.max(height, 1);
      const halfHeight = cameraHalfHeight / Math.min(aspect, 1);
      camera.left = -halfHeight * aspect;
      camera.right = halfHeight * aspect;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    signal.removeEventListener("abort", dispose);
    mixer?.stopAllAction();
    if (gltf) {
      mixer?.uncacheRoot(gltf.scene);
      disposeModel(gltf.scene);
    }
    environment?.dispose();
    pmrem?.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  signal.addEventListener("abort", dispose, { once: true });

  void (async () => {
    try {
      const response = await fetch(MODEL_URL, { signal });
      if (!response.ok) throw new Error("Intro model unavailable");
      const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
        .parseAsync(await response.arrayBuffer(), "/models/");
      if (disposed || signal.aborted) {
        disposeModel(model.scene);
        return;
      }
      gltf = model;
      const clip = model.animations[0];
      const sourceCamera = model.cameras[0];
      if (!clip || clip.duration <= 0 || !(sourceCamera instanceof OrthographicCamera)) {
        throw new Error("Intro model must include animation and an orthographic camera");
      }
      camera = sourceCamera;
      cameraHalfHeight = (camera.top - camera.bottom) / 2;
      scene.add(model.scene);

      RectAreaLightUniformsLib.init();
      const studio = new Group();
      studio.rotation.x = -Math.PI / 2; // Same Z-up to Y-up conversion as Blender's GLB export.
      const lights: StudioLight[] = JSON.parse(model.scene.userData.marshelStudioLights || "[]");
      for (const source of lights) {
        const light = new RectAreaLight(
          new Color().fromArray(source.color), source.energy / (Math.PI * source.size ** 2),
          source.size, source.size,
        );
        light.position.fromArray(source.position);
        light.rotation.set(...source.rotation);
        studio.add(light);
      }
      scene.add(studio, new HemisphereLight(0xdce9ff, 0x322017, 0.65));
      pmrem = new PMREMGenerator(renderer);
      const room = new RoomEnvironment();
      environment = pmrem.fromScene(room, 0.04);
      room.dispose();
      scene.environment = environment.texture;
      scene.environmentIntensity = 0.15;

      model.scene.traverse((object) => {
        if (!(object instanceof Mesh) || !object.userData.marshelAtmosphere) return;
        const old = Array.isArray(object.material) ? object.material : [object.material];
        old.forEach((material) => material.dispose());
        object.material = new ShaderMaterial({
          transparent: true, depthWrite: false, blending: AdditiveBlending,
          uniforms: { tint: { value: new Color(0xff7d32) } },
          vertexShader: `varying vec3 vNormal; varying vec3 vView;
            void main() {
              vec4 p = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vView = normalize(-p.xyz);
              gl_Position = projectionMatrix * p;
            }`,
          fragmentShader: `uniform vec3 tint; varying vec3 vNormal; varying vec3 vView;
            void main() {
              float rim = pow(1.0 - max(dot(normalize(vNormal), normalize(vView)), 0.0), 3.0);
              gl_FragColor = vec4(tint, rim * 0.35);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
            }`,
        });
      });

      mixer = new AnimationMixer(model.scene);
      const action = mixer.clipAction(clip);
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.timeScale = clip.duration / PLAYBACK_SECONDS;
      action.play();
      mixer.update(0);
      resize();
      renderer.render(scene, camera); // Upload textures and compile before the four-second playback starts.
      const start = performance.now();
      let previous = start;
      let completed = false;
      callbacks.onReady();

      const render = () => {
        if (disposed || !camera || !mixer) return;
        // A RAF timestamp can precede setup's performance.now() in the first
        // frame. A negative delta would pause LoopOnce on its starting frame.
        const now = performance.now();
        mixer.update(Math.max(0, now - previous) / 1000);
        previous = now;
        renderer.render(scene, camera);
        if (!completed && now - start >= PLAYBACK_SECONDS * 1000) {
          completed = true;
          callbacks.onComplete();
        }
        frameId = requestAnimationFrame(render);
      };
      frameId = requestAnimationFrame(render);
    } catch {
      if (!disposed && !signal.aborted) {
        dispose();
        callbacks.onError();
      }
    }
  })();

  return dispose;
}
