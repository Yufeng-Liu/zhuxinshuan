const Character = {
  canvas: null,
  ctx: null,
  currentCharacter: 'bear',
  state: 'idle',
  animationFrame: 0,
  lastFrameTime: 0,
  fps: 12,

  states: {
    idle: { frames: 4, speed: 800 },
    happy: { frames: 6, speed: 400 },
    sad: { frames: 3, speed: 600 },
    thinking: { frames: 5, speed: 700 },
    celebration: { frames: 8, speed: 250 }
  },

  dialogQueue: [],
  currentDialog: null,
  dialogTimeout: null,

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.startAnimationLoop();
  },

  setState(newState) {
    if (this.states[newState]) {
      this.state = newState;
      this.animationFrame = 0;
    }
  },

  speak(text, duration = 3000) {
    const dialogEl = document.getElementById('character-dialog');
    const textEl = document.getElementById('dialog-text');
    
    if (!dialogEl || !textEl) return;
    
    textEl.textContent = text;
    dialogEl.style.display = 'block';
    
    this.setState(text.includes('棒') || text.includes('厉害') ? 'happy' : 
                  text.includes('试') || text.includes('加油') ? 'thinking' : 'idle');
    
    if (this.dialogTimeout) {
      clearTimeout(this.dialogTimeout);
    }

    this.dialogTimeout = setTimeout(() => {
      dialogEl.style.display = 'none';
      this.setState('idle');
    }, duration);
  },

  showHappy(message = '你太厉害啦！继续加油～') {
    this.setState('happy');
    this.speak(message, 2500);
    
    setTimeout(() => {
      this.celebrateEffect();
    }, 300);
  },

  showSad(message = '没关系，再试一次，你一定可以的！') {
    this.setState('sad');
    this.speak(message, 3000);
  },

  showThinking(message = '让我想想...') {
    this.setState('thinking');
    this.speak(message, 2000);
  },

  celebrate() {
    this.setState('celebration');
    this.speak('哇！你真了不起！🎉', 3500);
    this.celebrateEffect();
    
    setTimeout(() => {
      this.setState('happy');
    }, 2000);
  },

  welcome() {
    this.speak('小朋友，欢迎来到珠心算小乐园！我是算算，我们一起学算盘吧！🐻', 4500);
    this.setState('happy');
  },

  encourage() {
    const messages = [
      '加油加油！你是最棒的！💪',
      '再试一次，你可以的！✨',
      '别灰心，慢慢来哦~ 🌟',
      '相信自己，你一定能行！🎯',
      '好样的！继续保持！👍'
    ];
    const msg = messages[Utils.randomInt(0, messages.length - 1)];
    this.speak(msg, 2500);
    this.setState('happy');
  },

  celebrateEffect() {
    const container = document.querySelector('.app-container');
    if (!container) return;

    for (let i = 0; i < 15; i++) {
      setTimeout(() => {
        this.createParticle(container);
      }, i * 80);
    }
  },

  createParticle(container) {
    const particle = Utils.createElement('div', 'celebration-particle');
    
    const types = ['particle-heart', 'particle-star'];
    const type = types[Utils.randomInt(0, types.length - 1)];
    particle.classList.add(type);

    const emojis = ['❤️', '⭐', '🌟', '✨', '💫', '🎈', '🎉', '💖'];
    particle.textContent = emojis[Utils.randomInt(0, emojis.length - 1)];

    particle.style.left = Utils.randomFloat(20, 80) + '%';
    particle.style.bottom = '20%';
    particle.style.fontSize = (Utils.randomInt(18, 32)) + 'px';
    particle.style.animationDuration = (Utils.randomFloat(1.5, 3)) + 's';

    container.appendChild(particle);

    setTimeout(() => {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 3000);
  },

  startAnimationLoop() {
    const animate = (timestamp) => {
      if (!this.lastFrameTime) this.lastFrameTime = timestamp;
      
      const elapsed = timestamp - this.lastFrameTime;
      const stateConfig = this.states[this.state] || this.states.idle;
      
      if (elapsed > stateConfig.speed / stateConfig.frames) {
        this.animationFrame = (this.animationFrame + 1) % stateConfig.frames;
        this.lastFrameTime = timestamp;
        this.render();
      }
      
      requestAnimationFrame(animate);
    };
    
    requestAnimationFrame(animate);
  },

  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    switch (this.currentCharacter) {
      case 'bear':
        this.drawBear(ctx, w, h);
        break;
      case 'abacus-spirit':
        this.drawAbacusSpirit(ctx, w, h);
        break;
      default:
        this.drawBear(ctx, w, h);
    }
  },

  drawBear(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.55;
    const bounce = this.state === 'happy' || this.state === 'celebration' 
      ? Math.sin(this.animationFrame * 0.8) * 5 
      : Math.sin(this.animationFrame * 0.4) * 2;

    ctx.save();
    ctx.translate(cx, cy + bounce);

    this.drawBearBody(ctx);
    this.drawBearHead(ctx);
    this.drawBearFace(ctx);
    this.drawBearEars(ctx);
    this.drawBearOveralls(ctx);

    if (this.state === 'celebration') {
      this.drawCelebrationArms(ctx);
    } else if (this.state === 'sad') {
      this.drawSadPose(ctx);
    } else if (this.state === 'thinking') {
      this.drawThinkingPose(ctx);
    } else {
      this.drawNormalArms(ctx);
    }

    ctx.restore();
  },

  drawBearBody(ctx) {
    const gradient = ctx.createRadialGradient(0, 20, 5, 0, 25, 50);
    gradient.addColorStop(0, '#D2691E');
    gradient.addColorStop(1, '#8B4513');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(0, 25, 38, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.ellipse(0, 30, 22, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawBearHead(ctx) {
    const headY = -35;
    
    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.arc(0, headY, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFDAB9';
    ctx.beginPath();
    ctx.ellipse(0, headY + 10, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawBearEars(ctx) {
    const earY = -68;

    [[-30, earY], [30, earY]].forEach(([ex, ey]) => {
      ctx.fillStyle = '#D2691E';
      ctx.beginPath();
      ctx.arc(ex, ey, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#654321';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#FFDAB9';
      ctx.beginPath();
      ctx.arc(ex, ey + 2, 8, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawBearFace(ctx) {
    const faceY = -35;

    ctx.fillStyle = '#000';
    [[-12, faceY - 5], [12, faceY - 5]].forEach(([ex, ey]) => {
      ctx.beginPath();
      ctx.ellipse(ex, ey, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFF';
      ctx.beginPath();
      ctx.arc(ex - 2, ey - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(0, faceY + 6, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    if (this.state === 'happy' || this.state === 'celebration') {
      ctx.beginPath();
      ctx.arc(-12, faceY + 14, 8, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, faceY + 14, 8, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    } else if (this.state === 'sad') {
      ctx.beginPath();
      ctx.arc(-12, faceY + 20, 8, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(12, faceY + 20, 8, 1.1 * Math.PI, 1.9 * Math.PI);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-14, faceY + 16);
      ctx.quadraticCurveTo(-12, faceY + 20, -10, faceY + 16);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, faceY + 16);
      ctx.quadraticCurveTo(12, faceY + 20, 14, faceY + 16);
      ctx.stroke();
    }

    ctx.fillStyle = '#FF6B81';
    ctx.beginPath();
    ctx.ellipse(0, faceY + 13, 5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  drawBearOveralls(ctx) {
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.roundRect(-22, 5, 44, 42, 8);
    ctx.fill();
    ctx.strokeStyle = '#CC5555';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(0, 12, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = '#CC5555';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-22, 18);
    ctx.lineTo(-34, 35);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(22, 18);
    ctx.lineTo(34, 35);
    ctx.stroke();
  },

  drawNormalArms(ctx) {
    const armSwing = Math.sin(this.animationFrame * 0.5) * 3;

    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-36, 20 + armSwing);
    ctx.lineTo(-48, 40 + armSwing);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, 20 - armSwing);
    ctx.lineTo(48, 40 - armSwing);
    ctx.stroke();

    ctx.fillStyle = '#D2691E';
    [[-48, 40 + armSwing], [48, 40 - armSwing]].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawSadPose(ctx) {
    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-36, 30);
    ctx.lineTo(-44, 15);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, 30);
    ctx.lineTo(44, 15);
    ctx.stroke();
  },

  drawThinkingPose(ctx) {
    const tilt = Math.sin(this.animationFrame * 0.6) * 2;

    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-36, 20);
    ctx.lineTo(-46 + tilt, 5);
    ctx.stroke();

    ctx.fillStyle = '#D2691E';
    ctx.beginPath();
    ctx.arc(-46 + tilt, 5, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(36, 20);
    ctx.lineTo(46, 35);
    ctx.stroke();
  },

  drawCelebrationArms(ctx) {
    const armRaise = Math.abs(Math.sin(this.animationFrame * 1.2)) * 20;

    ctx.strokeStyle = '#D2691E';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(-36, 15);
    ctx.lineTo(-44, -15 - armRaise);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(36, 15);
    ctx.lineTo(44, -15 - armRaise);
    ctx.stroke();

    ctx.fillStyle = '#D2691E';
    [[-44, -15 - armRaise], [44, -15 - armRaise]].forEach(([hx, hy]) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 7, 0, Math.PI * 2);
      ctx.fill();
    });
  },

  drawAbacusSpirit(ctx, w, h) {
    const cx = w / 2;
    const cy = h * 0.5;
    const float = Math.sin(this.animationFrame * 0.5) * 6;
    const glow = Math.sin(this.animationFrame * 0.3) * 0.15 + 0.85;

    ctx.save();
    ctx.globalAlpha = glow;
    ctx.translate(cx, cy + float);

    ctx.shadowColor = 'rgba(255,215,0,0.5)';
    ctx.shadowBlur = 15;

    const bodyGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 45);
    bodyGradient.addColorStop(0, '#FFF8DC');
    bodyGradient.addColorStop(0.7, '#FFEFD5');
    bodyGradient.addColorStop(1, '#DEB887');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.roundRect(-35, -40, 70, 85, 20);
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.roundRect(-30, -30, 60, 12, 4);
    ctx.fill();

    for (let i = 0; i < 5; i++) {
      const rx = -24 + i * 12;
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(rx - 1.5, -18, 3, 52);

      ctx.fillStyle = i < 2 ? '#FFD700' : '#ADD8E6';
      ctx.beginPath();
      ctx.roundRect(rx - 5, i < 2 ? -15 : 5, 10, 10, 5);
      ctx.fill();
      ctx.strokeStyle = '#666';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(-12, -48, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, -48, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-13, -49, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(11, -49, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  switchCharacter(charType) {
    this.currentCharacter = charType;
    this.animationFrame = 0;
    this.render();
  }
};
