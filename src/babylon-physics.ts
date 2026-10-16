import {
  ArcRotateCamera,
  Color3,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  PointLight,
  Scene,
  StandardMaterial,
  Vector3,
} from "@babylonjs/core";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import HavokPhysics from "@babylonjs/havok";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

function requireElement<T extends HTMLElement>(element: T | null, id: string): T {
  if (!element) {
    throw new Error(`Havok demo: required page element #${id} is missing`);
  }
  return element;
}

const canvas = requireElement(
  document.getElementById("renderCanvas") as HTMLCanvasElement | null,
  "renderCanvas"
);
const status = requireElement(document.getElementById("metric-info"), "metric-info");
const spawnButton = requireElement(
  document.getElementById("btn-spawn") as HTMLButtonElement | null,
  "btn-spawn"
);
const resetButton = requireElement(
  document.getElementById("btn-reset") as HTMLButtonElement | null,
  "btn-reset"
);
const restitutionInput = requireElement(
  document.getElementById("restitution") as HTMLInputElement | null,
  "restitution"
);
const restitutionValue = requireElement(
  document.getElementById("restitution-value") as HTMLOutputElement | null,
  "restitution-value"
);

async function startDemo(): Promise<void> {
  const engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true, adaptToDeviceRatio: true });
  engine.setHardwareScalingLevel(1.0 / Math.min(window.devicePixelRatio || 1, 2));
  const scene = new Scene(engine);
  scene.clearColor = new Color4(0.04, 0.06, 0.1, 1);

  const camera = new ArcRotateCamera(
    "physicsCamera",
    -Math.PI / 2.6,
    Math.PI / 3.1,
    24,
    new Vector3(0, 2, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.wheelPrecision = 30;
  camera.lowerRadiusLimit = 12;
  camera.upperRadiusLimit = 34;

  const hemiLight = new HemisphericLight("hemiLight", new Vector3(0, 1, 0), scene);
  hemiLight.intensity = 0.65;
  const pointLight = new PointLight("pointLight", new Vector3(-4, 8, -4), scene);
  pointLight.diffuse = new Color3(0.22, 0.74, 0.97);
  pointLight.intensity = 1.2;

  const havokInstance = await HavokPhysics();
  const havokPlugin = new HavokPlugin(true, havokInstance);
  scene.enablePhysics(new Vector3(0, -9.81, 0), havokPlugin);

  const ground = MeshBuilder.CreateBox("ground", { width: 20, height: 1, depth: 20 }, scene);
  ground.position.y = -0.5;
  ground.material = createMaterial("groundMaterial", new Color3(0.08, 0.11, 0.18), scene);
  new PhysicsAggregate(ground, PhysicsShapeType.BOX, { mass: 0, friction: 0.8 }, scene);

  const obstacle = MeshBuilder.CreateBox("obstacle", { width: 3, height: 1.2, depth: 2 }, scene);
  obstacle.position.set(0, 0.6, 0);
  obstacle.rotation.y = Math.PI / 7;
  obstacle.material = createMaterial("obstacleMaterial", new Color3(0.5, 0.55, 0.97), scene);
  new PhysicsAggregate(obstacle, PhysicsShapeType.BOX, { mass: 0, friction: 0.7 }, scene);

  const ballColors = [
    new Color3(0.22, 0.74, 0.97),
    new Color3(0.96, 0.25, 0.37),
    new Color3(0.06, 0.73, 0.51),
    new Color3(0.96, 0.67, 0.22),
  ];
  const balls: Array<{ mesh: Mesh; aggregate: PhysicsAggregate }> = [];
  let nextBallId = 0;

  function updateStatus(): void {
    status.textContent = `Havok aktiv · ${balls.length} Kugeln · Gravitation: −9,81 m/s²`;
  }

  function dropBall(position?: Vector3): void {
    const id = nextBallId++;
    const ball = MeshBuilder.CreateSphere(`ball-${id}`, { diameter: 1.2, segments: 24 }, scene);
    ball.position.copyFrom(
      position ??
        new Vector3(
          (Math.random() - 0.5) * 10,
          8 + Math.random() * 2,
          (Math.random() - 0.5) * 10
        )
    );
    ball.material = createMaterial(
      `ballMaterial-${id}`,
      ballColors[id % ballColors.length],
      scene
    );
    const aggregate = new PhysicsAggregate(
      ball,
      PhysicsShapeType.SPHERE,
      {
        mass: 1,
        friction: 0.4,
        restitution: Number(restitutionInput.value),
      },
      scene
    );
    balls.push({ mesh: ball, aggregate });
    updateStatus();
  }

  function resetBalls(): void {
    for (const { mesh, aggregate } of balls) {
      aggregate.dispose();
      mesh.dispose();
    }
    balls.length = 0;
    nextBallId = 0;
    for (let i = 0; i < 4; i++) {
      dropBall(new Vector3(-4.5 + i * 3, 5 + i * 1.8, -2));
    }
  }

  spawnButton.addEventListener("click", () => dropBall());
  resetButton.addEventListener("click", resetBalls);
  restitutionInput.addEventListener("input", () => {
    restitutionValue.value = Number(restitutionInput.value).toFixed(2);
  });

  resetBalls();
  spawnButton.disabled = false;
  resetButton.disabled = false;
  restitutionInput.disabled = false;
  window.addEventListener("resize", () => engine.resize());
  engine.runRenderLoop(() => scene.render());
}

function createMaterial(name: string, color: Color3, scene: Scene): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(0.8, 0.8, 0.8);
  return material;
}

void startDemo().catch((error: unknown) => {
  console.error("Havok demo konnte nicht gestartet werden.", error);
  status.textContent = "Fehler beim Laden der Havok-Physik. Details in der Browserkonsole.";
});
