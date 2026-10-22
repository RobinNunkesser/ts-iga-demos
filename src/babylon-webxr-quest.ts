import {
  Engine,
  Scene,
  ArcRotateCamera,
  Vector3,
  HemisphericLight,
  PointLight,
  DirectionalLight,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  SceneLoader,
  AnimationGroup,
  AbstractMesh,
  WebXRState,
  ParticleSystem,
  Texture,
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import {
  AdvancedDynamicTexture,
  StackPanel,
  Button,
  TextBlock,
} from "@babylonjs/gui";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("renderCanvas element missing");

// 1. Babylon.js Engine & Scene
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  adaptToDeviceRatio: true,
  antialias: true,
});
engine.setHardwareScalingLevel(1.0 / Math.min(window.devicePixelRatio || 1, 2));

const scene = new Scene(engine);
scene.clearColor = new Color4(0.45, 0.65, 0.85, 1.0);

// 2. Desktop Fallback Camera (ArcRotate)
const desktopCamera = new ArcRotateCamera(
  "desktopCam",
  -Math.PI / 2.2,
  Math.PI / 2.8,
  12,
  new Vector3(0, 1.2, 0),
  scene
);
desktopCamera.attachControl(canvas, true);
desktopCamera.lowerRadiusLimit = 2;
desktopCamera.upperRadiusLimit = 25;
desktopCamera.wheelPrecision = 20;

// 3. Beleuchtung
const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
hemiLight.intensity = 0.55;
hemiLight.groundColor = new Color3(0.2, 0.25, 0.2);

const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
dirLight.position = new Vector3(10, 20, 10);
dirLight.intensity = 0.85;

// Fackel-Licht im Innenhof
const torchLight = new PointLight("torchLight", new Vector3(0, 2.0, 0), scene);
torchLight.diffuse = new Color3(1.0, 0.65, 0.2);
torchLight.intensity = 1.2;
torchLight.range = 10;

// 4. Boden & begehbare Plattform (für Teleportation)
const ground = MeshBuilder.CreateCylinder(
  "walkableGround",
  { diameter: 22, height: 0.4, tessellation: 48 },
  scene
);
ground.position.y = -0.2;
const groundMat = new StandardMaterial("groundMat", scene);
groundMat.diffuseColor = new Color3(0.35, 0.45, 0.3); // Stylized Grasgrün
groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
ground.material = groundMat;
ground.isPickable = true;

// Gepflasterter Altar-/Dungeonbereich in der Mitte
const courtyard = MeshBuilder.CreateBox("courtyard", { width: 8, depth: 8, height: 0.1 }, scene);
courtyard.position.y = 0.05;
const courtMat = new StandardMaterial("courtMat", scene);
courtMat.diffuseColor = new Color3(0.4, 0.42, 0.45); // Steinpflaster
courtMat.specularColor = new Color3(0.1, 0.1, 0.1);
courtyard.material = courtMat;
courtyard.isPickable = true;

// 5. Kenney 3D-Assets laden (Mini-Dungeon & Forest)
const assetBase = "./assets/models/";

// Hilfsfunktion zum Laden von Meshes
async function loadModel(
  url: string,
  pos: Vector3,
  scale = 1.0,
  rotY = 0
): Promise<AbstractMesh | null> {
  try {
    const res = await SceneLoader.ImportMeshAsync("", "", url, scene);
    const root = res.meshes[0];
    root.position = pos;
    root.scaling = Vector3.One().scale(scale);
    root.rotation.y = rotY;
    return root;
  } catch (err) {
    console.warn("Could not load asset:", url, err);
    return null;
  }
}

// Umgebung mit Kenney-Assets aufbauen
async function buildEnvironment() {
  // Steintisch / Sockel in der Mitte
  const table = MeshBuilder.CreateCylinder("altar", { diameter: 2.2, height: 0.8 }, scene);
  table.position = new Vector3(0, 0.4, 0);
  const tableMat = new StandardMaterial("altarMat", scene);
  tableMat.diffuseColor = new Color3(0.5, 0.52, 0.55);
  table.material = tableMat;

  // Dungeon-Wände am Rand des Pflasters
  loadModel(`${assetBase}dungeon/wall.glb`, new Vector3(-4, 0, -4), 1.6, 0);
  loadModel(`${assetBase}dungeon/wall.glb`, new Vector3(0, 0, -4), 1.6, 0);
  loadModel(`${assetBase}dungeon/wall.glb`, new Vector3(4, 0, -4), 1.6, 0);
  loadModel(`${assetBase}dungeon/wall.glb`, new Vector3(-4, 0, 4), 1.6, Math.PI);
  loadModel(`${assetBase}dungeon/wall.glb`, new Vector3(4, 0, 4), 1.6, Math.PI);

  // Fässer und Töpfe
  loadModel(`${assetBase}dungeon/barrel.glb`, new Vector3(-3, 0.05, -3.2), 1.8);
  loadModel(`${assetBase}dungeon/barrel.glb`, new Vector3(-2.3, 0.05, -3.4), 1.5);
  loadModel(`${assetBase}dungeon/pot.glb`, new Vector3(3.2, 0.05, -3.2), 1.8);

  // Bäume und Felsen außerhalb
  loadModel(`${assetBase}forest/tree.glb`, new Vector3(-7, 0, -5), 1.4);
  loadModel(`${assetBase}forest/tree-high.glb`, new Vector3(6, 0, 6), 1.2);
  loadModel(`${assetBase}forest/tree.glb`, new Vector3(-6, 0, 5), 1.3);
  loadModel(`${assetBase}forest/rocks-high.glb`, new Vector3(7, 0, -4), 1.5);
  loadModel(`${assetBase}forest/fence.glb`, new Vector3(5, 0, 0), 1.5, Math.PI / 2);
}

// 6. Interaktive Items auf dem Sockel
interface InteractiveItem {
  mesh: AbstractMesh;
  initialY: number;
  spinning: boolean;
}
const items: InteractiveItem[] = [];

async function setupInteractiveItems() {
  const itemConfigs = [
    { url: `${assetBase}dungeon/weapon-sword.glb`, pos: new Vector3(-0.6, 0.85, 0), scale: 1.2 },
    { url: `${assetBase}dungeon/shield-round.glb`, pos: new Vector3(0.6, 0.85, 0), scale: 1.3 },
    { url: `${assetBase}dungeon/potion.glb`, pos: new Vector3(0, 0.85, 0.6), scale: 1.5 },
    { url: `${assetBase}dungeon/coin.glb`, pos: new Vector3(0, 0.85, -0.6), scale: 1.8 },
  ];

  for (const cfg of itemConfigs) {
    const mesh = await loadModel(cfg.url, cfg.pos, cfg.scale);
    if (!mesh) continue;

    // Klickbar machen
    for (const child of mesh.getChildMeshes()) {
      child.isPickable = true;
    }

    const item: InteractiveItem = {
      mesh,
      initialY: cfg.pos.y,
      spinning: false,
    };
    items.push(item);
  }

  // Bei Klick mit Laserpointer oder Maus: Item anheben und rotieren
  scene.onPointerDown = (_evt, pickInfo) => {
    if (pickInfo.hit && pickInfo.pickedMesh) {
      for (const item of items) {
        if (
          pickInfo.pickedMesh === item.mesh ||
          item.mesh.getChildMeshes().includes(pickInfo.pickedMesh)
        ) {
          item.spinning = !item.spinning;
          triggerItemSparkles(item.mesh.position);
          break;
        }
      }
    }
  };
}

// Partikel-Effekt bei Interaktion
function triggerItemSparkles(pos: Vector3) {
  const particleSystem = new ParticleSystem("sparkles", 60, scene);
  particleSystem.particleTexture = new Texture(
    "https://playground.babylonjs.com/textures/flare.png",
    scene
  );
  particleSystem.emitter = pos.clone().add(new Vector3(0, 0.3, 0));
  particleSystem.minEmitBox = new Vector3(-0.2, 0, -0.2);
  particleSystem.maxEmitBox = new Vector3(0.2, 0.2, 0.2);
  particleSystem.color1 = new Color4(1, 0.8, 0.2, 1);
  particleSystem.color2 = new Color4(0.2, 0.9, 1, 1);
  particleSystem.minSize = 0.05;
  particleSystem.maxSize = 0.15;
  particleSystem.minLifeTime = 0.3;
  particleSystem.maxLifeTime = 0.8;
  particleSystem.emitRate = 120;
  particleSystem.gravity = new Vector3(0, -2, 0);
  particleSystem.targetStopDuration = 0.4;
  particleSystem.start();
}

// 7. Animierter Charakter / Pet
let currentPetRoot: AbstractMesh | null = null;
let currentAnimGroups: AnimationGroup[] = [];

async function loadPet(petName: string) {
  if (currentPetRoot) {
    currentPetRoot.dispose();
    currentPetRoot = null;
  }
  currentAnimGroups.forEach((ag) => ag.stop());
  currentAnimGroups = [];

  const url = `${assetBase}pets/${petName}.glb`;
  try {
    const res = await SceneLoader.ImportMeshAsync("", "", url, scene);
    currentPetRoot = res.meshes[0];
    currentPetRoot.position = new Vector3(2.2, 0.05, 1.5);
    currentPetRoot.rotation.y = -Math.PI / 1.3;
    currentPetRoot.scaling = Vector3.One().scale(1.2);

    currentAnimGroups = res.animationGroups;
    playPetAnimation("idle");
  } catch (e) {
    console.warn("Could not load pet:", petName, e);
  }
}

function playPetAnimation(animName: string) {
  if (!currentAnimGroups.length) return;
  const target = currentAnimGroups.find((ag) =>
    ag.name.toLowerCase().includes(animName.toLowerCase())
  );
  currentAnimGroups.forEach((ag) => ag.stop());
  if (target) {
    target.start(true);
  } else if (currentAnimGroups[0]) {
    currentAnimGroups[0].start(true);
  }
}

// 8. Schwebendes 3D-VR-Hologramm-Panel (Babylon.js GUI)
function createFloating3DGui() {
  const panelMesh = MeshBuilder.CreatePlane("vrGuiPlane", { width: 1.8, height: 1.2 }, scene);
  panelMesh.position = new Vector3(0, 1.7, -1.8);
  panelMesh.rotation.y = Math.PI; // Blickrichtung zum Spieler (Zentrum)

  const advancedTexture = AdvancedDynamicTexture.CreateForMesh(panelMesh, 1024, 680);

  const stack = new StackPanel();
  stack.width = "90%";
  advancedTexture.addControl(stack);

  const title = new TextBlock();
  title.text = "🥽 Meta Quest 3 WebXR";
  title.height = "70px";
  title.color = "#38bdf8";
  title.fontSize = 42;
  title.fontStyle = "bold";
  stack.addControl(title);

  const subtitle = new TextBlock();
  subtitle.text = "Kenney 3D Playground • Mit Laserpointer bedienbar";
  subtitle.height = "45px";
  subtitle.color = "#94a3b8";
  subtitle.fontSize = 24;
  stack.addControl(subtitle);

  // Button: Haustier wechseln
  let petIndex = 0;
  const petNames = ["dog", "dragon", "chick"];
  const petBtn = Button.CreateSimpleButton("petBtn", "🐾 Haustier: Hund");
  petBtn.height = "80px";
  petBtn.color = "#ffffff";
  petBtn.background = "#0284c7";
  petBtn.fontSize = 30;
  petBtn.cornerRadius = 14;
  petBtn.paddingTop = "10px";
  petBtn.onPointerClickObservable.add(() => {
    petIndex = (petIndex + 1) % petNames.length;
    const name = petNames[petIndex];
    petBtn.textBlock!.text = `🐾 Haustier: ${name.toUpperCase()}`;
    loadPet(name);
  });
  stack.addControl(petBtn);

  // Button: Tanzen
  let isDancing = false;
  const danceBtn = Button.CreateSimpleButton("danceBtn", "🕺 Tanzen lassen");
  danceBtn.height = "80px";
  danceBtn.color = "#ffffff";
  danceBtn.background = "#10b981";
  danceBtn.fontSize = 30;
  danceBtn.cornerRadius = 14;
  danceBtn.paddingTop = "10px";
  danceBtn.onPointerClickObservable.add(() => {
    isDancing = !isDancing;
    danceBtn.textBlock!.text = isDancing ? "🛑 Stopp (Idle)" : "🕺 Tanzen lassen";
    playPetAnimation(isDancing ? "dance" : "idle");
  });
  stack.addControl(danceBtn);

  // Button: Tag / Nacht
  let isNight = false;
  const timeBtn = Button.CreateSimpleButton("timeBtn", "🌙 Nachtmodus");
  timeBtn.height = "80px";
  timeBtn.color = "#ffffff";
  timeBtn.background = "#6366f1";
  timeBtn.fontSize = 30;
  timeBtn.cornerRadius = 14;
  timeBtn.paddingTop = "10px";
  timeBtn.onPointerClickObservable.add(() => {
    isNight = !isNight;
    toggleDayNight(isNight);
    timeBtn.textBlock!.text = isNight ? "☀️ Tagmodus" : "🌙 Nachtmodus";
  });
  stack.addControl(timeBtn);
}

function toggleDayNight(isNight: boolean) {
  if (isNight) {
    scene.clearColor = new Color4(0.05, 0.06, 0.12, 1.0);
    hemiLight.intensity = 0.15;
    dirLight.intensity = 0.2;
    torchLight.intensity = 3.0;
  } else {
    scene.clearColor = new Color4(0.45, 0.65, 0.85, 1.0);
    hemiLight.intensity = 0.55;
    dirLight.intensity = 0.85;
    torchLight.intensity = 1.2;
  }
}

// 9. WebXR Initialisierung für Meta Quest 3
async function setupWebXR() {
  const xrBadge = document.getElementById("xr-badge");
  const metricInfo = document.getElementById("metric-info");

  try {
    const isSupported =
      "xr" in navigator && (navigator as any).xr
        ? await (navigator as any).xr.isSessionSupported("immersive-vr")
        : false;
    if (isSupported) {
      if (xrBadge) {
        xrBadge.textContent = "WebXR bereit! Drücke 'VR'";
        xrBadge.className = "xr-status-badge xr-supported";
      }

      // Initialisiert WebXR mit Teleportation auf dem Boden und Controller-Laserpointern
      const xrHelper = await scene.createDefaultXRExperienceAsync({
        floorMeshes: [ground, courtyard],
        optionalFeatures: true, // Hand-Tracking & Quest 3 Extensions
      });

      // Statuswechsel beobachten
      xrHelper.baseExperience.onStateChangedObservable.add((state) => {
        if (state === WebXRState.IN_XR) {
          if (xrBadge) xrBadge.textContent = "VR Aktiv (Quest 3)";
          if (metricInfo) metricInfo.textContent = "VR Session läuft";
        } else if (state === WebXRState.NOT_IN_XR) {
          if (xrBadge) xrBadge.textContent = "WebXR bereit";
          if (metricInfo) metricInfo.textContent = "Desktop Modus";
        }
      });
    } else {
      if (xrBadge) {
        xrBadge.textContent = "Kein WebXR-Headset erkannt (Desktop)";
        xrBadge.className = "xr-status-badge xr-unsupported";
      }
      if (metricInfo) metricInfo.textContent = "Desktop Fallback aktiv";
    }
  } catch (err) {
    console.warn("WebXR error or unsupported:", err);
    if (xrBadge) {
      xrBadge.textContent = "WebXR nicht verfügbar";
      xrBadge.className = "xr-status-badge xr-unsupported";
    }
  }
}

// 10. 2D-Overlay Button-Events (für Desktop)
function setup2DButtons() {
  document.getElementById("btn-pet-dog")?.addEventListener("click", () => loadPet("dog"));
  document.getElementById("btn-pet-dragon")?.addEventListener("click", () => loadPet("dragon"));
  document.getElementById("btn-pet-chick")?.addEventListener("click", () => loadPet("chick"));

  let dancing = false;
  document.getElementById("btn-anim-dance")?.addEventListener("click", (e) => {
    dancing = !dancing;
    playPetAnimation(dancing ? "dance" : "idle");
    (e.target as HTMLElement).textContent = dancing ? "🛑 Idle" : "🕺 Tanzen";
  });

  let night = false;
  document.getElementById("btn-toggle-time")?.addEventListener("click", () => {
    night = !night;
    toggleDayNight(night);
  });
}

// Render-Loop
engine.runRenderLoop(() => {
  // Items animieren, die angeklickt wurden
  for (const item of items) {
    if (item.spinning) {
      item.mesh.rotation.y += 0.04;
      item.mesh.position.y = item.initialY + 0.2 + Math.sin(Date.now() * 0.005) * 0.08;
    } else {
      item.mesh.position.y = item.initialY;
    }
  }
  scene.render();
});

window.addEventListener("resize", () => {
  engine.resize();
});

// Start-Sequenz
async function start() {
  const metric = document.getElementById("metric-info");
  if (metric) metric.textContent = "Lade Kenney Assets...";

  await buildEnvironment();
  await setupInteractiveItems();
  await loadPet("dog");
  createFloating3DGui();
  setup2DButtons();

  await setupWebXR();

  if (metric) metric.textContent = "Bereit für Quest 3 & Desktop";
}

start();
