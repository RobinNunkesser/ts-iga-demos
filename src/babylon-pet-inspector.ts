import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  SceneLoader,
  AnimationGroup,
  AbstractMesh,
  DefaultRenderingPipeline,
  Skeleton,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

// 1. Definition aller 24 Kenney Cube-Pets
export interface PetItem {
  id: string;
  name: string;
  file: string;
  emoji: string;
}

export const CUBE_PETS: PetItem[] = [
  { id: "dog", name: "Hund", file: "animal-dog.glb", emoji: "🐶" },
  { id: "cat", name: "Katze", file: "animal-cat.glb", emoji: "🐱" },
  { id: "bunny", name: "Hase", file: "animal-bunny.glb", emoji: "🐰" },
  { id: "chick", name: "Küken", file: "animal-chick.glb", emoji: "🐥" },
  { id: "bear_polar", name: "Eisbär", file: "animal-polar.glb", emoji: "🐻‍❄️" },
  { id: "beaver", name: "Biber", file: "animal-beaver.glb", emoji: "🦫" },
  { id: "bee", name: "Biene", file: "animal-bee.glb", emoji: "🐝" },
  { id: "caterpillar", name: "Raupe", file: "animal-caterpillar.glb", emoji: "🐛" },
  { id: "cow", name: "Kuh", file: "animal-cow.glb", emoji: "🐮" },
  { id: "crab", name: "Krabbe", file: "animal-crab.glb", emoji: "🦀" },
  { id: "deer", name: "Hirsch", file: "animal-deer.glb", emoji: "🦌" },
  { id: "elephant", name: "Elefant", file: "animal-elephant.glb", emoji: "🐘" },
  { id: "fish", name: "Fisch", file: "animal-fish.glb", emoji: "🐟" },
  { id: "fox", name: "Fuchs", file: "animal-fox.glb", emoji: "🦊" },
  { id: "giraffe", name: "Giraffe", file: "animal-giraffe.glb", emoji: "🦒" },
  { id: "hog", name: "Wildschwein", file: "animal-hog.glb", emoji: "🐗" },
  { id: "koala", name: "Koala", file: "animal-koala.glb", emoji: "🐨" },
  { id: "lion", name: "Löwe", file: "animal-lion.glb", emoji: "🦁" },
  { id: "monkey", name: "Affe", file: "animal-monkey.glb", emoji: "🐵" },
  { id: "panda", name: "Panda", file: "animal-panda.glb", emoji: "🐼" },
  { id: "parrot", name: "Papagei", file: "animal-parrot.glb", emoji: "🦜" },
  { id: "penguin", name: "Pinguin", file: "animal-penguin.glb", emoji: "🐧" },
  { id: "pig", name: "Schwein", file: "animal-pig.glb", emoji: "🐷" },
  { id: "tiger", name: "Tiger", file: "animal-tiger.glb", emoji: "🐯" },
];

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("renderCanvas element missing");

// 2. Engine mit nativer Retina / High-DPI-Auflösung
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  adaptToDeviceRatio: true,
  antialias: true,
});
engine.setHardwareScalingLevel(1.0 / Math.min(window.devicePixelRatio || 1, 2));

const scene = new Scene(engine);
scene.clearColor = new Color4(0.06, 0.09, 0.16, 1.0); // Modernes Studio Dark (#0f172a)

// 3. Orbit-Kamera mit Standard-Inspektionswinkel
const DEFAULT_ALPHA = -Math.PI / 2.5;
const DEFAULT_BETA = Math.PI / 2.7;
const DEFAULT_RADIUS = 4.2;

const camera = new ArcRotateCamera(
  "inspectorCam",
  DEFAULT_ALPHA,
  DEFAULT_BETA,
  DEFAULT_RADIUS,
  new Vector3(0, 0.85, 0),
  scene
);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 1.5;
camera.upperRadiusLimit = 10.0;
camera.lowerBetaLimit = 0.1;
camera.upperBetaLimit = Math.PI / 2.02; // Nicht unter die Sockelplatte
camera.wheelPrecision = 30;

// 4. Dreipunkt-Studiobeleuchtung
const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.diffuse = new Color3(0.9, 0.95, 1.0);
hemi.groundColor = new Color3(0.1, 0.15, 0.25);
hemi.intensity = 0.85;

const keyLight = new DirectionalLight("keyLight", new Vector3(-1, -2, 1), scene);
keyLight.diffuse = new Color3(1.0, 0.96, 0.88);
keyLight.intensity = 1.2;

const rimLight = new DirectionalLight("rimLight", new Vector3(1.5, 1, -2), scene);
rimLight.diffuse = new Color3(0.4, 0.7, 1.0);
rimLight.intensity = 0.6;

// Anti-Aliasing Rendering Pipeline
const pipeline = new DefaultRenderingPipeline("pipeline", true, scene, [camera]);
pipeline.samples = 4;
pipeline.fxaaEnabled = true;

// 5. Stylisher Studio-Sockel (Pedestal)
const pedestal = MeshBuilder.CreateCylinder(
  "pedestal",
  { diameter: 2.8, height: 0.12, tessellation: 64 },
  scene
);
pedestal.position.y = -0.06;

const pedestalMat = new StandardMaterial("pedestalMat", scene);
pedestalMat.diffuseColor = new Color3(0.12, 0.18, 0.28);
pedestalMat.specularColor = new Color3(0.3, 0.45, 0.6);
pedestalMat.specularPower = 32;
pedestal.material = pedestalMat;

// Zarter Bodenkreis als Orientierungsraster
const groundRing = MeshBuilder.CreateTorus(
  "groundRing",
  { diameter: 2.9, thickness: 0.02, tessellation: 64 },
  scene
);
groundRing.position.y = 0.001;
const ringMat = new StandardMaterial("ringMat", scene);
ringMat.diffuseColor = new Color3(0.2, 0.7, 0.95);
ringMat.emissiveColor = new Color3(0.1, 0.4, 0.6);
groundRing.material = ringMat;

// 6. State & Helper
let currentMeshes: AbstractMesh[] = [];
let currentAnimGroups: AnimationGroup[] = [];
let currentSkeletons: Skeleton[] = [];
let activePetId = "dog";
let isWireframe = false;
let isAutoRotating = true;

function getAssetPath(subpath: string): string {
  const isDemoSubdir = window.location.pathname.includes("/demos/");
  const rel = isDemoSubdir ? "../../" : "./";
  return new URL(`${rel}assets/models/${subpath}`, window.location.href).href;
}

// 7. UI-Elemente referenzieren
const petSelect = document.getElementById("pet-select") as HTMLSelectElement;
const btnWireframe = document.getElementById("btn-wireframe") as HTMLButtonElement;
const btnAutoRotate = document.getElementById("btn-autorotate") as HTMLButtonElement;
const btnResetCam = document.getElementById("btn-reset-cam") as HTMLButtonElement;
const metricStatus = document.getElementById("metric-status") as HTMLDivElement;
const animButtonsContainer = document.getElementById("anim-buttons") as HTMLDivElement;

const assetInspector = document.getElementById("asset-inspector") as HTMLDivElement;
const infoHeader = document.getElementById("info-header") as HTMLDivElement;
const btnToggleInfo = document.getElementById("btn-toggle-info") as HTMLButtonElement;
const toggleInfoIcon = document.getElementById("toggle-info-icon") as HTMLSpanElement;

const infoPetTitle = document.getElementById("info-pet-title") as HTMLElement;
const infoPetFilename = document.getElementById("info-pet-filename") as HTMLElement;
const infoTriangles = document.getElementById("info-triangles") as HTMLElement;
const infoVertices = document.getElementById("info-vertices") as HTMLElement;
const infoBones = document.getElementById("info-bones") as HTMLElement;
const infoAnimCount = document.getElementById("info-anim-count") as HTMLElement;
const infoCurrentAnim = document.getElementById("info-current-anim") as HTMLElement;

// Info-Card ein-/ausklappen (auf Smartphones standardmäßig eingeklappt)
function setInfoCollapsed(collapsed: boolean) {
  if (collapsed) {
    assetInspector.classList.add("collapsed");
    if (toggleInfoIcon) toggleInfoIcon.textContent = "▼";
  } else {
    assetInspector.classList.remove("collapsed");
    if (toggleInfoIcon) toggleInfoIcon.textContent = "▲";
  }
}

// Initialer Check: Auf Bildschirmen <= 640px einklappen, um das Modell nicht zu verdecken
const isMobileScreen = window.innerWidth <= 640 || window.innerHeight <= 640;
setInfoCollapsed(isMobileScreen);

if (infoHeader) {
  infoHeader.addEventListener("click", () => {
    const isCollapsed = assetInspector.classList.contains("collapsed");
    setInfoCollapsed(!isCollapsed);
  });
}

if (btnToggleInfo) {
  btnToggleInfo.addEventListener("click", (e) => {
    e.stopPropagation();
    const isCollapsed = assetInspector.classList.contains("collapsed");
    setInfoCollapsed(!isCollapsed);
  });
}

// Dropdown initial befüllen
function populatePetDropdown() {
  petSelect.innerHTML = "";
  CUBE_PETS.forEach((pet) => {
    const opt = document.createElement("option");
    opt.value = pet.id;
    opt.textContent = `${pet.emoji} ${pet.name} (${pet.file})`;
    if (pet.id === activePetId) opt.selected = true;
    petSelect.appendChild(opt);
  });

  petSelect.addEventListener("change", () => {
    loadPetModel(petSelect.value);
  });
}

// 8. Modell asynchron laden und einpassen
async function loadPetModel(petId: string) {
  const pet = CUBE_PETS.find((p) => p.id === petId) || CUBE_PETS[0];
  activePetId = pet.id;
  petSelect.value = pet.id;

  metricStatus.textContent = `Lade ${pet.name}...`;

  // Altes Modell sauber aufräumen
  currentAnimGroups.forEach((ag) => {
    ag.stop();
    ag.dispose();
  });
  currentAnimGroups = [];

  currentMeshes.forEach((m) => m.dispose());
  currentMeshes = [];

  currentSkeletons.forEach((s) => s.dispose());
  currentSkeletons = [];

  try {
    const res = await SceneLoader.ImportMeshAsync(
      "",
      getAssetPath("pets/"),
      pet.file,
      scene
    );

    currentMeshes = res.meshes;
    currentAnimGroups = res.animationGroups;
    currentSkeletons = res.skeletons;

    const root = res.meshes[0];
    root.name = `pet_root_${pet.id}`;
    root.rotationQuaternion = null;

    // Automatisches Einpassen und Zentrieren in Großansicht
    const bounding = root.getHierarchyBoundingVectors(true);
    const size = bounding.max.subtract(bounding.min);
    const maxDim = Math.max(size.x, size.y, size.z);
    const targetHeight = 1.9; // Prächtige Großdarstellung im Studio
    const scale = maxDim > 0 ? targetHeight / maxDim : 1.0;

    root.scaling.setAll(scale);
    root.position.x = 0;
    root.position.z = 0;
    root.position.y = -bounding.min.y * scale; // Exakt auf dem Sockel aufsetzen

    // Wireframe-Status anwenden
    applyWireframeMode(isWireframe);

    // Statistiken ermitteln
    let totalVertices = 0;
    let totalTriangles = 0;
    for (const m of res.meshes) {
      totalVertices += m.getTotalVertices();
      totalTriangles += m.getTotalIndices() / 3;
    }

    let totalBones = 0;
    if (res.skeletons.length > 0) {
      totalBones = res.skeletons.reduce((acc, s) => acc + s.bones.length, 0);
    }

    // UI-Statistiken aktualisieren
    infoPetTitle.textContent = `${pet.emoji} ${pet.name}`;
    infoPetFilename.textContent = `(${pet.file})`;
    infoTriangles.textContent = Math.round(totalTriangles).toLocaleString("de-DE");
    infoVertices.textContent = Math.round(totalVertices).toLocaleString("de-DE");
    infoBones.textContent = totalBones > 0 ? `${totalBones} Bones` : "Keine";
    infoAnimCount.textContent = `${res.animationGroups.length} Clips`;

    // Animations-Buttons neu aufbauen
    setupAnimationControls();

    metricStatus.textContent = `Bereit (${pet.name})`;
  } catch (err) {
    console.error("Fehler beim Laden des Modells:", err);
    metricStatus.textContent = `Fehler: ${pet.file}`;
  }
}

// 9. Wireframe-Umschaltung
function applyWireframeMode(enabled: boolean) {
  isWireframe = enabled;
  for (const m of currentMeshes) {
    if (m.material) {
      m.material.wireframe = enabled;
    }
  }

  btnWireframe.textContent = enabled ? "🌐 Wireframe: AN" : "🌐 Wireframe: AUS";
  if (enabled) {
    btnWireframe.classList.add("btn-wireframe-active");
  } else {
    btnWireframe.classList.remove("btn-wireframe-active");
  }
}

btnWireframe.addEventListener("click", () => {
  applyWireframeMode(!isWireframe);
});

// 10. Auto-Rotate & Reset Cam
btnAutoRotate.addEventListener("click", () => {
  isAutoRotating = !isAutoRotating;
  btnAutoRotate.textContent = isAutoRotating ? "🔄 Auto-Rotate: AN" : "🔄 Auto-Rotate: AUS";
  if (isAutoRotating) {
    btnAutoRotate.classList.add("btn-wireframe-active");
  } else {
    btnAutoRotate.classList.remove("btn-wireframe-active");
  }
});

btnResetCam.addEventListener("click", () => {
  camera.alpha = DEFAULT_ALPHA;
  camera.beta = DEFAULT_BETA;
  camera.radius = DEFAULT_RADIUS;
  camera.target = new Vector3(0, 0.85, 0);
});

// 11. Dynamische Animationssteuerung
function setupAnimationControls() {
  animButtonsContainer.innerHTML = "";

  if (currentAnimGroups.length === 0) {
    const noAnim = document.createElement("span");
    noAnim.style.fontSize = "0.8rem";
    noAnim.style.color = "var(--text-muted)";
    noAnim.textContent = "Keine Skelett-Animationen im Modell hinterlegt.";
    animButtonsContainer.appendChild(noAnim);
    infoCurrentAnim.innerHTML = `Aktiv: <em>Keine</em>`;
    return;
  }

  // Für jede Animation einen Button erzeugen
  let initialAnimToPlay: AnimationGroup | null = null;

  currentAnimGroups.forEach((ag) => {
    const rawName = ag.name.toLowerCase();
    const btn = document.createElement("button");
    btn.className = "btn-action btn-anim";
    btn.dataset.anim = rawName;

    // Hübsches Emoji-Icon je nach Animationsname
    let icon = "🎬";
    if (rawName.includes("walk")) icon = "🚶";
    else if (rawName.includes("run")) icon = "🏃";
    else if (rawName.includes("dance")) icon = "🕺";
    else if (rawName.includes("eat")) icon = "🥕";
    else if (rawName.includes("idle")) icon = "💤";
    else if (rawName.includes("jump") || rawName.includes("bounce")) icon = "🦘";
    else if (rawName.includes("death") || rawName.includes("hit")) icon = "💥";

    btn.textContent = `${icon} ${capitalize(rawName)}`;

    btn.addEventListener("click", () => {
      playAnimation(rawName);
    });

    animButtonsContainer.appendChild(btn);

    // Standard-Animation ermitteln: bevorzugt 'walk', alternativ 'idle' oder erste
    if (rawName.includes("walk") && !initialAnimToPlay) {
      initialAnimToPlay = ag;
    } else if (rawName.includes("idle") && !initialAnimToPlay) {
      initialAnimToPlay = ag;
    }
  });

  if (!initialAnimToPlay && currentAnimGroups.length > 0) {
    initialAnimToPlay = currentAnimGroups[0];
  }

  // Statischer T-Pose-Button hinzufügen
  const staticBtn = document.createElement("button");
  staticBtn.className = "btn-action btn-anim";
  staticBtn.dataset.anim = "static";
  staticBtn.style.background = "rgba(15, 23, 42, 0.9)";
  staticBtn.style.borderColor = "#64748b";
  staticBtn.textContent = "🛑 T-Pose (Static)";
  staticBtn.addEventListener("click", () => {
    playAnimation("static");
  });
  animButtonsContainer.appendChild(staticBtn);

  if (initialAnimToPlay) {
    playAnimation(initialAnimToPlay.name.toLowerCase());
  } else {
    playAnimation("static");
  }
}

function playAnimation(animName: string) {
  // Alle Animationen stoppen
  currentAnimGroups.forEach((ag) => ag.stop());

  // Button-Status aktualisieren
  const buttons = animButtonsContainer.querySelectorAll(".btn-anim");
  buttons.forEach((b) => {
    if ((b as HTMLElement).dataset.anim === animName) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });

  if (animName === "static") {
    infoCurrentAnim.innerHTML = `Aktiv: <strong style="color: #94a3b8;">T-Pose (Pausiert)</strong>`;
    return;
  }

  const targetAg = currentAnimGroups.find(
    (ag) => ag.name.toLowerCase() === animName
  );

  if (targetAg) {
    targetAg.start(true); // Loop
    infoCurrentAnim.innerHTML = `Aktiv: <strong style="color: #38bdf8;">${targetAg.name}</strong> (${targetAg.to.toFixed(0)} Frames)`;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// 12. Responsive Kamera-Anpassung für Smartphones
function updateCameraViewport() {
  const width = engine.getRenderWidth();
  const height = Math.max(1, engine.getRenderHeight());
  const aspect = width / height;

  if (aspect < 0.8) {
    // Smartphone Portrait: Etwas mehr Abstand & leicht erhöhter Fokus
    camera.radius = DEFAULT_RADIUS * 1.35;
    camera.target.y = 0.95;
  } else if (aspect < 1.1) {
    camera.radius = DEFAULT_RADIUS * 1.15;
    camera.target.y = 0.9;
  } else {
    camera.radius = DEFAULT_RADIUS;
    camera.target.y = 0.85;
  }
}

// 13. Render-Loop mit sanfter Drehung
scene.onBeforeRenderObservable.add(() => {
  if (isAutoRotating) {
    camera.alpha += 0.006;
  }
});

engine.runRenderLoop(() => {
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
  updateCameraViewport();
});

// Initialisierung
populatePetDropdown();
loadPetModel(activePetId);
updateCameraViewport();
