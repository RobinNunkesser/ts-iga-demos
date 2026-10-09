import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Texture,
  Color3,
  Color4,
  AxesViewer,
  Mesh
} from "@babylonjs/core";
import { setupEmbedMode } from "./embed.js";

setupEmbedMode();

// DOM Elemente
const conceptMount = document.getElementById("concept-mount") as HTMLDivElement;
const meshMount = document.getElementById("mesh-mount") as HTMLDivElement;

const canvasConcept = document.createElement("canvas");
canvasConcept.style.width = "100%";
canvasConcept.style.height = "100%";
canvasConcept.style.display = "block";
conceptMount.appendChild(canvasConcept);

const canvasMesh = document.createElement("canvas");
canvasMesh.style.width = "100%";
canvasMesh.style.height = "100%";
canvasMesh.style.display = "block";
meshMount.appendChild(canvasMesh);

// State Flags
let autoRotate = true;
let syncRotation = true;
let wireframeMode = false;
let jointsVisible = false;
let animationActive = true;
let explodedView = false;
let wingPhase = 0;

/* ==========================================================
   1. LINKE PANE: 2D-KI-CONCEPT AUF 3D-PRÄGE-EMBLEM
   ========================================================== */
const engineConcept = new Engine(canvasConcept, true, { antialias: true });
const sceneConcept = new Scene(engineConcept);
sceneConcept.clearColor = new Color4(0.06, 0.09, 0.15, 1.0);

const camConcept = new ArcRotateCamera(
  "camConcept",
  -Math.PI / 2,
  Math.PI / 2.1,
  6.5,
  Vector3.Zero(),
  sceneConcept
);
camConcept.attachControl(canvasConcept, true);
camConcept.lowerRadiusLimit = 4;
camConcept.upperRadiusLimit = 12;

const hemiConcept = new HemisphericLight("hemiConcept", new Vector3(0, 1, 0), sceneConcept);
hemiConcept.intensity = 0.8;
hemiConcept.diffuse = new Color3(0.9, 0.95, 1.0);

const dirConcept = new DirectionalLight("dirConcept", new Vector3(-0.6, -1, 0.8), sceneConcept);
dirConcept.intensity = 1.2;

// 3D Plakette / Emblem-Körper (Fasung & Tiefe)
const badgeGroup = new Mesh("badgeGroup", sceneConcept);

// Haupt-Prägeteller (flacher Zylinder mit hoher Tessellation)
const badgeCoin = MeshBuilder.CreateCylinder(
  "badgeCoin",
  { diameter: 3.8, height: 0.22, tessellation: 64 },
  sceneConcept
);
badgeCoin.rotation.x = Math.PI / 2;
badgeCoin.parent = badgeGroup;

// Goldener/Messingfarbener Zierring um die Münze
const badgeRim = MeshBuilder.CreateTorus(
  "badgeRim",
  { diameter: 3.82, thickness: 0.14, tessellation: 64 },
  sceneConcept
);
badgeRim.rotation.x = Math.PI / 2;
badgeRim.parent = badgeGroup;

const matRim = new StandardMaterial("matRim", sceneConcept);
matRim.diffuseColor = new Color3(0.95, 0.75, 0.2);
matRim.specularColor = new Color3(1.0, 0.9, 0.6);
matRim.specularPower = 64;
badgeRim.material = matRim;

// Vorderseiten-Textur mit dem KI-generierten Concept-Art
const matConceptFront = new StandardMaterial("matConceptFront", sceneConcept);
const conceptTexture = new Texture(
  "../../assets/drone_concept.png",
  sceneConcept,
  true,
  true // invertY
);
matConceptFront.diffuseTexture = conceptTexture;
matConceptFront.specularColor = new Color3(0.3, 0.3, 0.3);
matConceptFront.specularPower = 32;

// Plane direkt auf der Front-Fläche des Emblems
const frontDecal = MeshBuilder.CreatePlane("frontDecal", { size: 3.6 }, sceneConcept);
frontDecal.position.z = -0.115;
frontDecal.material = matConceptFront;
frontDecal.parent = badgeGroup;

// Rückseiten-Material (dunkler gebürsteter Titan-Look)
const matBack = new StandardMaterial("matBack", sceneConcept);
matBack.diffuseColor = new Color3(0.12, 0.15, 0.2);
matBack.specularColor = new Color3(0.5, 0.6, 0.8);
badgeCoin.material = matBack;

/* ==========================================================
   2. RECHTE PANE: PROZEDURALES 3D-MESH MIT KINEMATIK-INSPEKTOR
   ========================================================== */
const engineMesh = new Engine(canvasMesh, true, { antialias: true });
const sceneMesh = new Scene(engineMesh);
sceneMesh.clearColor = new Color4(0.06, 0.09, 0.15, 1.0);

const camMesh = new ArcRotateCamera(
  "camMesh",
  -Math.PI / 2,
  Math.PI / 2.2,
  5.5,
  Vector3.Zero(),
  sceneMesh
);
camMesh.attachControl(canvasMesh, true);
camMesh.lowerRadiusLimit = 3;
camMesh.upperRadiusLimit = 12;

const hemiMesh = new HemisphericLight("hemiMesh", new Vector3(0, 1, 0), sceneMesh);
hemiMesh.intensity = 0.8;
hemiMesh.diffuse = new Color3(0.9, 0.95, 1.0);

const dirMesh = new DirectionalLight("dirMesh", new Vector3(-0.6, -1, 0.8), sceneMesh);
dirMesh.intensity = 1.2;

// --- Materialien-System der 3D-Drohne ---
const matChassis = new StandardMaterial("matChassis", sceneMesh);
matChassis.diffuseColor = new Color3(0.1, 0.14, 0.2);
matChassis.specularColor = new Color3(0.4, 0.8, 1.0);
matChassis.specularPower = 32;

const matArmor = new StandardMaterial("matArmor", sceneMesh);
matArmor.diffuseColor = new Color3(0.15, 0.26, 0.42);
matArmor.specularColor = new Color3(0.7, 0.95, 1.0);
matArmor.specularPower = 48;

const matNeon = new StandardMaterial("matNeon", sceneMesh);
matNeon.diffuseColor = new Color3(0.0, 1.0, 1.0);
matNeon.emissiveColor = new Color3(0.25, 0.95, 1.0);

const matThruster = new StandardMaterial("matThruster", sceneMesh);
matThruster.diffuseColor = new Color3(0.2, 0.22, 0.26);
matThruster.specularColor = new Color3(0.8, 0.9, 1.0);

const matHoloWing = new StandardMaterial("matHoloWing", sceneMesh);
matHoloWing.diffuseColor = new Color3(0.08, 0.85, 1.0);
matHoloWing.emissiveColor = new Color3(0.15, 0.75, 0.95);
matHoloWing.alpha = 0.72;
matHoloWing.backFaceCulling = false;

const matPlasma = new StandardMaterial("matPlasma", sceneMesh);
matPlasma.diffuseColor = new Color3(0.1, 0.7, 1.0);
matPlasma.emissiveColor = new Color3(0.3, 0.95, 1.0);
matPlasma.alpha = 0.85;

const all3DMaterials = [matChassis, matArmor, matNeon, matThruster, matHoloWing, matPlasma];

// --- 3D-Drohnen Scenegraph-Hierarchie ---
const rootDrone = new Mesh("rootDrone", sceneMesh);

// 1. Rumpf
const fuselage = MeshBuilder.CreateSphere(
  "fuselage",
  { diameterX: 1.5, diameterY: 0.75, diameterZ: 0.88, segments: 16 },
  sceneMesh
);
fuselage.material = matChassis;
fuselage.parent = rootDrone;

// 2. Chitin-Panzer (Carapace)
const carapaceFront = MeshBuilder.CreateSphere(
  "carapaceFront",
  { diameterX: 0.9, diameterY: 0.45, diameterZ: 0.95, segments: 14 },
  sceneMesh
);
carapaceFront.position.set(0.1, 0.24, 0);
carapaceFront.material = matArmor;
carapaceFront.parent = rootDrone;

const carapaceRear = MeshBuilder.CreateSphere(
  "carapaceRear",
  { diameterX: 0.85, diameterY: 0.42, diameterZ: 0.9, segments: 14 },
  sceneMesh
);
carapaceRear.position.set(-0.42, 0.2, 0);
carapaceRear.material = matArmor;
carapaceRear.parent = rootDrone;

// 3. Fühler & Sensor-Augen
const eyeLeft = MeshBuilder.CreateSphere("eyeLeft", { diameter: 0.16 }, sceneMesh);
eyeLeft.position.set(0.72, 0.14, 0.22);
eyeLeft.material = matNeon;
eyeLeft.parent = rootDrone;

const eyeRight = MeshBuilder.CreateSphere("eyeRight", { diameter: 0.16 }, sceneMesh);
eyeRight.position.set(0.72, 0.14, -0.22);
eyeRight.material = matNeon;
eyeRight.parent = rootDrone;

// 4. Doppel-Düsen (Thrusters)
const thrusterL = MeshBuilder.CreateCylinder("thrusterL", { diameter: 0.26, height: 0.7 }, sceneMesh);
thrusterL.rotation.z = Math.PI / 2;
thrusterL.position.set(-0.8, 0.05, 0.32);
thrusterL.material = matThruster;
thrusterL.parent = rootDrone;

const thrusterR = MeshBuilder.CreateCylinder("thrusterR", { diameter: 0.26, height: 0.7 }, sceneMesh);
thrusterR.rotation.z = Math.PI / 2;
thrusterR.position.set(-0.8, 0.05, -0.32);
thrusterR.material = matThruster;
thrusterR.parent = rootDrone;

// Plasma-Flammen
const flameL = MeshBuilder.CreateCylinder("flameL", { diameterTop: 0, diameterBottom: 0.24, height: 0.6 }, sceneMesh);
flameL.rotation.z = -Math.PI / 2;
flameL.position.set(-1.22, 0.05, 0.32);
flameL.material = matPlasma;
flameL.parent = rootDrone;

const flameR = MeshBuilder.CreateCylinder("flameR", { diameterTop: 0, diameterBottom: 0.24, height: 0.6 }, sceneMesh);
flameR.rotation.z = -Math.PI / 2;
flameR.position.set(-1.22, 0.05, -0.32);
flameR.material = matPlasma;
flameR.parent = rootDrone;

// 5. Flügel-Gelenke (Joints mit separaten Drehachsen)
// Vorderflügel Links
const pivotForeLeft = new Mesh("pivotForeLeft", sceneMesh);
pivotForeLeft.position.set(0.1, 0.28, 0.44);
pivotForeLeft.parent = rootDrone;

const forewingLeft = MeshBuilder.CreatePlane("forewingLeft", { width: 1.25, height: 0.55 }, sceneMesh);
forewingLeft.position.set(0.45, 0, 0); // Auslenkung vom Drehpunkt
forewingLeft.rotation.y = 0.2;
forewingLeft.material = matHoloWing;
forewingLeft.parent = pivotForeLeft;

// Vorderflügel Rechts
const pivotForeRight = new Mesh("pivotForeRight", sceneMesh);
pivotForeRight.position.set(0.1, 0.28, -0.44);
pivotForeRight.parent = rootDrone;

const forewingRight = MeshBuilder.CreatePlane("forewingRight", { width: 1.25, height: 0.55 }, sceneMesh);
forewingRight.position.set(0.45, 0, 0);
forewingRight.rotation.y = -0.2;
forewingRight.material = matHoloWing;
forewingRight.parent = pivotForeRight;

// Hinterflügel Links
const pivotHindLeft = new Mesh("pivotHindLeft", sceneMesh);
pivotHindLeft.position.set(-0.3, 0.22, 0.46);
pivotHindLeft.parent = rootDrone;

const hindwingLeft = MeshBuilder.CreatePlane("hindwingLeft", { width: 1.0, height: 0.45 }, sceneMesh);
hindwingLeft.position.set(0.35, 0, 0);
hindwingLeft.rotation.y = 0.35;
hindwingLeft.material = matHoloWing;
hindwingLeft.parent = pivotHindLeft;

// Hinterflügel Rechts
const pivotHindRight = new Mesh("pivotHindRight", sceneMesh);
pivotHindRight.position.set(-0.3, 0.22, -0.46);
pivotHindRight.parent = rootDrone;

const hindwingRight = MeshBuilder.CreatePlane("hindwingRight", { width: 1.0, height: 0.45 }, sceneMesh);
hindwingRight.position.set(0.35, 0, 0);
hindwingRight.rotation.y = -0.35;
hindwingRight.material = matHoloWing;
hindwingRight.parent = pivotHindRight;

// --- Gelenk-Inspektor Hilfsachsen (AxesViewer) ---
const axesPivots = [pivotForeLeft, pivotForeRight, pivotHindLeft, pivotHindRight];
const axesViewers: AxesViewer[] = [];

axesPivots.forEach((pivot) => {
  const viewer = new AxesViewer(sceneMesh, 0.6);
  viewer.xAxis.parent = pivot;
  viewer.yAxis.parent = pivot;
  viewer.zAxis.parent = pivot;
  viewer.xAxis.setEnabled(false);
  viewer.yAxis.setEnabled(false);
  viewer.zAxis.setEnabled(false);
  axesViewers.push(viewer);
});

/* ==========================================================
   3. ANIMATIONS- & RENDER-LOOP
   ========================================================== */
let oscAngle = 0;

engineConcept.runRenderLoop(() => {
  if (autoRotate) {
    oscAngle += 0.018;
    // Oszillierendes Parallaxe-Kippen nach links und rechts
    badgeGroup.rotation.y = Math.sin(oscAngle) * 0.45;
    badgeGroup.rotation.x = Math.cos(oscAngle * 0.5) * 0.15;
  }
  sceneConcept.render();
});

engineMesh.runRenderLoop(() => {
  const deltaSec = engineMesh.getDeltaTime() / 1000;

  // Synchrone Drehung
  if (syncRotation && autoRotate) {
    rootDrone.rotation.y = badgeGroup.rotation.y;
    rootDrone.rotation.x = badgeGroup.rotation.x;
  } else if (autoRotate) {
    rootDrone.rotation.y += 0.01;
  }

  // 4-Flügel-Kinematik (Gegen-Oszillation)
  if (animationActive) {
    wingPhase += deltaSec * 22; // Rasante Cyber-Frequenz
    const flap = Math.sin(wingPhase) * 0.65;
    const hindFlap = Math.sin(wingPhase - 0.4) * 0.55;

    pivotForeLeft.rotation.x = 0.2 + flap;
    pivotForeRight.rotation.x = -0.2 - flap;
    pivotHindLeft.rotation.x = 0.25 + hindFlap;
    pivotHindRight.rotation.x = -0.25 - hindFlap;

    // Düsen-Plasma flackert
    const flicker = 0.9 + Math.random() * 0.25;
    flameL.scaling.x = flicker;
    flameR.scaling.x = flicker;
  }

  // Explosions-Ansicht (Bauteile fahren sanft auseinander)
  const explodeOffset = explodedView ? 0.45 : 0.0;
  carapaceFront.position.y += (0.24 + explodeOffset * 0.8 - carapaceFront.position.y) * 0.1;
  carapaceRear.position.y += (0.2 + explodeOffset * 0.8 - carapaceRear.position.y) * 0.1;
  thrusterL.position.z += (0.32 + explodeOffset * 0.6 - thrusterL.position.z) * 0.1;
  thrusterR.position.z += (-0.32 - explodeOffset * 0.6 - thrusterR.position.z) * 0.1;
  pivotForeLeft.position.z += (0.44 + explodeOffset * 0.7 - pivotForeLeft.position.z) * 0.1;
  pivotForeRight.position.z += (-0.44 - explodeOffset * 0.7 - pivotForeRight.position.z) * 0.1;

  sceneMesh.render();
});

// Resize Listener
window.addEventListener("resize", () => {
  engineConcept.resize();
  engineMesh.resize();
});

/* ==========================================================
   4. UI-CONTROLS & INTERAKTIVITÄT
   ========================================================== */
const paneConcept = document.getElementById("pane-concept") as HTMLDivElement;
const paneMesh = document.getElementById("pane-mesh") as HTMLDivElement;
const btnViewSplit = document.getElementById("btn-view-split") as HTMLButtonElement;
const btnViewConcept = document.getElementById("btn-view-concept") as HTMLButtonElement;
const btnViewMesh = document.getElementById("btn-view-mesh") as HTMLButtonElement;

btnViewSplit.addEventListener("click", () => {
  paneConcept.style.display = "flex";
  paneMesh.style.display = "flex";
  btnViewSplit.classList.add("active");
  btnViewConcept.classList.remove("active");
  btnViewMesh.classList.remove("active");
  engineConcept.resize();
  engineMesh.resize();
});

btnViewConcept.addEventListener("click", () => {
  paneConcept.style.display = "flex";
  paneMesh.style.display = "none";
  btnViewSplit.classList.remove("active");
  btnViewConcept.classList.add("active");
  btnViewMesh.classList.remove("active");
  engineConcept.resize();
});

btnViewMesh.addEventListener("click", () => {
  paneConcept.style.display = "none";
  paneMesh.style.display = "flex";
  btnViewSplit.classList.remove("active");
  btnViewConcept.classList.remove("active");
  btnViewMesh.classList.add("active");
  engineMesh.resize();
});

// Checkboxen
const toggleRotate = document.getElementById("toggle-rotate") as HTMLInputElement;
toggleRotate.addEventListener("change", (e) => {
  autoRotate = (e.target as HTMLInputElement).checked;
});

const toggleSync = document.getElementById("toggle-sync") as HTMLInputElement;
toggleSync.addEventListener("change", (e) => {
  syncRotation = (e.target as HTMLInputElement).checked;
});

const toggleWireframe = document.getElementById("toggle-wireframe") as HTMLInputElement;
toggleWireframe.addEventListener("change", (e) => {
  wireframeMode = (e.target as HTMLInputElement).checked;
  all3DMaterials.forEach((mat) => {
    mat.wireframe = wireframeMode;
  });
});

const toggleJoints = document.getElementById("toggle-joints") as HTMLInputElement;
toggleJoints.addEventListener("change", (e) => {
  jointsVisible = (e.target as HTMLInputElement).checked;
  axesViewers.forEach((viewer) => {
    viewer.xAxis.setEnabled(jointsVisible);
    viewer.yAxis.setEnabled(jointsVisible);
    viewer.zAxis.setEnabled(jointsVisible);
  });
});

const toggleAnim = document.getElementById("toggle-anim") as HTMLInputElement;
toggleAnim.addEventListener("change", (e) => {
  animationActive = (e.target as HTMLInputElement).checked;
});

const toggleExplode = document.getElementById("toggle-explode") as HTMLInputElement;
toggleExplode.addEventListener("change", (e) => {
  explodedView = (e.target as HTMLInputElement).checked;
});

// Modal
const modal = document.getElementById("didactic-modal") as HTMLDivElement;
const btnOpenModal = document.getElementById("btn-didactic-modal") as HTMLButtonElement;
const btnCloseModal = document.getElementById("btn-close-modal") as HTMLButtonElement;

btnOpenModal.addEventListener("click", () => modal.classList.remove("hidden"));
btnCloseModal.addEventListener("click", () => modal.classList.add("hidden"));
modal.addEventListener("click", (e) => {
  if (e.target === modal) modal.classList.add("hidden");
});
