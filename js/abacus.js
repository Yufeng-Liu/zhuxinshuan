const AbacusEngine = {
  canvas: null,
  ctx: null,
  width: 0,
  height: 0,

  config: {
    rods: 5,
    upperBeads: 1,
    lowerBeads: 4,
    upperValue: 5,
    lowerValue: 1
  },

  dimensions: {
    framePadding: 25,
    beamHeight: 12,
    rodWidth: 6,
    beadWidth: 50,
    beadHeight: 28,
    beadGap: 3,
    beadRadius: 14,
    upperAreaRatio: 0.38
  },

  colors: {
    frame: '#DEB887',
    frameBorder: '#8B4513',
    beam: '#8B4513',
    rod: '#A0522D',
    beadUpper1: '#FFD700',
    beadUpper2: '#FFC0CB',
    beadLower1: '#FFFFFF',
    beadLower2: '#ADD8E6',
    beadBorder: '#666666',
    beadHighlight: 'rgba(255,255,255,0.6)',
    beadShadow: 'rgba(0,0,0,0.15)'
  },

  state: [],
  animatingBeads: [],
  isDemoMode: false,
  onValueChanged: null,
  highlightedRod: null,
  partLabels: [],

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.resize();
    this.initState();
    this.bindEvents();
    this.startRenderLoop();

    window.addEventListener('resize', Utils.debounce(() => this.resize(), 200));
  },

  resize() {
    const container = this.canvas.parentElement;
    const isTablet = window.innerWidth >= 768 && window.innerWidth <= 1366;
    const isLandscape = window.innerWidth > window.innerHeight;

    let maxWidth;
    if (isTablet && isLandscape) {
      maxWidth = Math.min(container.clientWidth - 40, 700);
    } else if (isTablet) {
      maxWidth = Math.min(container.clientWidth - 30, 650);
    } else {
      maxWidth = Math.min(container.clientWidth - 30, 600);
    }

    const aspectRatio = isTablet && isLandscape ? 1.2 : 1.4;

    this.width = maxWidth;
    this.height = maxWidth * aspectRatio;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.calculateDimensions();
    this.render();
  },

  calculateDimensions() {
    const d = this.dimensions;
    const availableWidth = this.width - d.framePadding * 2;
    const spacing = availableWidth / (this.config.rods + 1);
    
    d.beadWidth = Math.max(35, Math.min(55, spacing * 0.75));
    d.beadHeight = d.beadWidth * 0.56;
    d.beadRadius = d.beadWidth / 2 - 2;
    d.rodSpacing = spacing;
    d.beamY = this.height * d.upperAreaRatio;
    d.frameTop = d.framePadding;
    d.frameBottom = this.height - d.framePadding;
    d.frameLeft = d.framePadding;
    d.frameRight = this.width - d.framePadding;
  },

  initState() {
    this.state = [];
    for (let r = 0; r < this.config.rods; r++) {
      this.state.push({
        upper: Array(this.config.upperBeads).fill(false),
        lower: Array(this.config.lowerBeads).fill(false)
      });
    }
  },

  reset() {
    this.initState();
    this.animatingBeads = [];
    this.highlightedRod = null;
    this.partLabels = [];
    if (this.onValueChanged) this.onValueChanged(this.getValue());
    this.render();
  },

  bindEvents() {
    const handleInteraction = (e) => {
      e.preventDefault();
      const pos = Utils.getEventPos(e);
      const rect = this.canvas.getBoundingClientRect();
      const x = pos.x - rect.left;
      const y = pos.y - rect.top;
      
      this.handleClick(x, y);
    };

    this.canvas.addEventListener('mousedown', handleInteraction);
    this.canvas.addEventListener('touchstart', handleInteraction, { passive: false });
  },

  handleClick(x, y) {
    if (this.isDemoMode) return;

    const clickedRod = this.getRodAtPosition(x);

    if (clickedRod < 0) return;

    const d = this.dimensions;
    const isUpperArea = y < d.beamY;

    if (isUpperArea) {
      this.handleUpperAreaClick(clickedRod);
    } else {
      this.handleLowerAreaClick(clickedRod, y, d);
    }
  },

  getRodAtPosition(x) {
    const d = this.dimensions;
    const startx = d.frameLeft + d.rodSpacing;
    const hitZone = d.beadWidth / 2 + 30;

    for (let r = 0; r < this.config.rods; r++) {
      const rodX = startx + r * d.rodSpacing;
      if (Math.abs(x - rodX) < hitZone) {
        return r;
      }
    }
    return -1;
  },

  handleUpperAreaClick(rod) {
    const rodState = this.state[rod];
    const isActive = rodState.upper[0];

    if (isActive) {
      this.animateBead(rod, 'upper', 0, false);
    } else {
      this.animateBead(rod, 'upper', 0, true);
    }

    AudioManager.play('bead-up');
    if (this.onValueChanged) this.onValueChanged(this.getValue());
  },

  handleLowerAreaClick(rod, y, d) {
    const rodState = this.state[rod];
    const activeCount = rodState.lower.filter(b => b).length;

    const lowerAreaTop = d.beamY + d.beamHeight;
    const lowerAreaHeight = d.frameBottom - lowerAreaTop;
    const midPoint = lowerAreaTop + lowerAreaHeight * 0.5;

    if (y < midPoint) {
      if (activeCount < this.config.lowerBeads) {
        const nextIndex = activeCount;
        this.animateBead(rod, 'lower', nextIndex, true);
        AudioManager.play('bead');
      }
    } else {
      if (activeCount > 0) {
        const lastIndex = activeCount - 1;
        this.animateBead(rod, 'lower', lastIndex, false);
        AudioManager.play('bead-up');
      }
    }

    if (this.onValueChanged) this.onValueChanged(this.getValue());
  },

  getBeadIndexAtPosition(rod, type, y) {
    const d = this.dimensions;
    const rodState = this.state[rod];
    const beadH = d.beadHeight + d.beadGap;

    if (type === 'upper') {
      const startY = d.frameTop + 8;
      for (let i = 0; i < this.config.upperBeads; i++) {
        const beadY = startY + i * beadH;
        const activeCount = rodState.upper.filter(b => b).length;
        const targetY = d.beamY - 8 - (activeCount > 0 ? activeCount : 0) * beadH;
        
        if (y >= beadY && y <= beadY + d.beadHeight) {
          return i;
        }
      }
    } else {
      const startY = d.beamY + d.beamHeight + 8;
      for (let i = 0; i < this.config.lowerBeads; i++) {
        const activeCount = rodState.lower.filter(b => b).length;
        const beadY = startY + (i < this.config.lowerBeads - activeCount ? i : this.config.lowerBeads - activeCount) * beadH;
        
        if (y >= beadY && y <= beadY + d.beadHeight) {
          return i;
        }
      }
    }
    return -1;
  },

  toggleUpperBead(rod, index) {
    const rodState = this.state[rod];
    const isActive = rodState.upper[0];

    if (isActive) {
      this.animateBead(rod, 'upper', 0, false);
    } else {
      this.animateBead(rod, 'upper', 0, true);
    }

    AudioManager.play('bead-up');
    if (this.onValueChanged) this.onValueChanged(this.getValue());
  },

  toggleLowerBead(rod, index) {
    const rodState = this.state[rod];
    const activeCount = rodState.lower.filter(b => b).length;

    if (activeCount < this.config.lowerBeads) {
      const nextIndex = activeCount;
      this.animateBead(rod, 'lower', nextIndex, true);
    } else {
      const lastIndex = activeCount - 1;
      this.animateBead(rod, 'lower', lastIndex, false);
    }

    AudioManager.play('bead');
    if (this.onValueChanged) this.onValueChanged(this.getValue());
  },

  getUpperBeadY(rod, index, isActive) {
    const d = this.dimensions;
    const beadH = d.beadHeight + d.beadGap;

    if (isActive) {
      return d.beamY - d.beadHeight - 4;
    } else {
      return d.frameTop + 10 + index * beadH;
    }
  },

  getLowerBeadY(rod, index, isActive, activeCount) {
    const d = this.dimensions;
    const beadH = d.beadHeight + d.beadGap;
    const baseY = d.beamY + d.beamHeight + 8;

    if (isActive) {
      let activePosition = 0;
      for (let i = 0; i < index; i++) {
        if (this.state[rod].lower[i]) activePosition++;
      }
      return baseY + activePosition * beadH;
    } else {
      let inactiveFromBottom = 0;
      for (let i = this.config.lowerBeads - 1; i > index; i--) {
        if (!this.state[rod].lower[i]) inactiveFromBottom++;
      }
      return d.frameBottom - 10 - d.beadHeight - inactiveFromBottom * beadH;
    }
  },

  animateBead(rod, type, index, active) {
    let fromY, toY;

    if (type === 'upper') {
      fromY = this.getUpperBeadY(rod, index, !active);
      this.state[rod][type][index] = active;
      toY = this.getUpperBeadY(rod, index, active);
    } else {
      const currentActiveCount = this.state[rod].lower.filter(b => b).length;
      fromY = this.getLowerBeadY(rod, index, !active, currentActiveCount);

      this.state[rod][type][index] = active;

      const newActiveCount = this.state[rod].lower.filter(b => b).length;
      toY = this.getLowerBeadY(rod, index, active, newActiveCount);
    }

    this.animatingBeads.push({
      rod,
      type,
      index,
      fromY,
      toY,
      progress: 0,
      duration: 200,
      startTime: Date.now()
    });
  },

  setValue(value) {
    this.reset();
    
    if (value < 0 || value > 99999) return;
    
    const valueStr = value.toString().padStart(this.config.rods, '0');
    
    for (let r = 0; r < this.config.rods; r++) {
      const digit = parseInt(valueStr[this.config.rods - 1 - r]);
      this.setDigitOnRod(r, digit);
    }

    if (this.onValueChanged) this.onValueChanged(this.getValue());
    this.render();
  },

  setDigitOnRod(rod, digit) {
    if (digit < 0 || digit > 9) return;
    
    const upperNeeded = Math.floor(digit / 5);
    const lowerNeeded = digit % 5;
    
    for (let i = 0; i < upperNeeded; i++) {
      this.state[rod].upper[i] = true;
    }
    for (let i = 0; i < lowerNeeded; i++) {
      const idx = this.config.lowerBeads - 1 - i;
      if (idx >= 0) this.state[rod].lower[idx] = true;
    }
  },

  getValue() {
    let total = 0;
    
    for (let r = 0; r < this.config.rods; r++) {
      const rodState = this.state[r];
      const upperVal = rodState.upper.filter(b => b).length * this.config.upperValue;
      const lowerVal = rodState.lower.filter(b => b).length * this.config.lowerValue;
      const digit = upperVal + lowerVal;
      total = total * 10 + digit;
    }
    
    return total;
  },

  getRodValue(rod) {
    const rodState = this.state[rod];
    const upperVal = rodState.upper.filter(b => b).length * this.config.upperValue;
    const lowerVal = rodState.lower.filter(b => b).length * this.config.lowerValue;
    return upperVal + lowerVal;
  },

  highlightRod(rodIndex, duration = 2000) {
    this.highlightedRod = { index: rodIndex, endTime: Date.now() + duration };
    setTimeout(() => {
      this.highlightedRod = null;
      this.render();
    }, duration);
    this.render();
  },

  showPartLabel(partName, position) {
    this.partLabels.push({ name: partName, ...position, alpha: 1 });
    this.render();
    
    setTimeout(() => {
      this.partLabels = this.partLabels.filter(l => l.name !== partName);
      this.render();
    }, 3000);
  },

  async demoSetNumber(number, callback) {
    this.isDemoMode = true;
    this.reset();
    
    await Utils.waitFor(500);
    
    const numberStr = number.toString().padStart(this.config.rods, '0');
    
    for (let r = 0; r < this.config.rods; r++) {
      const digit = parseInt(numberStr[this.config.rods - 1 - r]);
      if (digit === 0) continue;
      
      this.highlightRod(r, 800);
      
      const upperNeeded = Math.floor(digit / 5);
      const lowerNeeded = digit % 5;
      
      for (let u = 0; u < upperNeeded; u++) {
        await Utils.waitFor(400);
        this.toggleUpperBead(r, 0);
        await Utils.waitFor(250);
      }
      
      for (let l = 0; l < lowerNeeded; l++) {
        await Utils.waitFor(350);
        this.toggleLowerBead(r, this.config.lowerBeads - 1);
        await Utils.waitFor(200);
      }
      
      await Utils.waitFor(300);
    }
    
    this.isDemoMode = false;
    if (callback) callback();
  },

  render() {
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;
    const d = this.dimensions;
    const c = this.colors;

    ctx.clearRect(0, 0, this.width, this.height);

    if (this.width <= 0 || this.height <= 0) return;

    try {
      this.drawFrame(ctx, d, c);
      this.drawBeam(ctx, d, c);
      this.drawRods(ctx, d, c);
      this.drawInteractionZones(ctx, d, c);

      for (let r = 0; r < this.config.rods; r++) {
        if (this.state[r]) {
          this.drawUpperBeads(ctx, r, d, c);
          this.drawLowerBeads(ctx, r, d, c);
        }
      }

      if (this.highlightedRod) {
        this.drawHighlight(ctx, d, c);
      }

      this.drawPartLabels(ctx);
    } catch (error) {
      console.error('Abacus render error:', error);
    }
  },

  drawFrame(ctx, d, c) {
    ctx.fillStyle = c.frame;
    ctx.strokeStyle = c.frameBorder;
    ctx.lineWidth = 4;

    const radius = 16;
    ctx.beginPath();
    ctx.roundRect(d.frameLeft, d.frameTop, d.frameRight - d.frameLeft, d.frameBottom - d.frameTop, radius);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = 'rgba(139,69,19,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(d.frameLeft + 4, d.frameTop + 4, d.frameRight - d.frameLeft - 8, d.frameBottom - d.frameTop - 8, radius - 2);
    ctx.stroke();
  },

  drawBeam(ctx, d, c) {
    const gradient = ctx.createLinearGradient(d.frameLeft, d.beamY - d.beamHeight/2, d.frameRight, d.beamY + d.beamHeight/2);
    gradient.addColorStop(0, '#A0522D');
    gradient.addColorStop(0.5, c.beam);
    gradient.addColorStop(1, '#A0522D');

    ctx.fillStyle = gradient;
    ctx.fillRect(d.frameLeft + 4, d.beamY - d.beamHeight/2, d.frameRight - d.frameLeft - 8, d.beamHeight);

    ctx.strokeStyle = '#5D3A1A';
    ctx.lineWidth = 2;
    ctx.strokeRect(d.frameLeft + 4, d.beamY - d.beamHeight/2, d.frameRight - d.frameLeft - 8, d.beamHeight);
  },

  drawRods(ctx, d, c) {
    const startX = d.frameLeft + d.rodSpacing;

    for (let r = 0; r < this.config.rods; r++) {
      const x = startX + r * d.rodSpacing;
      
      const rodGradient = ctx.createLinearGradient(x - d.rodWidth/2, 0, x + d.rodWidth/2, 0);
      rodGradient.addColorStop(0, '#8B7355');
      rodGradient.addColorStop(0.5, c.rod);
      rodGradient.addColorStop(1, '#8B7355');

      ctx.fillStyle = rodGradient;
      ctx.fillRect(
        x - d.rodWidth/2,
        d.frameTop + 6,
        d.rodWidth,
        d.beamY - d.frameTop - d.beamHeight/2 - 12
      );

      ctx.fillRect(
        x - d.rodWidth/2,
        d.beamY + d.beamHeight/2 + 6,
        d.rodWidth,
        d.frameBottom - d.beamY - d.beamHeight/2 - 12
      );
    }
  },

  drawInteractionZones(ctx, d, c) {
    const lowerAreaTop = d.beamY + d.beamHeight;
    const lowerAreaHeight = d.frameBottom - lowerAreaTop;
    const midPoint = lowerAreaTop + lowerAreaHeight * 0.5;

    ctx.save();

    ctx.fillStyle = 'rgba(76, 175, 80, 0.12)';
    ctx.fillRect(d.frameLeft + 3, lowerAreaTop + 3, d.frameRight - d.frameLeft - 6, midPoint - lowerAreaTop - 3);

    ctx.fillStyle = 'rgba(244, 67, 54, 0.12)';
    ctx.fillRect(d.frameLeft + 3, midPoint, d.frameRight - d.frameLeft - 6, d.frameBottom - midPoint - 3);

    ctx.strokeStyle = 'rgba(100, 100, 100, 0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(d.frameLeft + 5, midPoint);
    ctx.lineTo(d.frameRight - 5, midPoint);
    ctx.stroke();

    ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';

    ctx.fillStyle = 'rgba(76, 175, 80, 0.6)';
    ctx.fillText('+', (d.frameLeft + d.frameRight) / 2, lowerAreaTop + 22);

    ctx.fillStyle = 'rgba(244, 67, 54, 0.6)';
    ctx.fillText('-', (d.frameLeft + d.frameRight) / 2, midPoint + 20);

    ctx.restore();
  },

  drawUpperBeads(ctx, rod, d, c) {
    const startX = d.frameLeft + d.rodSpacing;
    const x = startX + rod * d.rodSpacing;
    const rodState = this.state[rod];
    if (!rodState) return;

    for (let i = 0; i < this.config.upperBeads; i++) {
      const isActive = rodState.upper[i];
      let y = this.getUpperBeadY(rod, i, isActive);

      const animBead = this.animatingBeads.find(
        b => b.rod === rod && b.type === 'upper' && b.index === i
      );

      if (animBead) {
        const elapsed = Date.now() - animBead.startTime;
        const progress = Math.min(elapsed / animBead.duration, 1);
        const eased = Utils.easeOutBounce(progress);
        y = Utils.lerp(animBead.fromY, animBead.toY, eased);

        if (progress >= 1) {
          this.animatingBeads = this.animatingBeads.filter(b => b !== animBead);
        }
      }

      this.drawSingleBead(ctx, x, y, d.beadWidth, d.beadHeight, d.beadRadius, 'upper', isActive);
    }
  },

  drawLowerBeads(ctx, rod, d, c) {
    const startX = d.frameLeft + d.rodSpacing;
    const x = startX + rod * d.rodSpacing;
    const rodState = this.state[rod];
    if (!rodState) return;

    const activeCount = rodState.lower.filter(b => b).length;

    for (let i = 0; i < this.config.lowerBeads; i++) {
      const isActive = rodState.lower[i];
      let y = this.getLowerBeadY(rod, i, isActive, activeCount);

      const animBead = this.animatingBeads.find(
        b => b.rod === rod && b.type === 'lower' && b.index === i
      );

      if (animBead) {
        const elapsed = Date.now() - animBead.startTime;
        const progress = Math.min(elapsed / animBead.duration, 1);
        const eased = Utils.easeOutBounce(progress);
        y = Utils.lerp(animBead.fromY, animBead.toY, eased);

        if (progress >= 1) {
          this.animatingBeads = this.animatingBeads.filter(b => b !== animBead);
        }
      }

      this.drawSingleBead(ctx, x, y, d.beadWidth, d.beadHeight, d.beadRadius, 'lower', isActive);
    }
  },

  drawSingleBead(ctx, x, y, width, height, radius, type, isActive) {
    if (!isFinite(x) || !isFinite(y) || !isFinite(width) || !isFinite(height)) {
      return;
    }

    const c = this.colors;
    const centerX = x;
    const centerY = y + height / 2;

    ctx.save();

    if (isActive) {
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 3;
    }

    const gradient = ctx.createRadialGradient(
      centerX - width * 0.2, centerY - height * 0.2, 0,
      centerX, centerY, width * 0.55
    );

    if (type === 'upper') {
      gradient.addColorStop(0, c.beadUpper1);
      gradient.addColorStop(0.7, c.beadUpper2);
      gradient.addColorStop(1, this.darkenColor(c.beadUpper2, 20));
    } else {
      gradient.addColorStop(0, c.beadLower1);
      gradient.addColorStop(0.7, c.beadLower2);
      gradient.addColorStop(1, this.darkenColor(c.beadLower2, 20));
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(centerX - width/2, y, width, height, radius);
    ctx.fill();

    ctx.strokeStyle = c.beadBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = c.beadHighlight;
    ctx.beginPath();
    ctx.ellipse(
      centerX - width * 0.2,
      centerY - height * 0.2,
      width * 0.22,
      height * 0.18,
      -Math.PI / 4,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.restore();
  },

  darkenColor(hex, percent) {
    const num = parseInt(hex.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max((num >> 16) - amt, 0);
    const G = Math.max((num >> 8 & 0x00FF) - amt, 0);
    const B = Math.max((num & 0x0000FF) - amt, 0);
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  },

  drawHighlight(ctx, d, c) {
    if (!this.highlightedRod) return;
    
    const startX = d.frameLeft + d.rodSpacing;
    const x = startX + this.highlightedRod.index * d.rodSpacing;
    
    ctx.save();
    ctx.strokeStyle = 'rgba(255,215,0,0.8)';
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.lineDashOffset = -Date.now() / 50;
    
    ctx.beginPath();
    ctx.roundRect(
      x - d.beadWidth/2 - 8,
      d.frameTop + 4,
      d.beadWidth + 16,
      d.frameBottom - d.frameTop - 8,
      12
    );
    ctx.stroke();
    ctx.restore();
  },

  drawPartLabels(ctx) {
    this.partLabels.forEach(label => {
      ctx.save();
      ctx.globalAlpha = label.alpha;
      ctx.fillStyle = 'rgba(255,107,107,0.95)';
      ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textWidth = ctx.measureText(label.name).width;
      const padding = 10;
      const boxWidth = textWidth + padding * 2;
      const boxHeight = 28;
      
      ctx.beginPath();
      ctx.roundRect(label.x - boxWidth/2, label.y - boxHeight/2, boxWidth, boxHeight, 14);
      ctx.fill();
      
      ctx.fillStyle = 'white';
      ctx.fillText(label.name, label.x, label.y + 1);
      ctx.restore();
    });
  },

  startRenderLoop() {
    const loop = () => {
      if (this.animatingBeads.length > 0 || this.highlightedRod) {
        this.render();
      }
      requestAnimationFrame(loop);
    };
    loop();
  },

  destroy() {
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleClick);
      this.canvas.removeEventListener('touchstart', this.handleClick);
    }
    window.removeEventListener('resize', this.resize);
  }
};
