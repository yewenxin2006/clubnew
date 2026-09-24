import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("gl");
const loaderEl = document.getElementById("loader");
const loaderFill = document.getElementById("loader-fill");
const loaderStatus = document.getElementById("loader-status");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.localClippingEnabled = true;

const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(
  38,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 4.6);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const keyLight = new THREE.DirectionalLight(0xffffff, 2.15);
keyLight.position.set(3.1, 5.0, 4.2);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0x7f9bff, 0.5);
fillLight.position.set(-4.0, -1.5, 2.5);
scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
rimLight.position.set(-2.5, 2.8, -4.5);
scene.add(rimLight);

scene.add(new THREE.AmbientLight(0xffffff, 0.32));

const modelGroup = new THREE.Group();
scene.add(modelGroup);

// The imported asset has a 3D word baked into its lower section; hide that band.
const cropPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const pointer = new THREE.Vector2(0, 0);
const pointerTarget = new THREE.Vector2(0, 0);
let scrollTarget = 0;
let scrollCurrent = 0;
let modelHeight = 1;

const setLoaderProgress = value => {
  const percent = Math.max(0, Math.min(100, Math.round(value * 100)));
  loaderFill.style.width = `${percent}%`;
  loaderStatus.textContent = `LOADING ${percent}%`;
};

const gltfLoader = new GLTFLoader();
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

gltfLoader.load(
  "./models/lighting-sign.glb",
  gltf => {
    const model = gltf.scene;
    model.traverse(child => {
      if (!child.isMesh) return;

      child.material.envMapIntensity = 0.85;
      child.material.roughness = 0.38;
      child.material.metalness = 0.04;
      child.material.clippingPlanes = [cropPlane];

      if (child.material.map) {
        child.material.map.colorSpace = THREE.SRGBColorSpace;
      }
    });

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    modelHeight = Math.max(size.y, 0.001);
    model.position.sub(center);
    modelGroup.add(model);

    modelGroup.userData.cropY = -size.y / 2 + size.y * 0.27;

    canvas.classList.add("is-ready");
    setLoaderProgress(1);

    window.setTimeout(() => {
      loaderEl.classList.add("is-hidden");
    }, 260);
  },
  event => {
    if (event.lengthComputable) {
      setLoaderProgress(event.loaded / event.total);
    }
  },
  error => {
    console.error(error);
    loaderStatus.textContent = "3D MODEL FAILED TO LOAD";
  }
);

const sceneStates = {
  hero: { x: 0, y: 0, scale: 1.0, rotate: 0.70 },
  projects: { x: 0.27, y: -0.04, scale: 0.88, rotate: 0.82 },
  about: { x: 0.30, y: 0.01, scale: 0.76, rotate: 1.65 },
  services: { x: -0.26, y: -0.05, scale: 0.72, rotate: 2.35 },
  contact: { x: 0, y: 0, scale: 1.08, rotate: 3.05 }
};

let activeScene = "hero";

const updateFit = () => {
  const aspect = window.innerWidth / window.innerHeight;
  const visibleHeight = 2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.z;
  const visibleWidth = visibleHeight * aspect;
  modelGroup.userData.visibleWidth = visibleWidth;
  modelGroup.userData.baseScale = (visibleHeight * (window.innerWidth < 860 ? 0.58 : 0.66)) / modelHeight;
  modelGroup.userData.sceneScale = window.innerWidth < 860 ? 0.66 : 1.0;
};

const resize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateFit();
};

resize();

window.addEventListener("resize", resize, { passive: true });

window.addEventListener("pointermove", event => {
  pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1);
}, { passive: true });

const panelObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const sectionId = entry.target.id;
    activeScene = entry.target.dataset.scene || "hero";
    document.body.dataset.currentSection = sectionId;

    document.querySelectorAll(".rail-item").forEach(item => {
      item.classList.toggle("is-active", item.dataset.rail === sectionId);
    });
  });
}, {
  rootMargin: "-42% 0px -42% 0px",
  threshold: 0
});

document.querySelectorAll("[data-scene]").forEach(section => {
  panelObserver.observe(section);
});

const clock = new THREE.Clock();

const animate = () => {
  const delta = clock.getDelta();
  const elapsed = clock.elapsedTime;
  const docHeight = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  scrollTarget = window.scrollY / docHeight;
  scrollCurrent += (scrollTarget - scrollCurrent) * Math.min(delta * 6, 1);

  pointer.x += (pointerTarget.x - pointer.x) * Math.min(delta * 3, 1);
  pointer.y += (pointerTarget.y - pointer.y) * Math.min(delta * 3, 1);

  const state = sceneStates[activeScene] || sceneStates.hero;
  const width = modelGroup.userData.visibleWidth || 8;
  const mobileScale = modelGroup.userData.sceneScale || 1;
  const targetX = state.x * width * mobileScale;
  const targetY = state.y;
  const targetScale = (modelGroup.userData.baseScale || 3) * state.scale * mobileScale;
  const targetRotate = state.rotate + pointer.x * 0.24;

  modelGroup.position.x += (targetX - modelGroup.position.x) * Math.min(delta * 3, 1);
  modelGroup.position.y += ((targetY + Math.sin(elapsed * 0.55) * 0.025) - modelGroup.position.y) * Math.min(delta * 3, 1);
  modelGroup.scale.setScalar(modelGroup.scale.x + (targetScale - modelGroup.scale.x) * Math.min(delta * 3, 1));

  modelGroup.rotation.y += (targetRotate - modelGroup.rotation.y) * Math.min(delta * 2.5, 1);
  const cropY = modelGroup.userData.cropY;
  if (Number.isFinite(cropY)) {
    cropPlane.constant = -(modelGroup.position.y + modelGroup.scale.y * cropY);
  }
  modelGroup.rotation.x += ((pointer.y * 0.08) - modelGroup.rotation.x) * Math.min(delta * 2.5, 1);
  modelGroup.rotation.z = Math.sin(elapsed * 0.28) * 0.012;

  camera.position.x += (pointer.x * 0.08 - camera.position.x) * Math.min(delta * 2, 1);
  camera.position.y += (pointer.y * 0.05 - camera.position.y) * Math.min(delta * 2, 1);
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
};

animate();
