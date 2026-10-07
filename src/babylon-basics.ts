import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  GlowLayer,
  Mesh,
} from "@babylonjs/core";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("renderCanvas element missing");

// 1. Engine & Scene
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.04, 0.06, 0.1, 1.0);

// 2. Kamera (ArcRotateCamera mit integrierter Touch/Maus-Steuerung)
const camera = new ArcRotateCamera(
  "mainCam",
  -Math.PI / 2.5,
  Math.PI / 3,
  16,
  new Vector3(0, 1.5, 0),
  scene
);
camera.attachControl(canvas, true);
camera.wheelPrecision = 30;
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 35;

// 3. Beleuchtung
const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.35;
hemiLight.groundColor = new Color3(0.05, 0.05, 0.15);

const pointLight = new PointLight("pointLight", new Vector3(0, 3, 0), scene);
pointLight.diffuse = new Color3(0.22, 0.74, 0.97); // Cyan
pointLight.intensity = 2.0;

// 4. GlowLayer (Post-Processing Juiciness nativ in Babylon.js)
const glowLayer = new GlowLayer("glow", scene);
glowLayer.intensity = 0.9;

// 5. Zentrales leuchtendes Objekt (Core)
const coreMesh = MeshBuilder.CreateSphere("core", { diameter: 2.8, segments: 32 }, scene);
coreMesh.position.y = 1.8;

const coreMat = new StandardMaterial("coreMat", scene);
coreMat.diffuseColor = new Color3(0.05, 0.1, 0.2);
coreMat.emissiveColor = new Color3(0.22, 0.74, 0.97); // Strahlendes Cyan
coreMat.specularColor = new Color3(1, 1, 1);
coreMesh.material = coreMat;

// 6. Orbitierende Satelliten
const satellites: Mesh[] = [];
const numSatellites = 4;
for (let i = 0; i < numSatellites; i++) {
  const sat = MeshBuilder.CreateBox(`sat_${i}`, { size: 1.0 }, scene);
  const satMat = new StandardMaterial(`satMat_${i}`, scene);
  satMat.diffuseColor = new Color3(0.1, 0.1, 0.2);
  satMat.emissiveColor = i % 2 === 0 ? new Color3(0.96, 0.25, 0.37) : new Color3(0.5, 0.55, 0.97); // Rose & Indigo
  sat.material = satMat;
  satellites.push(sat);
}

// 7. Boden mit Ring-Struktur
const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
const groundMat = new StandardMaterial("groundMat", scene);
groundMat.diffuseColor = new Color3(0.06, 0.09, 0.16);
groundMat.specularColor = new Color3(0.2, 0.2, 0.3);
ground.material = groundMat;

// UI Controls
let isAnimating = true;
const toggleAnim = document.getElementById("toggle-anim") as HTMLInputElement | null;
const toggleGlow = document.getElementById("toggle-glow") as HTMLInputElement | null;
const glowSlider = document.getElementById("glow-slider") as HTMLInputElement | null;

if (toggleAnim) {
  toggleAnim.addEventListener("change", (e) => {
    isAnimating = (e.target as HTMLInputElement).checked;
  });
}

if (toggleGlow) {
  toggleGlow.addEventListener("change", (e) => {
    glowLayer.isEnabled = (e.target as HTMLInputElement).checked;
  });
}

if (glowSlider) {
  glowSlider.addEventListener("input", (e) => {
    glowLayer.intensity = parseFloat((e.target as HTMLInputElement).value);
  });
}

// Resize-Handling
window.addEventListener("resize", () => {
  engine.resize();
});

// Render- & Animationsloop
let time = 0;
engine.runRenderLoop(() => {
  if (isAnimating) {
    time += engine.getDeltaTime() * 0.001;

    coreMesh.rotation.y += 0.01;
    coreMesh.rotation.x = Math.sin(time) * 0.15;

    satellites.forEach((sat, i) => {
      const angle = time * 1.2 + (i * Math.PI * 2) / numSatellites;
      const radius = 5.2;
      sat.position.x = Math.cos(angle) * radius;
      sat.position.z = Math.sin(angle) * radius;
      sat.position.y = 1.8 + Math.sin(time * 2 + i) * 1.0;
      sat.rotation.x += 0.02;
      sat.rotation.y += 0.03;
    });

    pointLight.position.x = Math.sin(time * 0.8) * 4;
    pointLight.position.z = Math.cos(time * 0.8) * 4;
  }

  scene.render();
});
