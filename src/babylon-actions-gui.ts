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
  ActionManager,
  ExecuteCodeAction,
  InterpolateValueAction,
  Mesh,
  Animation,
} from "@babylonjs/core";
import { AdvancedDynamicTexture, TextBlock, StackPanel, Control } from "@babylonjs/gui";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
if (!canvas) throw new Error("renderCanvas element missing");

// 1. Engine & Scene
const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
const scene = new Scene(engine);
scene.clearColor = new Color4(0.04, 0.06, 0.1, 1.0);

// 2. Kamera
const camera = new ArcRotateCamera(
  "cam",
  -Math.PI / 2.5,
  Math.PI / 3.2,
  18,
  new Vector3(0, 1, 0),
  scene
);
camera.attachControl(canvas, true);
camera.wheelPrecision = 25;

// 3. Licht
const hemi = new HemisphericLight("hemi", new Vector3(0, 1, 0), scene);
hemi.intensity = 0.5;

const pointLight = new PointLight("point", new Vector3(0, 6, 0), scene);
pointLight.diffuse = new Color3(1, 0.9, 0.7);
pointLight.intensity = 1.5;

// 4. Boden
const ground = MeshBuilder.CreateGround("ground", { width: 22, height: 22 }, scene);
const groundMat = new StandardMaterial("groundMat", scene);
groundMat.diffuseColor = new Color3(0.08, 0.11, 0.18);
groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
ground.material = groundMat;

// 5. In-Canvas GUI via @babylonjs/gui
const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

const stackPanel = new StackPanel();
stackPanel.width = "260px";
stackPanel.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
stackPanel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
stackPanel.paddingTop = "16px";
stackPanel.paddingLeft = "16px";
advancedTexture.addControl(stackPanel);

const headerText = new TextBlock();
headerText.text = "BABYLON.GUI HUD";
headerText.color = "#38bdf8";
headerText.fontSize = 16;
headerText.fontFamily = "sans-serif";
headerText.height = "26px";
headerText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
stackPanel.addControl(headerText);

let score = 0;
const scoreText = new TextBlock();
scoreText.text = `Punkte: ${score}`;
scoreText.color = "#f8fafc";
scoreText.fontSize = 24;
scoreText.fontFamily = "sans-serif";
scoreText.fontWeight = "bold";
scoreText.height = "36px";
scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
stackPanel.addControl(scoreText);

const hintText = new TextBlock();
hintText.text = "Klicke auf die 3D-Targets!";
hintText.color = "#94a3b8";
hintText.fontSize = 13;
hintText.fontFamily = "sans-serif";
hintText.height = "24px";
hintText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
stackPanel.addControl(hintText);

function updateScore(delta: number) {
  score = Math.max(0, score + delta);
  scoreText.text = `Punkte: ${score}`;
}

// 6. Target Spawning mit ActionManager
const targets: Mesh[] = [];

function spawnTarget(x: number, z: number) {
  const target = MeshBuilder.CreateSphere(
    `target_${Date.now()}`,
    { diameter: 1.6, segments: 24 },
    scene
  );
  target.position.set(x, 1.2, z);

  const mat = new StandardMaterial(`targetMat_${Date.now()}`, scene);
  const colors = [
    new Color3(0.22, 0.74, 0.97), // Cyan
    new Color3(0.96, 0.25, 0.37), // Rose
    new Color3(0.5, 0.55, 0.97), // Indigo
    new Color3(0.06, 0.73, 0.51), // Emerald
  ];
  mat.diffuseColor = colors[Math.floor(Math.random() * colors.length)];
  mat.specularColor = new Color3(1, 1, 1);
  target.material = mat;

  // Babylon.js ActionManager (Native Event Abstraktion!)
  target.actionManager = new ActionManager(scene);

  // 1. Mouse-Over Hover-Effekt (Interpolation direkt in der Engine)
  target.actionManager.registerAction(
    new InterpolateValueAction(
      ActionManager.OnPointerOverTrigger,
      target,
      "scaling",
      new Vector3(1.25, 1.25, 1.25),
      120
    )
  );
  target.actionManager.registerAction(
    new InterpolateValueAction(
      ActionManager.OnPointerOutTrigger,
      target,
      "scaling",
      new Vector3(1.0, 1.0, 1.0),
      120
    )
  );

  // 2. Klick-Aktion (ExecuteCodeAction)
  target.actionManager.registerAction(
    new ExecuteCodeAction(ActionManager.OnPickTrigger, () => {
      updateScore(10);

      // Bounce-Animation
      Animation.CreateAndStartAnimation(
        "bounce",
        target,
        "position.y",
        60,
        15,
        target.position.y,
        target.position.y + 1.8,
        Animation.ANIMATIONLOOPMODE_CONSTANT
      );

      // Farb-Flash
      mat.emissiveColor = new Color3(1, 1, 1);
      setTimeout(() => {
        mat.emissiveColor = new Color3(0, 0, 0);
      }, 150);
    })
  );

  targets.push(target);
}

// Initiale Targets im Kreis
for (let i = 0; i < 5; i++) {
  const angle = (i / 5) * Math.PI * 2;
  spawnTarget(Math.cos(angle) * 6, Math.sin(angle) * 6);
}

// Externe HTML-Buttons
document.getElementById("btn-spawn")?.addEventListener("click", () => {
  const r = 3 + Math.random() * 5;
  const a = Math.random() * Math.PI * 2;
  spawnTarget(Math.cos(a) * r, Math.sin(a) * r);
});

document.getElementById("btn-reset")?.addEventListener("click", () => {
  score = 0;
  updateScore(0);
});

// Resize
window.addEventListener("resize", () => engine.resize());

// Render Loop
let t = 0;
engine.runRenderLoop(() => {
  t += engine.getDeltaTime() * 0.001;

  // Sanftes Schweben
  targets.forEach((target, i) => {
    target.position.y = 1.0 + Math.sin(t * 2 + i) * 0.25;
  });

  scene.render();
});
