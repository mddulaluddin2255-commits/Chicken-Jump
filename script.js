/**
 * Chicken Jump - Arcade HTML5 Game Engine & Controller
 * Mobile-first, responsive canvas graphics, procedural Web Audio SFX,
 * Anti-cheat virtual points engine, and Google AdSense integration.
 */

import {
  initFirebaseServices,
  onAuthStatusChange,
  getCurrentUser,
  signUpWithEmail,
  signInWithEmail,
  signInGuest,
  signOutUser,
  processPointsTransaction,
  recordGameRound,
  getTransactions,
  getGameHistory,
  generateUniqueId
} from './firebase-config.js';

// --- Sound Synthesizer (Web Audio API) ---
class ArcadeAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('chicken_jump_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('chicken_jump_muted', this.isMuted ? 'true' : 'false');
    return this.isMuted;
  }

  playJump() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch (e) {}
  }

  playTick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {}
  }

  playCollect() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.28);
      });
    } catch (e) {}
  }

  playCrash() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      // Low noise / thud
      const bufferSize = this.ctx.sampleRate * 0.35;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(80, now + 0.35);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      noise.start(now);

      // Downward squawk chirp
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.25);
      oscGain.gain.setValueAtTime(0.3, now);
      oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch (e) {}
  }

  playRewardJingle() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const chords = [440, 554.37, 659.25, 880];
      chords.forEach((freq, idx) => {
        const now = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.38);
      });
    } catch (e) {}
  }

  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {}
  }
}

const audio = new ArcadeAudioEngine();

// Multiplier ladder per successful road lane jump
const MULTIPLIERS = [
  1.00,  // Start safe curb (Lane 0)
  1.25,  // Lane 1
  1.55,  // Lane 2
  1.95,  // Lane 3
  2.50,  // Lane 4
  3.30,  // Lane 5
  4.50,  // Lane 6
  6.50,  // Lane 7
  9.80,  // Lane 8
  15.00, // Lane 9
  25.00, // Lane 10
  45.00, // Lane 11
  100.00 // Lane 12 - Legendary Crossing!
];

const GAME_COST_POINTS = 20;

// --- Canvas Game Controller ---
class ChickenJumpGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = 440;
    this.height = 330;

    // Camera & Lanes
    this.laneHeight = 62;
    this.totalLanes = MULTIPLIERS.length; // 0 to 12
    this.cameraY = 0;
    this.targetCameraY = 0;

    // Chicken Model
    this.chicken = {
      x: this.width / 2,
      y: this.getLaneY(0),
      currentLane: 0,
      targetY: this.getLaneY(0),
      isJumping: false,
      jumpProgress: 0,
      jumpDuration: 0.28,
      jumpHeight: 34,
      squash: 1,
      wingFlap: 0,
      blinkTimer: 0,
      isBlinking: false,
      peckTimer: 0,
      facing: 'up',
      status: 'idle' // 'idle', 'jumping', 'crashed', 'celebrating'
    };

    // Particles (feathers, coins, smoke)
    this.particles = [];

    // Moving Vehicles on Road Lanes
    this.vehicles = [];
    this.initVehicles();

    // Round Logic State
    this.isRoundActive = false;
    this.crashLaneIndex = -1; // Determined unpredictably on round start
    this.lastTimestamp = performance.now();

    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  resizeCanvas() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
    this.chicken.x = this.width / 2;
    this.chicken.y = this.getLaneY(this.chicken.currentLane);
    this.chicken.targetY = this.chicken.y;
    this.targetCameraY = Math.max(0, this.chicken.y - this.height * 0.7);
    this.cameraY = this.targetCameraY;
  }

  getLaneY(laneIdx) {
    // Lane 0 is at bottom curb
    const startY = this.height - 46;
    return startY - laneIdx * this.laneHeight;
  }

  initVehicles() {
    this.vehicles = [];
    const vehicleTypes = [
      { width: 44, height: 24, color: '#ef4444', name: 'Sports Car', speed: 90 },
      { width: 50, height: 26, color: '#facc15', name: 'Taxi', speed: 75 },
      { width: 56, height: 28, color: '#10b981', name: 'Van', speed: 65 },
      { width: 70, height: 30, color: '#3b82f6', name: 'Bus', speed: 50 },
      { width: 34, height: 18, color: '#ec4899', name: 'Scooter', speed: 110 }
    ];

    // Populate road lanes (lanes 1 to totalLanes - 1)
    for (let lane = 1; lane < this.totalLanes; lane++) {
      const direction = lane % 2 === 0 ? 1 : -1;
      const type = vehicleTypes[lane % vehicleTypes.length];
      const count = (lane % 3 === 0) ? 2 : 1;
      const baseSpeed = type.speed * (0.8 + (lane * 0.05));

      for (let c = 0; c < count; c++) {
        const spacing = (this.width + 100) / count;
        this.vehicles.push({
          lane: lane,
          x: direction === 1 ? -60 + c * spacing : this.width + 60 - c * spacing,
          y: this.getLaneY(lane),
          width: type.width,
          height: type.height,
          color: type.color,
          speed: baseSpeed * direction,
          direction: direction
        });
      }
    }
  }

  startRound() {
    this.isRoundActive = true;
    this.chicken.currentLane = 0;
    this.chicken.y = this.getLaneY(0);
    this.chicken.targetY = this.chicken.y;
    this.chicken.isJumping = false;
    this.chicken.status = 'idle';
    this.particles = [];

    // Unpredictable crash calculation:
    // Uses crypto randomness to determine crash index.
    // Crash can happen on any lane between 1 and 12 with realistic progressive odds,
    // making each jump unpredictable.
    const randArr = new Uint32Array(1);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(randArr);
    } else {
      randArr[0] = Math.floor(Math.random() * 0xFFFFFFFF);
    }
    const seed = (randArr[0] % 1000) / 1000;

    // Probability distribution curve:
    // Earlier lanes have lower hazard, higher lanes increase hazard, but any lane can crash!
    if (seed < 0.15) {
      this.crashLaneIndex = 1; // 15% chance crash on Lane 1
    } else if (seed < 0.35) {
      this.crashLaneIndex = 2; // 20%
    } else if (seed < 0.55) {
      this.crashLaneIndex = 3; // 20%
    } else if (seed < 0.70) {
      this.crashLaneIndex = 4; // 15%
    } else if (seed < 0.82) {
      this.crashLaneIndex = 5; // 12%
    } else if (seed < 0.90) {
      this.crashLaneIndex = 6; // 8%
    } else if (seed < 0.95) {
      this.crashLaneIndex = 7; // 5%
    } else if (seed < 0.98) {
      this.crashLaneIndex = 8; // 3%
    } else {
      this.crashLaneIndex = 9 + Math.floor(Math.random() * 4); // Rare high multiplier crash
    }

    this.targetCameraY = Math.max(0, this.chicken.y - this.height * 0.65);
    audio.playTick();
  }

  jumpForward() {
    if (!this.isRoundActive || this.chicken.isJumping || this.chicken.status === 'crashed') {
      return null;
    }

    const nextLane = this.chicken.currentLane + 1;
    this.chicken.isJumping = true;
    this.chicken.jumpProgress = 0;
    this.chicken.targetY = this.getLaneY(nextLane);
    this.chicken.status = 'jumping';
    audio.playJump();

    // Check if this jump lands on the crash lane!
    const willCrash = (nextLane >= this.crashLaneIndex);

    return {
      nextLane: nextLane,
      multiplier: MULTIPLIERS[nextLane] || MULTIPLIERS[MULTIPLIERS.length - 1],
      willCrash: willCrash
    };
  }

  handleCrash(laneIndex) {
    this.isRoundActive = false;
    this.chicken.status = 'crashed';
    audio.playCrash();

    // Spawn explosive feathers and star particles
    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 180;
      this.particles.push({
        x: this.chicken.x,
        y: this.chicken.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 50,
        size: 3 + Math.random() * 5,
        color: Math.random() > 0.4 ? '#facc15' : (Math.random() > 0.5 ? '#ef4444' : '#fff'),
        alpha: 1,
        life: 0.8 + Math.random() * 0.5,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  handleCollect() {
    this.isRoundActive = false;
    this.chicken.status = 'celebrating';
    audio.playCollect();

    // Spawn victory golden corn / star particles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 140;
      this.particles.push({
        x: this.chicken.x,
        y: this.chicken.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        size: 4 + Math.random() * 4,
        color: Math.random() > 0.3 ? '#fbbf24' : '#34d399',
        alpha: 1,
        life: 1.0 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  update(dt) {
    // Update vehicles
    for (const v of this.vehicles) {
      v.x += v.speed * dt;
      if (v.direction === 1 && v.x > this.width + 70) {
        v.x = -70;
      } else if (v.direction === -1 && v.x < -70) {
        v.x = this.width + 70;
      }
    }

    // Update Chicken Jump animation
    if (this.chicken.isJumping) {
      this.chicken.jumpProgress += dt / this.chicken.jumpDuration;
      if (this.chicken.jumpProgress >= 1) {
        this.chicken.jumpProgress = 1;
        this.chicken.isJumping = false;
        this.chicken.currentLane += 1;
        this.chicken.y = this.chicken.targetY;
        this.chicken.squash = 0.75; // Landing squash effect

        // Trigger step sound/tick
        audio.playTick();

        // Check if round ended due to crash on this lane
        if (this.chicken.currentLane >= this.crashLaneIndex && this.isRoundActive) {
          this.handleCrash(this.chicken.currentLane);
        } else {
          this.chicken.status = 'idle';
        }
      } else {
        const p = this.chicken.jumpProgress;
        // Parabolic arc for y position
        const fromY = this.getLaneY(this.chicken.currentLane);
        const toY = this.chicken.targetY;
        const arc = Math.sin(p * Math.PI) * this.chicken.jumpHeight;
        this.chicken.y = (fromY + (toY - fromY) * p) - arc;
        this.chicken.wingFlap = Math.sin(p * Math.PI * 5);
        this.chicken.squash = 1 + Math.sin(p * Math.PI) * 0.2;
      }
    } else {
      // Rebound from squash
      if (this.chicken.squash < 1) {
        this.chicken.squash += dt * 3;
        if (this.chicken.squash > 1) this.chicken.squash = 1;
      }

      // Cute idle animations: blinking & pecking
      this.chicken.blinkTimer += dt;
      if (this.chicken.blinkTimer > 2.8) {
        this.chicken.isBlinking = true;
        if (this.chicken.blinkTimer > 3.0) {
          this.chicken.isBlinking = false;
          this.chicken.blinkTimer = 0;
        }
      }

      this.chicken.peckTimer += dt;
      this.chicken.wingFlap = Math.sin(this.chicken.peckTimer * 2) * 0.15;
    }

    // Camera following chicken smoothly
    this.targetCameraY = Math.max(0, (this.height - 120) - this.chicken.y);
    this.cameraY += (this.targetCameraY - this.cameraY) * Math.min(1, dt * 6);

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vy += 300 * dt; // Gravity
      pt.rotation += pt.rotSpeed * dt;
      pt.life -= dt;
      pt.alpha = Math.max(0, pt.life);
      if (pt.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.ctx.save();
    // Apply camera vertical scroll
    this.ctx.translate(0, this.cameraY);

    // Draw Lanes
    for (let lane = 0; lane < this.totalLanes; lane++) {
      const y = this.getLaneY(lane);
      const isStartCurb = (lane === 0);

      if (isStartCurb) {
        // Sidewalk / Grass Start
        this.ctx.fillStyle = '#1e3a2b';
        this.ctx.fillRect(0, y - this.laneHeight / 2, this.width, this.laneHeight);

        // Grass details
        this.ctx.fillStyle = '#22c55e';
        this.ctx.fillRect(0, y - this.laneHeight / 2, this.width, 6);

        // Checkered Start Line
        const checkSize = 10;
        for (let x = 0; x < this.width; x += checkSize * 2) {
          this.ctx.fillStyle = '#f8fafc';
          this.ctx.fillRect(x, y - this.laneHeight / 2 + 6, checkSize, 6);
          this.ctx.fillStyle = '#0f172a';
          this.ctx.fillRect(x + checkSize, y - this.laneHeight / 2 + 6, checkSize, 6);
        }

        // Start curb text
        this.ctx.fillStyle = '#86efac';
        this.ctx.font = '700 11px system-ui';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('STARTING CURB (SAFE ZONE)', 14, y + 10);
      } else {
        // Asphalt Road Lane
        this.ctx.fillStyle = (lane % 2 === 0) ? '#1e2638' : '#171f2e';
        this.ctx.fillRect(0, y - this.laneHeight / 2, this.width, this.laneHeight);

        // Lane Separator Dashes
        this.ctx.strokeStyle = '#3b4968';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([14, 12]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, y - this.laneHeight / 2);
        this.ctx.lineTo(this.width, y - this.laneHeight / 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Multiplier Badge on side of lane
        const mult = MULTIPLIERS[lane];
        const isCurrent = (this.chicken.currentLane === lane);
        this.ctx.fillStyle = isCurrent ? '#fbbf24' : '#475569';
        this.ctx.font = isCurrent ? '800 12px system-ui' : '700 10px system-ui';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${mult.toFixed(2)}x`, this.width - 12, y + 4);

        // Small indicator on left
        this.ctx.fillStyle = '#334155';
        this.ctx.font = '600 10px system-ui';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`LANE ${lane}`, 12, y + 4);
      }
    }

    // Draw Moving Vehicles on Road
    for (const v of this.vehicles) {
      this.drawVehicle(v);
    }

    // Draw Chicken Character
    this.drawChicken();

    // Draw Particles
    for (const pt of this.particles) {
      this.ctx.save();
      this.ctx.globalAlpha = pt.alpha;
      this.ctx.translate(pt.x, pt.y);
      this.ctx.rotate(pt.rotation);
      this.ctx.fillStyle = pt.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, pt.size, pt.size * 1.5, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  drawVehicle(v) {
    const isTruck = v.width >= 65;
    this.ctx.save();
    this.ctx.translate(v.x, v.y);

    // Vehicle Shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 6, v.width / 2 + 3, v.height / 2, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Vehicle Body
    this.ctx.fillStyle = v.color;
    this.ctx.beginPath();
    this.ctx.roundRect(-v.width / 2, -v.height / 2, v.width, v.height, 6);
    this.ctx.fill();

    // Windshield & Windows
    this.ctx.fillStyle = '#0f172a';
    const glassWidth = isTruck ? 14 : 10;
    const glassX = v.direction === 1 ? v.width / 4 - 2 : -v.width / 4 - glassWidth + 2;
    this.ctx.beginPath();
    this.ctx.roundRect(glassX, -v.height / 2 + 4, glassWidth, v.height - 8, 3);
    this.ctx.fill();

    // Headlights
    this.ctx.fillStyle = '#fef08a';
    const lightX = v.direction === 1 ? v.width / 2 - 2 : -v.width / 2;
    this.ctx.fillRect(lightX, -v.height / 2 + 3, 3, 4);
    this.ctx.fillRect(lightX, v.height / 2 - 7, 3, 4);

    this.ctx.restore();
  }

  drawChicken() {
    const c = this.chicken;
    this.ctx.save();
    this.ctx.translate(c.x, c.y);

    // Character Shadow
    const shadowScale = c.isJumping ? Math.max(0.4, 1 - (c.jumpProgress * 0.5)) : c.squash;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 10, 14 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Scale with squash & stretch
    this.ctx.scale(1 / c.squash, c.squash);

    if (c.status === 'crashed') {
      // Funny dizzy spin on crash
      this.ctx.rotate(0.4);
    }

    // Little Legs / Feet
    this.ctx.fillStyle = '#f97316';
    this.ctx.fillRect(-6, 8, 3, 6);
    this.ctx.fillRect(3, 8, 3, 6);
    this.ctx.fillRect(-8, 13, 6, 2);
    this.ctx.fillRect(2, 13, 6, 2);

    // Main Body (Cute round plump chick)
    this.ctx.fillStyle = '#fde047';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
    this.ctx.fill();

    // Wing Flaps
    this.ctx.fillStyle = '#eab308';
    // Left Wing
    this.ctx.save();
    this.ctx.translate(-14, 0);
    this.ctx.rotate(-c.wingFlap);
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 5, 8, 0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Right Wing
    this.ctx.save();
    this.ctx.translate(14, 0);
    this.ctx.rotate(c.wingFlap);
    this.ctx.beginPath();
    this.ctx.ellipse(0, 0, 5, 8, -0.2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();

    // Head / Comb
    this.ctx.fillStyle = '#ef4444'; // Red chicken comb
    this.ctx.beginPath();
    this.ctx.arc(-4, -14, 4, 0, Math.PI * 2);
    this.ctx.arc(0, -16, 4.5, 0, Math.PI * 2);
    this.ctx.arc(4, -14, 4, 0, Math.PI * 2);
    this.ctx.fill();

    // Beak
    this.ctx.fillStyle = '#f97316';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -8);
    this.ctx.lineTo(-4, -2);
    this.ctx.lineTo(4, -2);
    this.ctx.closePath();
    this.ctx.fill();

    // Eyes (Animated blinking or dizzy X eyes if crashed)
    if (c.status === 'crashed') {
      // Dizzy X eyes
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2;
      // Left eye X
      this.ctx.beginPath();
      this.ctx.moveTo(-7, -7);
      this.ctx.lineTo(-3, -3);
      this.ctx.moveTo(-3, -7);
      this.ctx.lineTo(-7, -3);
      // Right eye X
      this.ctx.moveTo(3, -7);
      this.ctx.lineTo(7, -3);
      this.ctx.moveTo(7, -7);
      this.ctx.lineTo(3, -3);
      this.ctx.stroke();
    } else if (c.isBlinking) {
      // Closed eye slit
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(-7, -5);
      this.ctx.lineTo(-3, -5);
      this.ctx.moveTo(3, -5);
      this.ctx.lineTo(7, -5);
      this.ctx.stroke();
    } else {
      // Big cartoon eyes
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(-5, -5, 3.5, 0, Math.PI * 2);
      this.ctx.arc(5, -5, 3.5, 0, Math.PI * 2);
      this.ctx.fill();

      // Pupil
      this.ctx.fillStyle = '#0f172a';
      this.ctx.beginPath();
      this.ctx.arc(-5, -5, 1.8, 0, Math.PI * 2);
      this.ctx.arc(5, -5, 1.8, 0, Math.PI * 2);
      this.ctx.fill();

      // Eye glint
      this.ctx.fillStyle = '#fff';
      this.ctx.beginPath();
      this.ctx.arc(-6, -6, 0.8, 0, Math.PI * 2);
      this.ctx.arc(4, -6, 0.8, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  loop(timestamp) {
    const dt = Math.min(0.1, (timestamp - this.lastTimestamp) / 1000);
    this.lastTimestamp = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  }
}

// --- VAST 3.0 Video Ad Configuration ---
export const VAST_3_CONFIG = {
  tagUrl: 'https://crookedagreement.com/dJmeF.ztd/GwNwvdZWG/U_/Ce/mz9/uwZbUhlFkKPLTdcG0BMoj/M/1cNdTFMntAN/zHQUyJMozUUN1QNzwx',
  defaultDuration: 15
};

function sendVastBeacon(url) {
  if (!url) return;
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url);
    } else {
      const img = new Image();
      img.src = url;
    }
  } catch {
    try {
      fetch(url, { mode: 'no-cors', keepalive: true });
    } catch (_) {}
  }
}

function parseVastXml(xmlString) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
      return null;
    }

    // Extract MediaFiles
    const mediaNodes = xmlDoc.getElementsByTagName('MediaFile');
    let mediaFileUrl = '';
    for (let i = 0; i < mediaNodes.length; i++) {
      const src = mediaNodes[i].textContent ? mediaNodes[i].textContent.trim() : '';
      if (src) {
        mediaFileUrl = src;
        const type = mediaNodes[i].getAttribute('type') || '';
        if (type.includes('mp4') || type.includes('webm')) {
          break;
        }
      }
    }

    // Extract ClickThrough
    const clickNodes = xmlDoc.getElementsByTagName('ClickThrough');
    let clickThroughUrl = '';
    if (clickNodes.length > 0 && clickNodes[0].textContent) {
      clickThroughUrl = clickNodes[0].textContent.trim();
    }

    // Extract ClickTracking
    const clickTrackingNodes = xmlDoc.getElementsByTagName('ClickTracking');
    const clickTrackingUrls = [];
    for (let i = 0; i < clickTrackingNodes.length; i++) {
      const url = clickTrackingNodes[i].textContent ? clickTrackingNodes[i].textContent.trim() : '';
      if (url) clickTrackingUrls.push(url);
    }

    // Extract Impressions
    const impressionNodes = xmlDoc.getElementsByTagName('Impression');
    const impressionUrls = [];
    for (let i = 0; i < impressionNodes.length; i++) {
      const url = impressionNodes[i].textContent ? impressionNodes[i].textContent.trim() : '';
      if (url) impressionUrls.push(url);
    }

    // Extract TrackingEvents
    const trackingNodes = xmlDoc.getElementsByTagName('Tracking');
    const trackingEvents = {};
    for (let i = 0; i < trackingNodes.length; i++) {
      const event = trackingNodes[i].getAttribute('event');
      const url = trackingNodes[i].textContent ? trackingNodes[i].textContent.trim() : '';
      if (event && url) {
        if (!trackingEvents[event]) trackingEvents[event] = [];
        trackingEvents[event].push(url);
      }
    }

    // Extract Duration
    const durationNodes = xmlDoc.getElementsByTagName('Duration');
    let durationSeconds = 15;
    if (durationNodes.length > 0 && durationNodes[0].textContent) {
      const parts = durationNodes[0].textContent.trim().split(':');
      if (parts.length === 3) {
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const s = parseFloat(parts[2]) || 0;
        const total = h * 3600 + m * 60 + s;
        if (total > 0 && total <= 60) durationSeconds = Math.round(total);
      }
    }

    return {
      mediaFileUrl,
      clickThroughUrl,
      clickTrackingUrls,
      impressionUrls,
      trackingEvents,
      durationSeconds
    };
  } catch (e) {
    console.warn('VAST XML parse error:', e);
    return null;
  }
}

// --- Rewarded Video Ad System (VAST 3.0 Engine) ---
class RewardedAdManager {
  constructor() {
    this.isOpen = false;
    this.timer = 15;
    this.totalDuration = 15;
    this.timerInterval = null;
    this.completionToken = null;
    this.onRewardGranted = null;
    this.vastData = null;
    this.videoEl = null;
    this.trackedEvents = new Set();
    this.vastTagUrl = VAST_3_CONFIG.tagUrl;

    this.modalEl = document.getElementById('rewardAdModal');
    this.timerTextEl = document.getElementById('adTimerText');
    this.progressBarEl = document.getElementById('adProgressBar');
    this.skipBtn = document.getElementById('adSkipBtn');
    this.installBtn = document.getElementById('adInstallBtn');
    this.adUnitBox = document.getElementById('admobUnitBox');
    this.canvas = document.getElementById('adSponsorCanvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;

    this.setupEvents();
  }

  setupEvents() {
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => this.handleEarlyCloseAttempt());
    }
    if (this.installBtn) {
      this.installBtn.addEventListener('click', () => {
        audio.playClick();
        this.handleClickThrough();
      });
    }
  }

  handleClickThrough() {
    const targetUrl = (this.vastData && this.vastData.clickThroughUrl) ? this.vastData.clickThroughUrl : this.vastTagUrl;
    if (this.vastData && this.vastData.clickTrackingUrls) {
      this.vastData.clickTrackingUrls.forEach(sendVastBeacon);
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }

  async showRewardedAd(onRewardCallback) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.onRewardGranted = onRewardCallback;
    this.totalDuration = 15;
    this.timer = 15;
    this.trackedEvents.clear();
    this.completionToken = generateUniqueId('vast_reward');

    this.modalEl.classList.add('open');
    this.updateUI();

    // Render interactive canvas preview with VAST 3.0 details
    this.startSponsorAnimation();

    // Initialize VAST 3.0 Player
    await this.initVastPlayer();

    // Run countdown loop
    this.startTimer();
  }

  async initVastPlayer() {
    if (!this.adUnitBox) return;
    this.adUnitBox.innerHTML = '';

    try {
      // Request VAST 3.0 XML
      const res = await fetch(this.vastTagUrl, { method: 'GET', mode: 'cors' });
      if (res.ok) {
        const text = await res.text();
        this.vastData = parseVastXml(text);
      }
    } catch (e) {
      console.info('VAST direct fetch handled (CORS/network fallback applied):', e);
    }

    if (this.vastData && this.vastData.mediaFileUrl) {
      // Fire impression beacons
      if (this.vastData.impressionUrls) {
        this.vastData.impressionUrls.forEach(sendVastBeacon);
      }

      if (this.vastData.durationSeconds) {
        this.totalDuration = this.vastData.durationSeconds;
        this.timer = this.totalDuration;
        this.updateUI();
      }

      this.videoEl = document.createElement('video');
      this.videoEl.className = 'vast-video-player';
      this.videoEl.src = this.vastData.mediaFileUrl;
      this.videoEl.autoplay = true;
      this.videoEl.playsInline = true;
      this.videoEl.setAttribute('webkit-playsinline', 'true');
      this.videoEl.muted = true;

      // Audio toggle button
      const muteBtn = document.createElement('button');
      muteBtn.type = 'button';
      muteBtn.className = 'vast-mute-toggle-btn';
      muteBtn.innerHTML = '🔇';
      muteBtn.title = 'Unmute Video';
      muteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this.videoEl) {
          this.videoEl.muted = !this.videoEl.muted;
          muteBtn.innerHTML = this.videoEl.muted ? '🔇' : '🔊';
        }
      });

      // Overlay sponsor badge
      const overlayBadge = document.createElement('div');
      overlayBadge.className = 'vast-ad-click-overlay';
      overlayBadge.textContent = 'VAST 3.0 Video • Click to Visit';

      this.videoEl.addEventListener('click', () => {
        this.handleClickThrough();
      });

      this.videoEl.addEventListener('play', () => {
        this.fireTracking('start');
      });

      this.videoEl.addEventListener('timeupdate', () => {
        if (!this.videoEl || !this.videoEl.duration) return;
        const current = this.videoEl.currentTime;
        const dur = this.videoEl.duration;
        const ratio = current / dur;
        this.timer = Math.max(0, Math.ceil(dur - current));
        this.updateUI();

        if (ratio >= 0.25) this.fireTracking('firstQuartile');
        if (ratio >= 0.5) this.fireTracking('midpoint');
        if (ratio >= 0.75) this.fireTracking('thirdQuartile');
      });

      this.videoEl.addEventListener('ended', () => {
        this.fireTracking('complete');
        this.completeAdReward();
      });

      this.videoEl.addEventListener('error', (err) => {
        console.warn('Video element playback error, falling back to canvas:', err);
        if (this.adUnitBox) this.adUnitBox.innerHTML = '';
      });

      this.adUnitBox.appendChild(this.videoEl);
      this.adUnitBox.appendChild(muteBtn);
      this.adUnitBox.appendChild(overlayBadge);

      try {
        const playPromise = this.videoEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Video auto-play prevented, waiting user interaction:', err);
          });
        }
      } catch (_) {}
    }
  }

  fireTracking(eventName) {
    if (this.trackedEvents.has(eventName)) return;
    this.trackedEvents.add(eventName);
    if (this.vastData && this.vastData.trackingEvents && this.vastData.trackingEvents[eventName]) {
      this.vastData.trackingEvents[eventName].forEach(sendVastBeacon);
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.timer--;
      this.updateUI();

      if (this.timer <= 0) {
        this.completeAdReward();
      }
    }, 1000);
  }

  updateUI() {
    if (this.timerTextEl) {
      this.timerTextEl.textContent = `Reward in ${this.timer}s`;
    }
    if (this.progressBarEl) {
      const denom = Math.max(1, this.totalDuration);
      const progress = ((denom - this.timer) / denom) * 100;
      this.progressBarEl.style.width = `${progress}%`;
    }
  }

  handleEarlyCloseAttempt() {
    if (this.timer <= 0) {
      this.closeAd();
      return;
    }

    const confirmQuit = confirm('Wait! If you close this VAST video ad before completion, you will NOT receive the +200 free points. Close anyway?');
    if (confirmQuit) {
      this.abandonAd();
    }
  }

  cleanupVideo() {
    if (this.videoEl) {
      try {
        this.videoEl.pause();
        this.videoEl.src = '';
        this.videoEl.load();
      } catch (_) {}
      this.videoEl = null;
    }
    if (this.adUnitBox) {
      this.adUnitBox.innerHTML = '';
    }
  }

  abandonAd() {
    clearInterval(this.timerInterval);
    this.cleanupVideo();
    this.isOpen = false;
    this.onRewardGranted = null;
    this.completionToken = null;
    this.modalEl.classList.remove('open');
  }

  completeAdReward() {
    if (!this.isOpen) return;
    clearInterval(this.timerInterval);
    audio.playRewardJingle();

    if (this.timerTextEl) {
      this.timerTextEl.textContent = 'Reward Ready! 🎉';
    }

    const token = this.completionToken || generateUniqueId('vast_reward');
    const callback = this.onRewardGranted;

    setTimeout(() => {
      this.cleanupVideo();
      this.isOpen = false;
      this.modalEl.classList.remove('open');
      if (typeof callback === 'function') {
        callback(token);
      }
      this.onRewardGranted = null;
      this.completionToken = null;
    }, 800);
  }

  closeAd() {
    clearInterval(this.timerInterval);
    this.cleanupVideo();
    this.isOpen = false;
    this.modalEl.classList.remove('open');
  }

  startSponsorAnimation() {
    if (!this.ctx) return;
    let t = 0;
    const drawAd = () => {
      if (!this.isOpen) return;
      t += 0.04;
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx.clearRect(0, 0, w, h);

      // Deep modern gradient background
      const grad = this.ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#090d16');
      grad.addColorStop(1, '#1e1b4b');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, w, h);

      // Ambient animated particles
      for (let i = 0; i < 6; i++) {
        const x = (w * 0.18 * i + Math.sin(t + i) * 24 + 30) % w;
        const y = (h * 0.5 + Math.cos(t * 1.2 + i * 1.5) * 35);
        this.ctx.fillStyle = `hsla(${(t * 40 + i * 60) % 360}, 85%, 65%, 0.7)`;
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10 + Math.sin(t * 2 + i) * 4, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Sponsor Badge Icon & Header
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('VAST 3.0 REWARDED VIDEO', w / 2, h / 2 - 38);

      // Main Callout
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '800 17px system-ui, -apple-system, sans-serif';
      this.ctx.fillText('Watch to Earn +200 Points', w / 2, h / 2 - 12);

      // Unit info badge box
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const boxW = 320;
      const boxH = 34;
      this.ctx.roundRect(w / 2 - boxW / 2, h / 2 + 6, boxW, boxH, 6);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      this.ctx.stroke();

      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.font = '11px monospace';
      this.ctx.fillText('crookedagreement.com (VAST 3.0)', w / 2, h / 2 + 28);

      // Bottom prompt
      this.ctx.fillStyle = '#a5b4fc';
      this.ctx.font = '11px system-ui, sans-serif';
      this.ctx.fillText(`Reward unlocked in ${this.timer} seconds`, w / 2, h / 2 + 60);

      requestAnimationFrame(drawAd);
    };
    requestAnimationFrame(drawAd);
  }
}

// --- App Orchestration & UI Controller ---
document.addEventListener('DOMContentLoaded', async () => {
  const canvas = document.getElementById('gameCanvas');
  const game = new ChickenJumpGame(canvas);
  const rewardedAd = new RewardedAdManager();

  // Elements
  const currentPointsEl = document.getElementById('currentPointsVal');
  const currentMultiplierEl = document.getElementById('currentMultiplierVal');
  const potentialPayoutEl = document.getElementById('potentialPayoutVal');
  const potentialPill = document.getElementById('potentialPill');
  const userIdentifierEl = document.getElementById('userIdentifier');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconEl = document.getElementById('soundIcon');
  const authTriggerBtn = document.getElementById('authTriggerBtn');
  const authModal = document.getElementById('authModal');
  const authCloseBtn = document.getElementById('authCloseBtn');
  const authForm = document.getElementById('authForm');
  const authEmailInput = document.getElementById('authEmail');
  const authPassInput = document.getElementById('authPass');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authModalTitle = document.getElementById('authModalTitle');
  const authSwitchLink = document.getElementById('authSwitchLink');
  const authGuestBtn = document.getElementById('authGuestBtn');
  const notEnoughPointsBanner = document.getElementById('notEnoughPointsBanner');

  // Primary Control Buttons
  const btnStart = document.getElementById('btnStart');
  const btnJump = document.getElementById('btnJump');
  const btnCollect = document.getElementById('btnCollect');
  const btnRewardAd = document.getElementById('btnRewardAd');
  const canvasTapHint = document.getElementById('canvasTapHint');

  // Game Result Overlay
  const gameResultOverlay = document.getElementById('gameResultOverlay');
  const resultBadge = document.getElementById('resultBadge');
  const resultTitle = document.getElementById('resultTitle');
  const resultSubtitle = document.getElementById('resultSubtitle');
  const resultCloseBtn = document.getElementById('resultCloseBtn');

  // Tabs & Lists
  const tabHistoryBtn = document.getElementById('tabHistoryBtn');
  const tabLedgerBtn = document.getElementById('tabLedgerBtn');
  const historyContent = document.getElementById('historyContent');
  const ledgerContent = document.getElementById('ledgerContent');
  const gameHistoryList = document.getElementById('gameHistoryList');
  const transactionsList = document.getElementById('transactionsList');
  const recentChipsRow = document.getElementById('recentChipsRow');
  const celebrationToast = document.getElementById('celebrationToast');
  const toastMessage = document.getElementById('toastMessage');

  let isAuthModeLogin = true;

  function showToast(msg) {
    if (toastMessage && celebrationToast) {
      toastMessage.textContent = msg;
      celebrationToast.classList.add('show');
      setTimeout(() => {
        celebrationToast.classList.remove('show');
      }, 3000);
    }
  }

  function updateSoundIcon() {
    if (soundIconEl) {
      soundIconEl.textContent = audio.isMuted ? '🔇' : '🔊';
    }
  }
  updateSoundIcon();

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      audio.toggleMute();
      updateSoundIcon();
    });
  }

  // --- Auth & Points Sync Listener ---
  onAuthStatusChange((user) => {
    const pts = user ? user.points : 0;
    if (currentPointsEl) currentPointsEl.textContent = pts.toLocaleString();

    if (userIdentifierEl) {
      userIdentifierEl.textContent = user.isGuest ? 'Guest Player' : user.email;
    }
    if (authTriggerBtn) {
      authTriggerBtn.textContent = user.isGuest ? 'Sign In' : 'Sign Out';
    }

    // Check if points are sufficient for 20-point start
    if (pts < GAME_COST_POINTS) {
      btnStart.disabled = true;
      notEnoughPointsBanner.classList.add('show');
    } else {
      if (!game.isRoundActive) {
        btnStart.disabled = false;
      }
      notEnoughPointsBanner.classList.remove('show');
    }

    refreshHistoryAndLedger();
  });

  // Initialize Firebase (or secure local engine fallback)
  await initFirebaseServices();

  // --- Round State Management ---
  function syncUIForRoundState() {
    const user = getCurrentUser();
    const pts = user ? user.points : 0;

    if (game.isRoundActive) {
      btnStart.style.display = 'none';
      btnJump.style.display = 'flex';
      canvasTapHint.classList.add('show');

      const currentLane = game.chicken.currentLane;
      const currentMult = MULTIPLIERS[currentLane];
      const nextMult = MULTIPLIERS[currentLane + 1] || currentMult;
      const collectPoints = Math.floor(GAME_COST_POINTS * currentMult);

      currentMultiplierEl.textContent = `${currentMult.toFixed(2)}x`;
      btnJump.textContent = `JUMP! (${nextMult.toFixed(2)}x)`;

      // Only show COLLECT button and potential payout after the player jumps onto the road (currentLane >= 1)
      if (currentLane >= 1) {
        btnCollect.style.display = 'flex';
        btnCollect.disabled = false;
        btnCollect.textContent = `COLLECT (${collectPoints} PTS)`;
        potentialPayoutEl.textContent = `${collectPoints} PTS`;
        if (potentialPill) potentialPill.style.display = 'flex';
      } else {
        // At starting curb (Lane 0), do not show COLLECT 20 PTS
        btnCollect.style.display = 'none';
        potentialPayoutEl.textContent = '0 PTS';
        if (potentialPill) potentialPill.style.display = 'none';
      }
    } else {
      btnStart.style.display = 'flex';
      btnJump.style.display = 'none';
      btnCollect.style.display = 'none';
      canvasTapHint.classList.remove('show');

      currentMultiplierEl.textContent = '1.00x';
      potentialPayoutEl.textContent = '0 PTS';
      if (potentialPill) potentialPill.style.display = 'none';

      if (pts < GAME_COST_POINTS) {
        btnStart.disabled = true;
        notEnoughPointsBanner.classList.add('show');
      } else {
        btnStart.disabled = false;
        notEnoughPointsBanner.classList.remove('show');
      }
    }
  }

  // START GAME – 20 POINTS
  btnStart.addEventListener('click', async () => {
    audio.playClick();
    const user = getCurrentUser();
    if (!user || user.points < GAME_COST_POINTS) {
      notEnoughPointsBanner.classList.add('show');
      return;
    }

    if (game.isRoundActive) return;

    btnStart.disabled = true;
    try {
      // 1. Deduct exactly 20 points immediately
      await processPointsTransaction({
        type: 'game_start',
        amount: -GAME_COST_POINTS,
        metadata: 'Game Round Entry: -20 Points'
      });

      // 2. Start chicken round
      game.startRound();
      gameResultOverlay.classList.remove('active');
      syncUIForRoundState();
    } catch (err) {
      alert(err.message || 'Could not start game.');
      syncUIForRoundState();
    }
  });

  // JUMP ACTION
  async function performJump() {
    if (!game.isRoundActive || game.chicken.isJumping) return;

    const jumpResult = game.jumpForward();
    if (!jumpResult) return;

    const { nextLane, multiplier, willCrash } = jumpResult;

    if (willCrash) {
      // Round will crash when chicken lands
      setTimeout(async () => {
        // Record crashed round in history
        await recordGameRound({
          multiplier: multiplier,
          payout: 0,
          status: 'crashed',
          jumpsCount: nextLane
        });

        // Show Crash Overlay
        resultBadge.className = 'result-badge loss';
        resultBadge.textContent = '💥 CRASHED';
        resultTitle.textContent = `Crashed at ${multiplier.toFixed(2)}x`;
        resultSubtitle.textContent = 'Lost 20 Points. Jump again to conquer the road!';
        gameResultOverlay.classList.add('active');

        syncUIForRoundState();
        refreshHistoryAndLedger();
      }, game.chicken.jumpDuration * 1000 + 40);
    } else {
      // Successful Jump!
      setTimeout(() => {
        syncUIForRoundState();
      }, game.chicken.jumpDuration * 1000 + 10);
    }
  }

  btnJump.addEventListener('click', () => {
    performJump();
  });

  // Canvas Tap/Click to jump
  canvas.addEventListener('click', (e) => {
    e.preventDefault();
    if (game.isRoundActive) {
      performJump();
    }
  });

  // Keyboard shortcut: Spacebar or ArrowUp to jump
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      if (game.isRoundActive) {
        e.preventDefault();
        performJump();
      }
    }
  });

  // COLLECT ACTION
  btnCollect.addEventListener('click', async () => {
    if (!game.isRoundActive || game.chicken.isJumping || game.chicken.currentLane < 1) return;

    btnCollect.disabled = true;
    const currentMult = MULTIPLIERS[game.chicken.currentLane];
    const payout = Math.floor(GAME_COST_POINTS * currentMult);
    const profit = payout - GAME_COST_POINTS;

    game.handleCollect();

    try {
      // Credit collected winnings to balance
      await processPointsTransaction({
        type: 'game_collect',
        amount: payout,
        metadata: `Collected Round at ${currentMult.toFixed(2)}x (+${payout} Points)`
      });

      await recordGameRound({
        multiplier: currentMult,
        payout: payout,
        status: 'collected',
        jumpsCount: game.chicken.currentLane
      });

      // Show Win Overlay
      resultBadge.className = 'result-badge win';
      resultBadge.textContent = '🎉 COLLECTED!';
      resultTitle.textContent = `Won +${payout} Points!`;
      resultSubtitle.textContent = `Multiplier: ${currentMult.toFixed(2)}x • Net Profit: +${profit} PTS`;
      gameResultOverlay.classList.add('active');

      showToast(`+${payout} Points Collected!`);
    } catch (err) {
      console.error(err);
    } finally {
      btnCollect.disabled = false;
      syncUIForRoundState();
      refreshHistoryAndLedger();
    }
  });

  resultCloseBtn.addEventListener('click', () => {
    gameResultOverlay.classList.remove('active');
  });

  // WATCH AD → EARN 200 POINTS
  btnRewardAd.addEventListener('click', () => {
    audio.playClick();
    btnRewardAd.disabled = true;

    rewardedAd.showRewardedAd(async (token) => {
      btnRewardAd.disabled = false;
      if (!token) return;

      try {
        // Add +200 virtual points upon verified completion
        await processPointsTransaction({
          type: 'rewarded_ad',
          amount: 200,
          metadata: `Rewarded Ad Completed (${token})`
        });

        showToast('🎉 +200 Points Added To Your Balance!');
      } catch (err) {
        alert(err.message || 'Failed to credit reward.');
      }
    });

    // Re-enable button if ad is canceled
    setTimeout(() => {
      btnRewardAd.disabled = false;
    }, 1000);
  });

  // --- History & Ledger Rendering ---
  function refreshHistoryAndLedger() {
    const history = getGameHistory();
    const txs = getTransactions();

    // 1. Recent Result Pills
    if (recentChipsRow) {
      recentChipsRow.innerHTML = '';
      const recents = history.slice(0, 6);
      if (recents.length === 0) {
        recentChipsRow.innerHTML = '<span style="font-size:11px;color:#64748b;">No recent rounds played yet.</span>';
      } else {
        recents.forEach(r => {
          const chip = document.createElement('div');
          const isWin = r.status === 'collected';
          chip.className = `result-chip ${isWin ? 'collected' : 'crashed'}`;
          chip.innerHTML = `${isWin ? '✓' : '✕'} ${r.multiplier.toFixed(2)}x ${isWin ? `(+${r.payout})` : ''}`;
          recentChipsRow.appendChild(chip);
        });
      }
    }

    // 2. Full Game History
    if (gameHistoryList) {
      gameHistoryList.innerHTML = '';
      if (history.length === 0) {
        gameHistoryList.innerHTML = '<div class="history-empty-text">No games recorded yet. Press Start Game – 20 Points to play!</div>';
      } else {
        history.slice(0, 20).forEach(item => {
          const isWin = item.status === 'collected';
          const el = document.createElement('div');
          el.className = 'history-item';
          const timeStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          el.innerHTML = `
            <div class="history-item-left">
              <span class="history-item-title">${isWin ? '🎉 Collected' : '💥 Crashed'} (${item.multiplier.toFixed(2)}x)</span>
              <span class="history-item-meta">${item.jumpsCount} Jumps • ${timeStr} • ID: ${item.roundId.substring(0, 14)}...</span>
            </div>
            <div class="history-item-right">
              <span class="history-amount ${isWin ? 'positive' : 'negative'}">
                ${isWin ? `+${item.payout}` : '-20'} PTS
              </span>
            </div>
          `;
          gameHistoryList.appendChild(el);
        });
      }
    }

    // 3. Transactions Ledger
    if (transactionsList) {
      transactionsList.innerHTML = '';
      if (txs.length === 0) {
        transactionsList.innerHTML = '<div class="history-empty-text">No ledger transactions found.</div>';
      } else {
        txs.slice(0, 20).forEach(tx => {
          const isPos = tx.amount >= 0;
          const el = document.createElement('div');
          el.className = 'history-item';
          const timeStr = new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          el.innerHTML = `
            <div class="history-item-left">
              <span class="history-item-title">${tx.metadata || tx.type}</span>
              <span class="history-item-meta">${timeStr} • TX: ${tx.transactionId.substring(0, 16)}...</span>
            </div>
            <div class="history-item-right">
              <span class="history-amount ${isPos ? 'positive' : 'negative'}">
                ${isPos ? `+${tx.amount}` : tx.amount} PTS
              </span>
              <span class="history-item-meta">Bal: ${tx.balanceAfter}</span>
            </div>
          `;
          transactionsList.appendChild(el);
        });
      }
    }
  }

  // Tab switching
  if (tabHistoryBtn && tabLedgerBtn) {
    tabHistoryBtn.addEventListener('click', () => {
      audio.playClick();
      tabHistoryBtn.classList.add('active');
      tabLedgerBtn.classList.remove('active');
      historyContent.style.display = 'block';
      ledgerContent.style.display = 'none';
    });

    tabLedgerBtn.addEventListener('click', () => {
      audio.playClick();
      tabLedgerBtn.classList.add('active');
      tabHistoryBtn.classList.remove('active');
      ledgerContent.style.display = 'block';
      historyContent.style.display = 'none';
    });
  }

  // --- Auth Modal & Handlers ---
  if (authTriggerBtn) {
    authTriggerBtn.addEventListener('click', async () => {
      audio.playClick();
      const user = getCurrentUser();
      if (!user.isGuest) {
        // Log out
        await signOutUser();
        showToast('Signed out successfully.');
      } else {
        // Open Auth Modal
        authModal.classList.add('open');
      }
    });
  }

  if (authCloseBtn) {
    authCloseBtn.addEventListener('click', () => {
      authModal.classList.remove('open');
    });
  }

  if (authSwitchLink) {
    authSwitchLink.addEventListener('click', () => {
      isAuthModeLogin = !isAuthModeLogin;
      authModalTitle.textContent = isAuthModeLogin ? 'Sign In' : 'Create Account';
      authSubmitBtn.textContent = isAuthModeLogin ? 'Sign In' : 'Sign Up (Free 200 Points)';
      authSwitchLink.textContent = isAuthModeLogin ? 'Create one' : 'Sign In instead';
    });
  }

  if (authGuestBtn) {
    authGuestBtn.addEventListener('click', () => {
      signInGuest();
      authModal.classList.remove('open');
    });
  }

  if (authForm) {
    authForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = authEmailInput.value.trim();
      const pass = authPassInput.value.trim();
      try {
        if (isAuthModeLogin) {
          await signInWithEmail(email, pass);
          showToast('Welcome back!');
        } else {
          await signUpWithEmail(email, pass);
          showToast('Account created! +200 Points awarded!');
        }
        authModal.classList.remove('open');
      } catch (err) {
        alert(err.message || 'Authentication error.');
      }
    });
  }
});
