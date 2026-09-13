import p5 from "p5";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

const sketch = (p: p5) => {
  const WIDTH = 800;
  const HEIGHT = 500;

  // Paddle setup
  const paddleWidth = 18;
  const paddleHeight = 160;
  const paddleX = 100;
  const paddleY = HEIGHT / 2 - paddleHeight / 2;

  // State
  let relativeHit = 0.5; // -1 (top) to +1 (bottom)
  let isArcade = true;
  let isAnimating = false;

  // Ball
  const ballRadius = 12;
  let ballX = 650;
  let ballY = 150;
  let ballVx = -6;
  let ballVy = 0;
  const baseSpeed = 7.5;

  // DOM elements
  const slider = document.getElementById("hit-slider") as HTMLInputElement | null;
  const metricHit = document.getElementById("metric-hit");
  const metricAngle = document.getElementById("metric-angle");
  const toggleArcade = document.getElementById("toggle-arcade") as HTMLInputElement | null;
  const btnFire = document.getElementById("btn-fire");

  function updateMetrics() {
    const angleRad = isArcade ? relativeHit * (Math.PI / 3) : 0;
    const angleDeg = (angleRad * 180) / Math.PI;

    if (metricHit) {
      metricHit.textContent = `offset: ${relativeHit >= 0 ? "+" : ""}${relativeHit.toFixed(2)}`;
    }
    if (metricAngle) {
      metricAngle.textContent = `winkel: ${angleDeg >= 0 ? "+" : ""}${angleDeg.toFixed(1)}°`;
    }
  }

  if (slider) {
    slider.addEventListener("input", (e) => {
      relativeHit = parseFloat((e.target as HTMLInputElement).value);
      updateMetrics();
      if (!isAnimating) resetBallToStart();
    });
  }

  if (toggleArcade) {
    toggleArcade.addEventListener("change", (e) => {
      isArcade = (e.target as HTMLInputElement).checked;
      updateMetrics();
      if (!isAnimating) resetBallToStart();
    });
  }

  function resetBallToStart() {
    const targetY = paddleY + paddleHeight / 2 + relativeHit * (paddleHeight / 2);
    ballX = 650;
    ballY = Math.max(30, Math.min(HEIGHT - 30, targetY - 120));
    
    // Berechne Vektor auf den Zielpunkt am Schläger
    const dx = paddleX + paddleWidth + ballRadius - ballX;
    const dy = targetY - ballY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    ballVx = (dx / dist) * baseSpeed;
    ballVy = (dy / dist) * baseSpeed;
    isAnimating = false;
  }

  if (btnFire) {
    btnFire.addEventListener("click", () => {
      resetBallToStart();
      isAnimating = true;
    });
  }

  p.setup = () => {
    const canvas = p.createCanvas(WIDTH, HEIGHT);
    canvas.parent("canvas-container");
    p.frameRate(60);
    resetBallToStart();
    updateMetrics();
  };

  p.draw = () => {
    p.background(11, 15, 25);

    // Gitterlinien / Hilfslinien
    p.stroke(30, 41, 59, 100);
    p.strokeWeight(1);
    for (let x = 0; x < WIDTH; x += 50) p.line(x, 0, x, HEIGHT);
    for (let y = 0; y < HEIGHT; y += 50) p.line(0, y, WIDTH, y);

    // Mittellinie Schläger
    const centerY = paddleY + paddleHeight / 2;
    p.stroke(56, 189, 248, 60);
    p.line(paddleX + paddleWidth, centerY, paddleX + 220, centerY);
    p.noStroke();
    p.fill(56, 189, 248, 140);
    p.textSize(11);
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text("Mitte (0.0 → 0°)", paddleX + paddleWidth + 10, centerY - 3);

    // Schläger zeichnen mit Zonenverlauf
    p.noStroke();
    p.fill(30, 41, 59);
    p.rect(paddleX, paddleY, paddleWidth, paddleHeight, 6);

    // Farbige Zonen
    p.fill(244, 63, 94, 180); // Top zone (stark nach oben)
    p.rect(paddleX, paddleY, paddleWidth, 30, 6, 6, 0, 0);
    p.fill(16, 185, 129, 200); // Center zone (gerade)
    p.rect(paddleX, centerY - 25, paddleWidth, 50);
    p.fill(244, 63, 94, 180); // Bottom zone (stark nach unten)
    p.rect(paddleX, paddleY + paddleHeight - 30, paddleWidth, 30, 0, 0, 6, 6);

    // Zielpunkt / Auftreffmarkierung
    const targetY = centerY + relativeHit * (paddleHeight / 2);
    p.fill(251, 191, 36);
    p.circle(paddleX + paddleWidth, targetY, 10);

    // Vektor-Simulation
    if (isAnimating) {
      ballX += ballVx;
      ballY += ballVy;

      // Kollisionsprüfung mit Schläger
      if (ballX - ballRadius <= paddleX + paddleWidth && ballX + ballRadius >= paddleX && ballVx < 0) {
        if (ballY >= paddleY && ballY <= paddleY + paddleHeight) {
          ballX = paddleX + paddleWidth + ballRadius;
          const currentHit = (ballY - centerY) / (paddleHeight / 2);
          
          if (isArcade) {
            const bounceAngle = currentHit * (Math.PI / 3);
            ballVx = Math.cos(bounceAngle) * baseSpeed;
            ballVy = Math.sin(bounceAngle) * baseSpeed;
          } else {
            // Feste 45°-Spiegelung
            ballVx = -ballVx;
          }
        }
      }

      // Wände oben / unten
      if (ballY - ballRadius <= 0) {
        ballY = ballRadius;
        ballVy *= -1;
      } else if (ballY + ballRadius >= HEIGHT) {
        ballY = HEIGHT - ballRadius;
        ballVy *= -1;
      }

      // Rechte Wand / Reset
      if (ballX > WIDTH + 50) {
        resetBallToStart();
      }
    }

    // Ball zeichnen
    p.fill(255);
    p.stroke(56, 189, 248);
    p.strokeWeight(2);
    p.circle(ballX, ballY, ballRadius * 2);

    // Berechneter Ausfallswinkel-Vektorpfeil (Vorschau am Zielpunkt)
    const angleRad = isArcade ? relativeHit * (Math.PI / 3) : 0;
    const arrowLen = 140;
    const outX = paddleX + paddleWidth + Math.cos(angleRad) * arrowLen;
    const outY = targetY + Math.sin(angleRad) * arrowLen;

    p.stroke(16, 185, 129);
    p.strokeWeight(3);
    p.line(paddleX + paddleWidth, targetY, outX, outY);

    // Pfeilspitze
    drawArrowHead(p, paddleX + paddleWidth, targetY, outX, outY, 12, [16, 185, 129]);

    // Bogen für Winkelanzeige
    p.noFill();
    p.stroke(251, 191, 36, 180);
    p.strokeWeight(2);
    const arcRadius = 70;
    if (Math.abs(angleRad) > 0.05) {
      if (angleRad > 0) {
        p.arc(paddleX + paddleWidth, targetY, arcRadius, arcRadius, 0, angleRad);
      } else {
        p.arc(paddleX + paddleWidth, targetY, arcRadius, arcRadius, angleRad, 0);
      }
    }

    // Formel-Overlay auf dem Canvas
    p.noStroke();
    p.fill(15, 23, 42, 220);
    p.rect(WIDTH - 370, 20, 350, 150, 8);
    p.stroke(30, 41, 59);
    p.strokeWeight(1);
    p.noFill();
    p.rect(WIDTH - 370, 20, 350, 150, 8);

    p.noStroke();
    p.fill(56, 189, 248);
    p.textSize(14);
    p.textStyle(p.BOLD);
    p.textAlign(p.LEFT, p.TOP);
    p.text("📐 Formel zur Winkelberechnung", WIDTH - 355, 32);

    p.fill(226, 232, 240);
    p.textSize(12);
    p.textStyle(p.NORMAL);
    p.text(`1. relativeHit = (ballY - paddleCenter) / (h / 2)`, WIDTH - 355, 58);
    p.text(`   = ${relativeHit >= 0 ? "+" : ""}${relativeHit.toFixed(2)}  [-1.0 bis +1.0]`, WIDTH - 355, 75);

    p.text(`2. bounceAngle = relativeHit * (PI / 3)`, WIDTH - 355, 97);
    const deg = ((angleRad * 180) / Math.PI).toFixed(1);
    p.text(`   = ${deg}°  [max ±60°]`, WIDTH - 355, 114);

    p.fill(16, 185, 129);
    p.text(`3. v_x = cos(θ) * v_base,  v_y = sin(θ) * v_base`, WIDTH - 355, 136);

    // Klick / Drag auf Schläger erlaubt direktes Einstellen des Auftreffpunkts
    if (p.mouseIsPressed) {
      if (p.mouseX >= paddleX - 20 && p.mouseX <= paddleX + paddleWidth + 30 && p.mouseY >= paddleY && p.mouseY <= paddleY + paddleHeight) {
        relativeHit = (p.mouseY - centerY) / (paddleHeight / 2);
        relativeHit = Math.max(-1, Math.min(1, relativeHit));
        if (slider) slider.value = relativeHit.toString();
        updateMetrics();
        if (!isAnimating) resetBallToStart();
      }
    }
  };

  function drawArrowHead(
    p: p5,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    size: number,
    color: [number, number, number]
  ) {
    const angle = Math.atan2(y1 - y0, x1 - x0);
    p.push();
    p.translate(x1, y1);
    p.rotate(angle);
    p.fill(color[0], color[1], color[2]);
    p.noStroke();
    p.triangle(0, 0, -size, -size * 0.45, -size, size * 0.45);
    p.pop();
  }
};

new p5(sketch);
