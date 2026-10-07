import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const container = document.getElementById("canvas-container");
if (!container) throw new Error("Canvas container missing");

// Szene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0f1d);

// Kamera
const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Lichter
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x38bdf8, 2.5);
dirLight.position.set(5, 8, 4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 1024;
dirLight.shadow.mapSize.height = 1024;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 25;
scene.add(dirLight);

// Licht-Marker (kleine leuchtende Kugel)
const lightHelperSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 16, 16),
  new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
);
dirLight.add(lightHelperSphere);

// Zweites warmes Fill-Light
const fillLight = new THREE.PointLight(0xf43f5e, 1.2, 20);
fillLight.position.set(-6, 3, -3);
scene.add(fillLight);

// Bodenplatte
const floorGeo = new THREE.PlaneGeometry(24, 24);
const floorMat = new THREE.MeshStandardMaterial({
  color: 0x0f172a,
  roughness: 0.6,
  metalness: 0.2,
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -2;
floor.receiveShadow = true;
scene.add(floor);

// Raster am Boden
const grid = new THREE.GridHelper(24, 24, 0x1e293b, 0x1e293b);
grid.position.y = -1.99;
scene.add(grid);

// 3D Test-Objekt: Torus Knot
const knotGeo = new THREE.TorusKnotGeometry(1.4, 0.45, 128, 32);

// Material-Varianten
const materials = {
  basic: new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
  lambert: new THREE.MeshLambertMaterial({ color: 0x38bdf8 }),
  phong: new THREE.MeshPhongMaterial({ color: 0x38bdf8, shininess: 80, specular: 0xffffff }),
  standard: new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.25,
    metalness: 0.8,
  }),
};

const knotMesh: THREE.Mesh<THREE.BufferGeometry, THREE.Material> = new THREE.Mesh(
  knotGeo,
  materials.standard
);
knotMesh.position.y = 0.5;
knotMesh.castShadow = true;
knotMesh.receiveShadow = true;
scene.add(knotMesh);

// UI Events
const selectMat = document.getElementById("select-material") as HTMLSelectElement | null;
const roughnessSlider = document.getElementById("roughness-slider") as HTMLInputElement | null;
const metalnessSlider = document.getElementById("metalness-slider") as HTMLInputElement | null;
const toggleShadow = document.getElementById("toggle-shadow") as HTMLInputElement | null;

if (selectMat) {
  selectMat.addEventListener("change", (e) => {
    const key = (e.target as HTMLSelectElement).value as keyof typeof materials;
    knotMesh.material = materials[key] || materials.standard;
  });
}

if (roughnessSlider) {
  roughnessSlider.addEventListener("input", (e) => {
    materials.standard.roughness = parseFloat((e.target as HTMLInputElement).value);
  });
}

if (metalnessSlider) {
  metalnessSlider.addEventListener("input", (e) => {
    materials.standard.metalness = parseFloat((e.target as HTMLInputElement).value);
  });
}

if (toggleShadow) {
  toggleShadow.addEventListener("change", (e) => {
    const active = (e.target as HTMLInputElement).checked;
    dirLight.castShadow = active;
  });
}

// Resize Handling
function onResize() {
  if (!container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}
window.addEventListener("resize", onResize);

// Animation Loop
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Sanfte Rotation des Testobjekts
  knotMesh.rotation.y += delta * 0.4;
  knotMesh.rotation.x += delta * 0.2;

  // Licht kreist sanft um das Objekt
  dirLight.position.x = Math.cos(time * 0.5) * 6;
  dirLight.position.z = Math.sin(time * 0.5) * 6;

  controls.update();
  renderer.render(scene, camera);
}

animate();
