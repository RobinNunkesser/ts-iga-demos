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
camera.position.set(0, 18, 28);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
container.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 60;
controls.minDistance = 5;

// Lichter
const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.3);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xfff7ed, 3, 100);
sunLight.castShadow = true;
scene.add(sunLight);

// Hilfsfunktion für Orbit-Ringe
function createOrbitRing(radius: number): THREE.Line {
  const points = [];
  const segments = 64;
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  const mat = new THREE.LineBasicMaterial({ color: 0x1e293b, transparent: true, opacity: 0.6 });
  return new THREE.Line(geo, mat);
}

// 1. Sonne (Zentrum)
const sunGeo = new THREE.SphereGeometry(2.5, 32, 32);
const sunMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: false });
const sunMesh = new THREE.Mesh(sunGeo, sunMat);
scene.add(sunMesh);

const sunAxes = new THREE.AxesHelper(4);
sunMesh.add(sunAxes);

// 2. Erdorbit & Erde
const earthOrbitRadius = 12;
scene.add(createOrbitRing(earthOrbitRadius));

const earthPivot = new THREE.Object3D();
scene.add(earthPivot);

const earthGeo = new THREE.SphereGeometry(1.2, 24, 24);
const earthMat = new THREE.MeshStandardMaterial({
  color: 0x0284c7,
  roughness: 0.4,
  metalness: 0.1,
  wireframe: false,
});
const earthMesh = new THREE.Mesh(earthGeo, earthMat);
earthMesh.position.x = earthOrbitRadius;
earthMesh.castShadow = true;
earthMesh.receiveShadow = true;
earthPivot.add(earthMesh);

const earthAxes = new THREE.AxesHelper(2.5);
earthMesh.add(earthAxes);

// 3. Mondorbit & Mond (Kind von Erde)
const moonOrbitRadius = 3.2;
const moonRing = createOrbitRing(moonOrbitRadius);
earthMesh.add(moonRing);

const moonPivot = new THREE.Object3D();
earthMesh.add(moonPivot);

const moonGeo = new THREE.SphereGeometry(0.5, 16, 16);
const moonMat = new THREE.MeshStandardMaterial({
  color: 0x94a3b8,
  roughness: 0.8,
  metalness: 0.05,
  wireframe: false,
});
const moonMesh = new THREE.Mesh(moonGeo, moonMat);
moonMesh.position.x = moonOrbitRadius;
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;
moonPivot.add(moonMesh);

const moonAxes = new THREE.AxesHelper(1.2);
moonMesh.add(moonAxes);

// Gitter am Boden für Raumgefühl
const grid = new THREE.GridHelper(40, 20, 0x1e293b, 0x0f172a);
grid.position.y = -4;
scene.add(grid);

// UI Controls
let isAnimating = true;
const toggleOrbit = document.getElementById("toggle-orbit") as HTMLInputElement | null;
const toggleAxes = document.getElementById("toggle-axes") as HTMLInputElement | null;
const toggleWireframe = document.getElementById("toggle-wireframe") as HTMLInputElement | null;

if (toggleOrbit) {
  toggleOrbit.addEventListener("change", (e) => {
    isAnimating = (e.target as HTMLInputElement).checked;
  });
}

const allAxes = [sunAxes, earthAxes, moonAxes];
if (toggleAxes) {
  toggleAxes.addEventListener("change", (e) => {
    const show = (e.target as HTMLInputElement).checked;
    allAxes.forEach((a) => (a.visible = show));
  });
}

const allMats = [sunMat, earthMat, moonMat];
if (toggleWireframe) {
  toggleWireframe.addEventListener("change", (e) => {
    const wf = (e.target as HTMLInputElement).checked;
    allMats.forEach((m) => (m.wireframe = wf));
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

  if (isAnimating) {
    // Eigendrehung Sonne
    sunMesh.rotation.y += delta * 0.2;

    // Erdbahn um die Sonne (Pivot rotiert)
    earthPivot.rotation.y += delta * 0.4;

    // Eigendrehung Erde
    earthMesh.rotation.y += delta * 1.2;

    // Mondbahn um die Erde (Pivot rotiert relativ zur Erde!)
    moonPivot.rotation.y += delta * 1.8;
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();
