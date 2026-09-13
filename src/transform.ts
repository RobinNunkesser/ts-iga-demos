import p5 from "p5";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const sketch = (p: p5) => {
  const WIDTH = 800;
  const HEIGHT = 500;

  let isIsolated = true;
  let obj1Rot = 0.78; // ~45 deg
  let obj1Scale = 1.2;

  const toggleIsolate = document.getElementById("toggle-isolate") as HTMLInputElement | null;
  const rotSlider = document.getElementById("rot-slider") as HTMLInputElement | null;
  const scaleSlider = document.getElementById("scale-slider") as HTMLInputElement | null;
  const metricState = document.getElementById("metric-state");

  function updateMetric() {
    if (metricState) {
      if (isIsolated) {
        metricState.textContent = "Status: Isoliert (Korrekt)";
        metricState.style.color = "#38bdf8";
        metricState.style.borderColor = "#38bdf8";
      } else {
        metricState.textContent = "Status: Glitch / Akkumulierend!";
        metricState.style.color = "#f43f5e";
        metricState.style.borderColor = "#f43f5e";
      }
    }
  }

  if (toggleIsolate) {
    toggleIsolate.addEventListener("change", (e) => {
      isIsolated = (e.target as HTMLInputElement).checked;
      updateMetric();
    });
  }

  if (rotSlider) {
    rotSlider.addEventListener("input", (e) => {
      obj1Rot = parseFloat((e.target as HTMLInputElement).value);
    });
  }

  if (scaleSlider) {
    scaleSlider.addEventListener("input", (e) => {
      obj1Scale = parseFloat((e.target as HTMLInputElement).value);
    });
  }

  p.setup = () => {
    const canvas = p.createCanvas(WIDTH, HEIGHT);
    canvas.parent("canvas-container");
    p.frameRate(60);
    updateMetric();
  };

  p.draw = () => {
    p.background(11, 15, 25);

    // Welt-Koordinatensystem Gitter & Ursprung
    drawCoordinateGrid(p, WIDTH, HEIGHT);

    // Ursprungsmarkierung (0, 0)
    p.noStroke();
    p.fill(244, 63, 94);
    p.circle(0, 0, 18);
    p.fill(244, 63, 94);
    p.textSize(12);
    p.text("(0, 0) Screen Origin", 15, 20);

    // --- OBJEKT 1: Raumschiff / Spieler bei (260, 250) ---
    if (isIsolated) p.push();

    p.translate(260, 250);
    p.rotate(obj1Rot);
    p.scale(obj1Scale);

    // Eigenes lokales Koordinatenkreuz
    drawLocalAxes(p, 40);

    p.fill(56, 189, 248);
    p.stroke(2, 132, 199);
    p.strokeWeight(2);
    // Raumschiff Form
    p.beginShape();
    p.vertex(30, 0);
    p.vertex(-25, -20);
    p.vertex(-12, 0);
    p.vertex(-25, 20);
    p.endShape(p.CLOSE);

    p.fill(255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Objekt 1 (Player)", 0, 26);

    if (isIsolated) {
      p.pop(); // Matrix zurücksetzen!
    }

    // --- OBJEKT 2: Station / Gegner bei (560, 250) ---
    // Wenn isIsolated == false, akkumulieren sich die Transformationen von Objekt 1!
    if (isIsolated) p.push();

    p.translate(560, 250);

    drawLocalAxes(p, 40);

    p.fill(16, 185, 129);
    p.stroke(5, 150, 105);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, 50, 50, 8);
    p.circle(0, 0, 20);

    p.fill(255);
    p.noStroke();
    p.textSize(11);
    p.textAlign(p.CENTER, p.TOP);
    p.text("Objekt 2 (Station)", 0, 32);

    if (isIsolated) {
      p.pop();
    }

    // Code-Box Overlay unten
    p.noStroke();
    p.fill(15, 23, 42, 230);
    p.rect(WIDTH - 380, 20, 360, 140, 8);
    p.stroke(isIsolated ? 56 : 244, isIsolated ? 189 : 63, isIsolated ? 248 : 94);
    p.strokeWeight(1);
    p.noFill();
    p.rect(WIDTH - 380, 20, 360, 140, 8);

    p.noStroke();
    p.fill(isIsolated ? "#38bdf8" : "#f43f5e");
    p.textSize(13);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.text(isIsolated ? "✓ Mit push() & pop() (Best Practice)" : "⚠️ OHNE push() & pop() (Transform Leak!)", WIDTH - 365, 32);

    p.fill(203, 213, 225);
    p.textSize(11);
    p.textStyle(p.NORMAL);
    if (isIsolated) {
      p.text("p.push();\n  p.translate(260, 250); p.rotate(rot); ...\np.pop(); // Matrix bleibt unbeeinflusst!\n\np.translate(560, 250); // Korrekte Weltposition", WIDTH - 365, 58);
    } else {
      p.text("// FEHLER: Matrix wurde nicht zurückgesetzt!\np.translate(260, 250); p.rotate(rot);\n// Nachfolgendes Objekt erbt Translation & Rotation!\np.translate(560, 250); // Objekt fliegt aus dem Bild!", WIDTH - 365, 58);
    }
  };

  function drawCoordinateGrid(p: p5, w: number, h: number) {
    p.stroke(30, 41, 59, 80);
    p.strokeWeight(1);
    for (let x = 0; x < w; x += 40) p.line(x, 0, x, h);
    for (let y = 0; y < h; y += 40) p.line(0, y, w, y);
  }

  function drawLocalAxes(p: p5, len: number) {
    p.strokeWeight(2);
    // Lokale X-Achse (Rot)
    p.stroke(244, 63, 94);
    p.line(0, 0, len, 0);
    // Lokale Y-Achse (Grün)
    p.stroke(16, 185, 129);
    p.line(0, 0, 0, len);
  }
};

new p5(sketch);
