import p5 from "p5";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { setupEmbedMode } from "./embed.js";

setupEmbedMode();

interface Palette {
  name: string;
  leftHex: string;
  rightHex: string;
}

const PALETTES: Palette[] = [
  { name: "Blue & Yellow (Standard)", leftHex: "#009FE3", rightHex: "#FECC00" },
  { name: "Darkblue & Orange", leftHex: "#003E75", rightHex: "#F59C00" },
  { name: "Green & Blue", leftHex: "#00993E", rightHex: "#009FE3" },
  { name: "Purple & Lightgreen", leftHex: "#662382", rightHex: "#BCCF02" },
  { name: "Red & Mediumblue", leftHex: "#E2061A", rightHex: "#006FB9" },
];

let currentPaletteIdx = 0;
let autoRotate = true;
let syncRotation = true;
let wireframeMode = false;

// Gemeinsame Rotation für synchrone Drehung
let sharedRotX = 0.2;
let sharedRotY = 0.4;

/* ==========================================================
   1. THREE.JS INITIALISIERUNG
   ========================================================== */
const threeMount = document.getElementById("three-mount") as HTMLDivElement;
const threeScene = new THREE.Scene();
threeScene.background = new THREE.Color("#0f172a");

const threeCamera = new THREE.PerspectiveCamera(
  45,
  threeMount.clientWidth / threeMount.clientHeight || 1,
  1,
  1000
);
threeCamera.position.set(0, 0, 160);

const threeRenderer = new THREE.WebGLRenderer({ antialias: true });
threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
threeRenderer.setSize(threeMount.clientWidth, threeMount.clientHeight);
threeRenderer.shadowMap.enabled = true;
threeMount.appendChild(threeRenderer.domElement);

const controls = new OrbitControls(threeCamera, threeRenderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 300;
controls.minDistance = 60;

// Beleuchtung
const ambLight = new THREE.AmbientLight(0xffffff, 0.7);
threeScene.add(ambLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
dirLight.position.set(60, 90, 80);
dirLight.castShadow = true;
threeScene.add(dirLight);

const fillLight = new THREE.PointLight(0x38bdf8, 1.2, 300);
fillLight.position.set(-80, -60, 50);
threeScene.add(fillLight);

// Geometrien aus CI-Vektoren (64 x 32 Raster)
// Einheit: Skalierung = 1.6
const S = 1.6;

function createLeftShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-32 * S, -16 * S);
  s.lineTo(-32 * S, 16 * S);
  s.lineTo(-2 * S, 16 * S);
  s.lineTo(-2 * S, 3 * S);
  s.lineTo(-15 * S, 3 * S);
  s.lineTo(-15 * S, -4 * S);
  s.lineTo(-2 * S, -4 * S);
  s.lineTo(-2 * S, -16 * S);
  s.closePath();
  return s;
}

function createRightShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(32 * S, -16 * S);
  s.lineTo(32 * S, 16 * S);
  s.lineTo(2 * S, 16 * S);
  s.lineTo(2 * S, 3 * S);
  s.lineTo(15 * S, 3 * S);
  s.lineTo(15 * S, -4 * S);
  s.lineTo(2 * S, -4 * S);
  s.lineTo(2 * S, -16 * S);
  s.closePath();
  return s;
}

const extrudeSettings: THREE.ExtrudeGeometryOptions = {
  steps: 1,
  depth: 14 * S,
  bevelEnabled: true,
  bevelThickness: 1.8 * S,
  bevelSize: 1.2 * S,
  bevelOffset: 0,
  bevelSegments: 4,
};

const leftGeo = new THREE.ExtrudeGeometry(createLeftShape(), extrudeSettings);
const rightGeo = new THREE.ExtrudeGeometry(createRightShape(), extrudeSettings);
// Zentrierung in Z
leftGeo.translate(0, 0, -7 * S);
rightGeo.translate(0, 0, -7 * S);

const leftMat = new THREE.MeshStandardMaterial({
  color: PALETTES[currentPaletteIdx].leftHex,
  roughness: 0.28,
  metalness: 0.12,
  wireframe: wireframeMode,
});

const rightMat = new THREE.MeshStandardMaterial({
  color: PALETTES[currentPaletteIdx].rightHex,
  roughness: 0.28,
  metalness: 0.12,
  wireframe: wireframeMode,
});

const leftMesh = new THREE.Mesh(leftGeo, leftMat);
const rightMesh = new THREE.Mesh(rightGeo, rightMat);

const threeLogoGroup = new THREE.Group();
threeLogoGroup.add(leftMesh);
threeLogoGroup.add(rightMesh);
threeScene.add(threeLogoGroup);

/* ==========================================================
   2. P5.JS INITIALISIERUNG (WEBGL IMMEDIATE MODE)
   ========================================================== */
const p5Mount = document.getElementById("p5-mount") as HTMLDivElement;
let p5Instance: p5 | null = null;

// Lokale Mouse-Drag-Variablen für p5
let isP5Dragging = false;
let p5PrevMouseX = 0;
let p5PrevMouseY = 0;

p5Instance = new p5((p: p5) => {
  p.setup = () => {
    const c = p.createCanvas(p5Mount.clientWidth, p5Mount.clientHeight, p.WEBGL);
    c.parent("p5-mount");
    p.noStroke();
  };

  p.draw = () => {
    p.background(15, 23, 42);

    // Imperatives Licht-Setup
    p.ambientLight(120);
    p.directionalLight(255, 255, 255, 0.6, 0.8, -1);
    p.pointLight(56, 189, 248, -80, -60, 60);

    p.push();
    // Rotation anwenden
    if (syncRotation) {
      p.rotateX(-sharedRotX);
      p.rotateY(-sharedRotY);
    } else {
      p.rotateX(-sharedRotX);
      p.rotateY(-sharedRotY);
    }

    if (wireframeMode) {
      p.stroke(255);
      p.strokeWeight(1);
      p.noFill();
    } else {
      p.noStroke();
    }

    // p5.js Einheiten & Skalierung
    const pS = S;
    const depth = 14 * pS;

    // --- Linker U-Block (3 Boxen) ---
    const leftHex = PALETTES[currentPaletteIdx].leftHex;
    const lC = hexToRgb(leftHex);
    if (!wireframeMode) {
      p.fill(lC.r, lC.g, lC.b);
      p.specularMaterial(lC.r, lC.g, lC.b);
      p.shininess(30);
    }

    // 1. Vertikaler Schenkel
    p.push();
    p.translate(-23.5 * pS, 0, 0);
    p.box(17 * pS, 32 * pS, depth);
    p.pop();

    // 2. Oberer Balken
    p.push();
    p.translate(-8.5 * pS, 9.5 * pS, 0);
    p.box(13 * pS, 13 * pS, depth);
    p.pop();

    // 3. Unterer Balken
    p.push();
    p.translate(-8.5 * pS, -10 * pS, 0);
    p.box(13 * pS, 12 * pS, depth);
    p.pop();

    // --- Rechter U-Block (3 Boxen) ---
    const rightHex = PALETTES[currentPaletteIdx].rightHex;
    const rC = hexToRgb(rightHex);
    if (!wireframeMode) {
      p.fill(rC.r, rC.g, rC.b);
      p.specularMaterial(rC.r, rC.g, rC.b);
      p.shininess(30);
    }

    // 1. Vertikaler Schenkel
    p.push();
    p.translate(23.5 * pS, 0, 0);
    p.box(17 * pS, 32 * pS, depth);
    p.pop();

    // 2. Oberer Balken
    p.push();
    p.translate(8.5 * pS, 9.5 * pS, 0);
    p.box(13 * pS, 13 * pS, depth);
    p.pop();

    // 3. Unterer Balken
    p.push();
    p.translate(8.5 * pS, -10 * pS, 0);
    p.box(13 * pS, 12 * pS, depth);
    p.pop();

    p.pop();
  };

  p.mousePressed = () => {
    if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
      isP5Dragging = true;
      p5PrevMouseX = p.mouseX;
      p5PrevMouseY = p.mouseY;
    }
  };

  p.mouseDragged = () => {
    if (isP5Dragging) {
      const dx = p.mouseX - p5PrevMouseX;
      const dy = p.mouseY - p5PrevMouseY;
      sharedRotY -= dx * 0.01;
      sharedRotX += dy * 0.01;
      p5PrevMouseX = p.mouseX;
      p5PrevMouseY = p.mouseY;
    }
  };

  p.mouseReleased = () => {
    isP5Dragging = false;
  };
}, p5Mount);

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 };
}

let isThreeDragging = false;
controls.addEventListener("start", () => {
  isThreeDragging = true;
});
controls.addEventListener("end", () => {
  isThreeDragging = false;
});

/* ==========================================================
   3. ANIMATION & SYNCHRONISATION
   ========================================================== */
function animate() {
  requestAnimationFrame(animate);

  if (autoRotate && !isP5Dragging && !isThreeDragging) {
    sharedRotY += 0.008;
  }

  // Three.js Ausrichtung
  if (syncRotation) {
    threeLogoGroup.rotation.y = sharedRotY;
    threeLogoGroup.rotation.x = sharedRotX;
  } else {
    // Wenn nicht synchron, nutzt Three.js seine eigene OrbitControls-Kamera
    threeLogoGroup.rotation.set(0, 0, 0);
  }

  controls.update();
  threeRenderer.render(threeScene, threeCamera);
}

animate();

/* ==========================================================
   4. UI-INTERAKTIONEN & EVENT LISTENER
   ========================================================== */
function updatePalette(idx: number) {
  currentPaletteIdx = idx;
  const p = PALETTES[idx];
  leftMat.color.set(p.leftHex);
  rightMat.color.set(p.rightHex);
}

function updateWireframe(enabled: boolean) {
  wireframeMode = enabled;
  leftMat.wireframe = enabled;
  rightMat.wireframe = enabled;
}

const paletteSelect = document.getElementById("select-palette") as HTMLSelectElement;
paletteSelect.addEventListener("change", (e) => {
  const val = parseInt((e.target as HTMLSelectElement).value, 10);
  updatePalette(val);
});

const rotateToggle = document.getElementById("toggle-rotate") as HTMLInputElement;
rotateToggle.addEventListener("change", (e) => {
  autoRotate = (e.target as HTMLInputElement).checked;
});

const syncToggle = document.getElementById("toggle-sync") as HTMLInputElement;
syncToggle.addEventListener("change", (e) => {
  syncRotation = (e.target as HTMLInputElement).checked;
  controls.enabled = !syncRotation; // In Sync-Mode dreht gemeinsame Rotation
});

const wireframeToggle = document.getElementById("toggle-wireframe") as HTMLInputElement;
wireframeToggle.addEventListener("change", (e) => {
  updateWireframe((e.target as HTMLInputElement).checked);
});

// Ansichts-Umschaltung
const paneP5 = document.getElementById("pane-p5") as HTMLDivElement;
const paneThree = document.getElementById("pane-three") as HTMLDivElement;

const btnViewSplit = document.getElementById("btn-view-split") as HTMLButtonElement;
const btnViewP5 = document.getElementById("btn-view-p5") as HTMLButtonElement;
const btnViewThree = document.getElementById("btn-view-three") as HTMLButtonElement;

function setViewMode(mode: "split" | "p5" | "three") {
  btnViewSplit.classList.remove("active");
  btnViewP5.classList.remove("active");
  btnViewThree.classList.remove("active");

  if (mode === "split") {
    btnViewSplit.classList.add("active");
    paneP5.style.display = "flex";
    paneThree.style.display = "flex";
  } else if (mode === "p5") {
    btnViewP5.classList.add("active");
    paneP5.style.display = "flex";
    paneThree.style.display = "none";
  } else {
    btnViewThree.classList.add("active");
    paneP5.style.display = "none";
    paneThree.style.display = "flex";
  }

  handleResize();
}

btnViewSplit.addEventListener("click", () => setViewMode("split"));
btnViewP5.addEventListener("click", () => setViewMode("p5"));
btnViewThree.addEventListener("click", () => setViewMode("three"));

// Modal Logik
const btnCodeModal = document.getElementById("btn-code-modal") as HTMLButtonElement;
const btnCloseModal = document.getElementById("btn-close-modal") as HTMLButtonElement;
const codeModal = document.getElementById("code-modal") as HTMLDivElement;

btnCodeModal.addEventListener("click", () => {
  codeModal.classList.remove("hidden");
});

btnCloseModal.addEventListener("click", () => {
  codeModal.classList.add("hidden");
});

codeModal.addEventListener("click", (e) => {
  if (e.target === codeModal) {
    codeModal.classList.add("hidden");
  }
});

// Resize Handler
function handleResize() {
  if (threeMount.clientWidth > 0 && threeMount.clientHeight > 0) {
    threeCamera.aspect = threeMount.clientWidth / threeMount.clientHeight;
    threeCamera.updateProjectionMatrix();
    threeRenderer.setSize(threeMount.clientWidth, threeMount.clientHeight);
  }

  if (p5Instance && p5Mount.clientWidth > 0 && p5Mount.clientHeight > 0) {
    p5Instance.resizeCanvas(p5Mount.clientWidth, p5Mount.clientHeight);
  }
}

window.addEventListener("resize", handleResize);
setTimeout(handleResize, 100);
