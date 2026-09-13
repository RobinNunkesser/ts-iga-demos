import p5 from "p5";
import { setupEmbedMode } from "./embed";

setupEmbedMode();

// --- Zero-Asset Web Audio API Synthesizer ---
class SoundSynth {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  playImpact(freq: number = 440) {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    } catch {
      // Audio policy safe
    }
  }
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: [number, number, number];
  size: number;
}

const sketch = (p: p5) => {
  const WIDTH = 800;
  const HEIGHT = 500;

  const synth = new SoundSynth();

  // Settings
  let enableShake = true;
  let enableParticles = true;
  let enableAudio = true;
  let enableSquash = true;

  // Ball
  let ballX = WIDTH / 2;
  let ballY = HEIGHT / 2;
  let ballVx = 7.5;
  let ballVy = 4.2;
  const baseRadius = 16;
  let squashX = 1;
  let squashY = 1;

  // Screen shake
  let shakeAmount = 0;

  // Particles
  const particles: Particle[] = [];

  // Hit flash indicator
  let flashAlpha = 0;

  // DOM Elements
  const toggleShake = document.getElementById("toggle-shake") as HTMLInputElement | null;
  const toggleParticles = document.getElementById("toggle-particles") as HTMLInputElement | null;
  const toggleAudio = document.getElementById("toggle-audio") as HTMLInputElement | null;
  const toggleSquash = document.getElementById("toggle-squash") as HTMLInputElement | null;
  const btnDry = document.getElementById("btn-dry");
  const btnJuicy = document.getElementById("btn-juicy");

  function syncCheckboxes() {
    if (toggleShake) toggleShake.checked = enableShake;
    if (toggleParticles) toggleParticles.checked = enableParticles;
    if (toggleAudio) toggleAudio.checked = enableAudio;
    if (toggleSquash) toggleSquash.checked = enableSquash;
  }

  if (toggleShake) toggleShake.addEventListener("change", (e) => (enableShake = (e.target as HTMLInputElement).checked));
  if (toggleParticles) toggleParticles.addEventListener("change", (e) => (enableParticles = (e.target as HTMLInputElement).checked));
  if (toggleAudio) toggleAudio.addEventListener("change", (e) => (enableAudio = (e.target as HTMLInputElement).checked));
  if (toggleSquash) toggleSquash.addEventListener("change", (e) => (enableSquash = (e.target as HTMLInputElement).checked));

  if (btnDry) {
    btnDry.addEventListener("click", () => {
      enableShake = false;
      enableParticles = false;
      enableAudio = false;
      enableSquash = false;
      syncCheckboxes();
    });
  }

  if (btnJuicy) {
    btnJuicy.addEventListener("click", () => {
      enableShake = true;
      enableParticles = true;
      enableAudio = true;
      enableSquash = true;
      syncCheckboxes();
    });
  }

  function spawnBurst(x: number, y: number, nx: number, ny: number) {
    if (!enableParticles) return;
    const count = 18;
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(ny, nx) + (Math.random() - 0.5) * 1.5;
      const speed = 2 + Math.random() * 6;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 255,
        color: Math.random() > 0.4 ? [56, 189, 248] : [244, 63, 94],
        size: 3 + Math.random() * 5,
      });
    }
  }

  function triggerHit(x: number, y: number, nx: number, ny: number) {
    if (enableAudio) synth.playImpact(380 + Math.random() * 120);
    if (enableShake) shakeAmount = 9;
    if (enableParticles) spawnBurst(x, y, nx, ny);
    if (enableSquash) {
      if (Math.abs(nx) > 0) {
        squashX = 0.55;
        squashY = 1.45;
      } else {
        squashX = 1.45;
        squashY = 0.55;
      }
    }
    flashAlpha = 80;
  }

  p.setup = () => {
    const canvas = p.createCanvas(WIDTH, HEIGHT);
    canvas.parent("canvas-container");
    p.frameRate(60);
  };

  p.draw = () => {
    p.push();

    // 1. Screen Shake Matrix Translation
    if (shakeAmount > 0) {
      p.translate(
        p.random(-shakeAmount, shakeAmount),
        p.random(-shakeAmount, shakeAmount)
      );
      shakeAmount *= 0.86;
      if (shakeAmount < 0.2) shakeAmount = 0;
    }

    p.background(11, 15, 25);

    // Arena Ränder zeichnen
    p.stroke(30, 41, 59);
    p.strokeWeight(4);
    p.noFill();
    p.rect(2, 2, WIDTH - 4, HEIGHT - 4, 8);

    // Physik-Update
    ballX += ballVx;
    ballY += ballVy;

    // Kollision mit Wänden
    if (ballX - baseRadius <= 6) {
      ballX = 6 + baseRadius;
      ballVx *= -1;
      triggerHit(ballX - baseRadius, ballY, 1, 0);
    } else if (ballX + baseRadius >= WIDTH - 6) {
      ballX = WIDTH - 6 - baseRadius;
      ballVx *= -1;
      triggerHit(ballX + baseRadius, ballY, -1, 0);
    }

    if (ballY - baseRadius <= 6) {
      ballY = 6 + baseRadius;
      ballVy *= -1;
      triggerHit(ballX, ballY - baseRadius, 0, 1);
    } else if (ballY + baseRadius >= HEIGHT - 6) {
      ballY = HEIGHT - 6 - baseRadius;
      ballVy *= -1;
      triggerHit(ballX, ballY + baseRadius, 0, -1);
    }

    // Squash & Stretch Rückbildung (Lerp auf 1.0)
    squashX += (1 - squashX) * 0.18;
    squashY += (1 - squashY) * 0.18;

    // Partikel aktualisieren und rendern
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 6;
      p.noStroke();
      p.fill(pt.color[0], pt.color[1], pt.color[2], pt.alpha);
      p.circle(pt.x, pt.y, pt.size);
      if (pt.alpha <= 0) particles.splice(i, 1);
    }

    // Ball zeichnen
    p.push();
    p.translate(ballX, ballY);
    p.scale(squashX, squashY);
    p.fill(255);
    p.stroke(56, 189, 248);
    p.strokeWeight(3);
    p.circle(0, 0, baseRadius * 2);
    p.pop();

    // Flash-Effekt über gesamte Arena
    if (flashAlpha > 0) {
      p.noStroke();
      p.fill(255, 255, 255, flashAlpha);
      p.rect(0, 0, WIDTH, HEIGHT);
      flashAlpha *= 0.7;
      if (flashAlpha < 2) flashAlpha = 0;
    }

    p.pop(); // Stellt Screen Shake Matrix wieder her

    // Statusanzeige oben rechts
    p.noStroke();
    p.fill(15, 23, 42, 220);
    p.rect(15, 15, 260, 95, 6);
    p.stroke(30, 41, 59);
    p.strokeWeight(1);
    p.noFill();
    p.rect(15, 15, 260, 95, 6);

    p.noStroke();
    p.fill(148, 163, 184);
    p.textSize(12);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Aktive Game-Feel Effekte:", 25, 24);

    drawStatusIndicator(p, 25, 45, "Screen Shake", enableShake);
    drawStatusIndicator(p, 145, 45, "Particles", enableParticles);
    drawStatusIndicator(p, 25, 70, "Audio Synth", enableAudio);
    drawStatusIndicator(p, 145, 70, "Squash & Stretch", enableSquash);

    // Klick-Interaktion: Mausklick erzeugt manuellen Impuls
    if (p.mouseIsPressed) {
      if (p.mouseX >= 0 && p.mouseX <= WIDTH && p.mouseY >= 0 && p.mouseY <= HEIGHT) {
        ballX = p.mouseX;
        ballY = p.mouseY;
        ballVx = (Math.random() - 0.5) * 16;
        ballVy = (Math.random() - 0.5) * 16;
        triggerHit(ballX, ballY, ballVx > 0 ? -1 : 1, ballVy > 0 ? -1 : 1);
      }
    }
  };

  function drawStatusIndicator(p: p5, x: number, y: number, label: string, active: boolean) {
    p.fill(active ? [16, 185, 129] : [239, 68, 68]);
    p.circle(x + 5, y + 6, 8);
    p.fill(active ? 240 : 120);
    p.text(label, x + 15, y);
  }
};

new p5(sketch);
