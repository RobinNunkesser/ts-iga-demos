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
} from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("renderCanvas element missing");

// 1. Engine mit nativer Retina / High-DPI-Auflösung
const engine = new Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true,
  adaptToDeviceRatio: true,
  antialias: true,
});
// hardwareScalingLevel = 1 / dpr schaltet von 1x auf echte Display-Auflösung um (gestochen scharf)
engine.setHardwareScalingLevel(1.0 / Math.min(window.devicePixelRatio || 1, 2));

const scene = new Scene(engine);
scene.clearColor = new Color4(0.48, 0.72, 0.92, 1.0); // Weicher Himmel

// 2. Kamera
const camera = new ArcRotateCamera(
  "cam",
  -Math.PI / 3,
  Math.PI / 3.4,
  20,
  new Vector3(0, 1, 0),
  scene
);
camera.attachControl(canvas, true);
camera.lowerRadiusLimit = 5;
camera.upperRadiusLimit = 35;
camera.lowerBetaLimit = 0.1;
camera.upperBetaLimit = Math.PI / 2.05; // Nicht unter den Boden blicken
camera.wheelPrecision = 20;

// 3. Licht (Sonnenlicht & Sky-Ambient)
const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.diffuse = new Color3(1.0, 0.98, 0.9);
hemi.groundColor = new Color3(0.2, 0.35, 0.15); // Grüner Boden-Bounce
hemi.intensity = 0.75;

const sun = new DirectionalLight("sun", new Vector3(-1, -2, 1), scene);
sun.diffuse = new Color3(1.0, 0.95, 0.85);
sun.intensity = 1.0;

// 3b. Anti-Aliasing Rendering Pipeline (4x MSAA + FXAA für gestochen scharfe Kanten)
const pipeline = new DefaultRenderingPipeline("defaultPipeline", true, scene, [camera]);
pipeline.samples = 4;
pipeline.fxaaEnabled = true;

// 4. Stilisierter Waldboden
const ground = MeshBuilder.CreateDisc(
  "ground",
  { radius: 13, tessellation: 64 },
  scene
);
ground.rotation.x = Math.PI / 2;
ground.position.y = -0.02;

const groundMat = new StandardMaterial("groundMat", scene);
groundMat.diffuseColor = new Color3(0.35, 0.65, 0.25); // Saftiges Wiesengrün
groundMat.specularColor = new Color3(0.05, 0.05, 0.05);
ground.material = groundMat;

// Kleiner Flusslauf / Delle als Dekoration
const river = MeshBuilder.CreateGround("river", { width: 3.5, height: 18 }, scene);
river.position = new Vector3(4.5, -0.01, 0);
river.rotation.y = -Math.PI / 8;
const riverMat = new StandardMaterial("riverMat", scene);
riverMat.diffuseColor = new Color3(0.2, 0.55, 0.8);
riverMat.specularColor = new Color3(0.4, 0.7, 0.9);
river.material = riverMat;

// 5. Pfad-Helper zur robusten Asset-Auflösung
function getAssetPath(subpath: string): string {
  const isDemoSubdir = window.location.pathname.includes("/demos/");
  const rel = isDemoSubdir ? "../../" : "./";
  return new URL(`${rel}assets/models/${subpath}`, window.location.href).href;
}

// 6. Statische Forest-Assets laden
interface StaticAssetConfig {
  file: string;
  name: string;
  pos: Vector3;
  scale: number;
  rotY?: number;
}

const staticAssets: StaticAssetConfig[] = [
  // Zelt & Camp
  { file: "tent.glb", name: "Zelt", pos: new Vector3(-2, 0, 1), scale: 0.9, rotY: Math.PI / 6 },
  { file: "fence.glb", name: "Holzzaun", pos: new Vector3(-4, 0, 2), scale: 0.8, rotY: Math.PI / 3 },
  { file: "fence.glb", name: "Holzzaun", pos: new Vector3(-5, 0, 0), scale: 0.8, rotY: Math.PI / 2 },
  { file: "patch-dirt.glb", name: "Lagerfeuer-Platz", pos: new Vector3(-1.8, 0, 0), scale: 0.9 },

  // Brücke über den Fluss
  { file: "bridge.glb", name: "Holzbrücke", pos: new Vector3(4.2, 0, -0.5), scale: 1.1, rotY: -Math.PI / 8 },

  // Bäume ringsum
  { file: "tree-high.glb", name: "Hohe Tanne", pos: new Vector3(-8, 0, -6), scale: 1.2, rotY: 0.4 },
  { file: "tree.glb", name: "Nadelbaum", pos: new Vector3(-7, 0, 6), scale: 1.0, rotY: 1.2 },
  { file: "tree-high.glb", name: "Hohe Tanne", pos: new Vector3(7.5, 0, 7), scale: 1.1, rotY: 2.1 },
  { file: "tree.glb", name: "Nadelbaum", pos: new Vector3(8.5, 0, -5), scale: 0.95, rotY: 3.5 },
  { file: "tree.glb", name: "Nadelbaum", pos: new Vector3(-9.5, 0, 0), scale: 1.1, rotY: 0.9 },
  { file: "tree-high.glb", name: "Hohe Tanne", pos: new Vector3(1, 0, 8.5), scale: 1.05, rotY: 4.0 },
  { file: "tree.glb", name: "Nadelbaum", pos: new Vector3(0, 0, -8.5), scale: 1.0, rotY: 1.8 },

  // Felsen & Steine
  { file: "rocks-high.glb", name: "Granitfelsen", pos: new Vector3(-6.5, 0, -8), scale: 1.0, rotY: 0.5 },
  { file: "rocks-low.glb", name: "Moosfelsen", pos: new Vector3(6, 0, -7), scale: 0.9, rotY: 2.8 },
  { file: "stones.glb", name: "Kieselsteine", pos: new Vector3(2.5, 0, -3), scale: 0.8 },
  { file: "stones.glb", name: "Kieselsteine", pos: new Vector3(-1, 0, 3.5), scale: 0.8 },

  // Pflanzen
  { file: "plant.glb", name: "Waldblume", pos: new Vector3(-3.2, 0, 0.5), scale: 0.7 },
  { file: "plant.glb", name: "Waldblume", pos: new Vector3(2.8, 0, 1.8), scale: 0.8 },
  { file: "plant.glb", name: "Waldblume", pos: new Vector3(-0.5, 0, -4.5), scale: 0.75 },
];

let loadedStaticMeshCount = 0;

async function loadStaticEnvironment() {
  for (const item of staticAssets) {
    try {
      const res = await SceneLoader.ImportMeshAsync(
        "",
        getAssetPath("forest/"),
        item.file,
        scene
      );
      if (res.meshes.length > 0) {
        const root = res.meshes[0];
        root.name = `static_${item.name}_${item.file}`;
        root.position.copyFrom(item.pos);
        root.scaling.scaleInPlace(item.scale);
        root.rotationQuaternion = null;
        if (item.rotY !== undefined) {
          root.rotation.y = item.rotY;
        }

        // Metadaten für den Didaktik-Inspector anhängen
        for (const m of res.meshes) {
          m.metadata = {
            isStatic: true,
            assetName: item.name,
            file: item.file,
            animCount: res.animationGroups.length,
            vertexCount: m.getTotalVertices(),
          };
        }
        loadedStaticMeshCount++;
      }
    } catch (e) {
      console.warn(`Fehler beim Laden von ${item.file}:`, e);
    }
  }
}

// 7. Animierte Cube-Pets (glTF-Skelettanimation)
interface PetEntity {
  id: string;
  name: string;
  file: string;
  rootMesh: AbstractMesh | null;
  animationGroups: Map<string, AnimationGroup>;
  currentAnim: string;
  position: Vector3;
  targetAngle: number;
  waypointIndex: number;
  speed: number;
}

const petDefinitions: Record<string, { name: string; file: string; initialOffset: number }> = {
  dog: { name: "Hund (Dog)", file: "animal-dog.glb", initialOffset: 0 },
  cat: { name: "Katze (Cat)", file: "animal-cat.glb", initialOffset: 2 },
  bunny: { name: "Hase (Bunny)", file: "animal-bunny.glb", initialOffset: 4 },
  chick: { name: "Küken (Chick)", file: "animal-chick.glb", initialOffset: 5 },
};

const pets: Map<string, PetEntity> = new Map();
let activePetId = "dog";
let followCamera = false;

// Rundweg (Waypoints) um das Waldcamp
const waypoints: Vector3[] = [
  new Vector3(-4.0, 0, -3.5),
  new Vector3(0.5, 0, -4.5),
  new Vector3(4.2, 0, -0.5), // Über die Brücke!
  new Vector3(3.5, 0, 3.5),
  new Vector3(0.0, 0, 4.5),
  new Vector3(-3.5, 0, 3.0),
  new Vector3(-4.8, 0, 0.0),
];

async function loadPet(petId: string): Promise<PetEntity | null> {
  const def = petDefinitions[petId];
  if (!def) return null;

  try {
    const res = await SceneLoader.ImportMeshAsync(
      "",
      getAssetPath("pets/"),
      def.file,
      scene
    );

    const root = res.meshes[0];
    root.name = `pet_${petId}`;
    root.scaling.setAll(0.55); // Angenehme Proportionsgröße zu Bäumen/Zelt
    root.rotationQuaternion = null;

    const animMap = new Map<string, AnimationGroup>();
    for (const ag of res.animationGroups) {
      animMap.set(ag.name.toLowerCase(), ag);
      ag.stop(); // Erstmal alle anhalten
    }

    const startWp = def.initialOffset % waypoints.length;
    root.position.copyFrom(waypoints[startWp]);

    for (const m of res.meshes) {
      m.metadata = {
        isStatic: false,
        assetName: def.name,
        file: def.file,
        animCount: res.animationGroups.length,
        animList: Array.from(animMap.keys()).join(", "),
      };
    }

    const pet: PetEntity = {
      id: petId,
      name: def.name,
      file: def.file,
      rootMesh: root,
      animationGroups: animMap,
      currentAnim: "walk",
      position: root.position,
      targetAngle: 0,
      waypointIndex: startWp,
      speed: 1.8,
    };

    // Standard-Animation: Walk starten
    playPetAnimation(pet, "walk");
    pets.set(petId, pet);
    return pet;
  } catch (e) {
    console.error(`Fehler beim Laden von ${def.file}:`, e);
    return null;
  }
}

function playPetAnimation(pet: PetEntity, animName: string) {
  // Alle laufenden Animationen für dieses Pet stoppen
  for (const ag of pet.animationGroups.values()) {
    ag.stop();
  }

  pet.currentAnim = animName;

  if (animName === "static") {
    pet.speed = 0;
    return;
  }

  const targetAg = pet.animationGroups.get(animName.toLowerCase());
  if (targetAg) {
    targetAg.start(true); // Loop
  }

  if (animName === "walk") {
    pet.speed = 1.8;
  } else if (animName === "run") {
    pet.speed = 3.6;
  } else {
    // idle, dance, eat etc. bewegen sich nicht im Raum
    pet.speed = 0;
  }
}

// 8. Ticker: Pets auf dem Rundweg bewegen & Kamerasynchronisation
scene.onBeforeRenderObservable.add(() => {
  const dt = engine.getDeltaTime() / 1000;

  for (const pet of pets.values()) {
    if (!pet.rootMesh) continue;

    // Nur fortbewegen, wenn Speed > 0 (Walk oder Run)
    if (pet.speed > 0) {
      const targetWp = waypoints[pet.waypointIndex];
      const currentPos = pet.rootMesh.position;

      const diff = targetWp.subtract(currentPos);
      diff.y = 0;
      const dist = diff.length();

      if (dist < 0.25) {
        // Nächster Wegpunkt
        pet.waypointIndex = (pet.waypointIndex + 1) % waypoints.length;
      } else {
        const moveDir = diff.normalize();
        const step = moveDir.scale(pet.speed * dt);
        pet.rootMesh.position.addInPlace(step);

        // Blickrichtung sanft drehen
        const targetRotY = Math.atan2(moveDir.x, moveDir.z);
        let curRotY = pet.rootMesh.rotation.y;
        
        // Winkel-Differenz normalisieren [-PI, PI]
        let deltaAngle = targetRotY - curRotY;
        while (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2;
        while (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2;

        pet.rootMesh.rotation.y += deltaAngle * Math.min(1.0, dt * 10);
      }
    }
  }

  // Kamera-Tracking für das aktive Tier
  if (followCamera) {
    const active = pets.get(activePetId);
    if (active && active.rootMesh) {
      const petPos = active.rootMesh.position;
      camera.target = Vector3.Lerp(camera.target, new Vector3(petPos.x, 1.2, petPos.z), 0.1);
    }
  }
});

// 9. Interaktiver Didaktik-Inspector per Klick
scene.onPointerDown = (_evt, pickResult) => {
  if (pickResult && pickResult.hit && pickResult.pickedMesh) {
    const m = pickResult.pickedMesh;
    const meta = m.metadata;
    const inspector = document.getElementById("inspector-detail");
    if (!inspector) return;

    if (meta) {
      if (meta.isStatic) {
        inspector.innerHTML = `
          <span style="color: #38bdf8;">🌲 Statisches Modell:</span> <strong>${meta.assetName}</strong> (${meta.file})<br/>
          • Animationen: <strong>0</strong> (Reines Geometrie-Mesh)<br/>
          • Vertices: <strong>${meta.vertexCount}</strong> | Kein Animations-Overhead
        `;
      } else {
        inspector.innerHTML = `
          <span style="color: #10b981;">🐶 Animiertes Modell:</span> <strong>${meta.assetName}</strong> (${meta.file})<br/>
          • glTF-Animationen: <strong>${meta.animCount}</strong> Clips (${meta.animList})<br/>
          • Status: Spielt Clip <strong>"${meta.currentAnim || 'aktiv'}"</strong>
        `;
      }
    }
  }
};

// 10. UI-Verdrahtung
function updateUI() {
  const metric = document.getElementById("metric-info");
  const active = pets.get(activePetId);
  if (!metric) return;

  if (active) {
    metric.textContent = `${active.name} | Anim: ${active.currentAnim} | Speed: ${active.speed.toFixed(1)} m/s | ${loadedStaticMeshCount} Wald-Assets`;
  }
}

function setupUI() {
  // Tier-Buttons
  const petButtons = document.querySelectorAll("#pet-buttons button[data-pet]");
  petButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      petButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      activePetId = btn.getAttribute("data-pet") || "dog";

      // Aktive Animations-Schaltfläche synchronisieren
      const active = pets.get(activePetId);
      if (active) {
        updateAnimButtons(active.currentAnim);
      }
      updateUI();
    });
  });

  // Animations-Buttons
  const animButtons = document.querySelectorAll("#anim-buttons button[data-anim]");
  animButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const anim = btn.getAttribute("data-anim") || "idle";
      const active = pets.get(activePetId);
      if (active) {
        playPetAnimation(active, anim);
        updateAnimButtons(anim);
        updateUI();
      }
    });
  });

  function updateAnimButtons(activeAnim: string) {
    animButtons.forEach((b) => {
      if (b.getAttribute("data-anim") === activeAnim) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
  }

  // Kamera-Modus Umschalter
  const camBtn = document.getElementById("btn-camera");
  if (camBtn) {
    camBtn.addEventListener("click", () => {
      followCamera = !followCamera;
      if (followCamera) {
        camBtn.textContent = "🎥 Kamera: Tier verfolgen";
        camBtn.style.background = "#0284c7";
      } else {
        camBtn.textContent = "🎥 Kamera: Freier Orbit";
        camBtn.style.background = "rgba(30,41,59,0.8)";
        camera.target = new Vector3(0, 1, 0);
      }
    });
  }
}

// 11. Initialisierung
async function init() {
  setupUI();

  // Render-Loop sofort starten, damit kein Standbild entsteht
  engine.runRenderLoop(() => {
    scene.render();
  });

  window.addEventListener("resize", () => {
    engine.setHardwareScalingLevel(1.0 / Math.min(window.devicePixelRatio || 1, 2));
    engine.resize();
  });

  const metric = document.getElementById("metric-info");
  if (metric) metric.textContent = "Lade Mini-Forest & Cube-Pets...";

  // 1. Statischen Wald laden
  await loadStaticEnvironment();

  // 2. Pets laden
  await loadPet("dog");
  await loadPet("cat");
  await loadPet("bunny");
  await loadPet("chick");

  // Initialer UI-Status
  updateUI();
}

init();
