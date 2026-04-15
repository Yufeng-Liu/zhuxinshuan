const AudioManager = {
  context: null,
  masterGain: null,
  enabled: true,
  volume: 0.7,
  initialized: false,

  init() {
    if (this.initialized) return;
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);
      this.masterGain.gain.value = this.volume;
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  },

  ensureContext() {
    if (!this.initialized) this.init();
    if (this.context && this.context.state === 'suspended') {
      this.context.resume();
    }
  },

  setVolume(vol) {
    this.volume = Utils.clamp(vol, 0, 1);
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
    const settings = Storage.getSettings();
    settings.volume = this.volume;
    Storage.saveSettings(settings);
  },

  toggle(enabled) {
    this.enabled = enabled;
    const settings = Storage.getSettings();
    settings.soundEnabled = enabled;
    Storage.saveSettings(settings);
  },

  play(type) {
    if (!this.enabled) return;
    this.ensureContext();
    
    switch (type) {
      case 'bead': this.playBeadSound(); break;
      case 'bead-up': this.playBeadUpSound(); break;
      case 'correct': this.playCorrectSound(); break;
      case 'wrong': this.playWrongSound(); break;
      case 'click': this.playClickSound(); break;
      case 'success': this.playSuccessSound(); break;
      case 'celebration': this.playCelebrationSound(); break;
      case 'star': this.playStarSound(); break;
      case 'badge': this.playBadgeSound(); break;
      case 'level-complete': this.playLevelCompleteSound(); break;
      case 'hint': this.playHintSound(); break;
      case 'button': this.playButtonSound(); break;
      default: this.playClickSound();
    }
  },

  createOscillator(frequency, type = 'sine', duration = 0.15, gainValue = 0.3) {
    if (!this.context || !this.masterGain) return null;

    const osc = this.context.createOscillator();
    const gainNode = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, this.context.currentTime);

    gainNode.gain.setValueAtTime(gainValue, this.context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.masterGain);

    return { osc, gainNode, duration };
  },

  playNote(freq, duration = 0.2, type = 'sine', volume = 0.3) {
    const sound = this.createOscillator(freq, type, duration, volume);
    if (sound) {
      sound.osc.start(this.context.currentTime);
      sound.osc.stop(this.context.currentTime + sound.duration);
    }
  },

  playBeadSound() {
    this.ensureContext();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.12);

    const noise = this.createNoise(0.05, 0.1);
    if (noise) {
      noise.start(now);
      noise.stop(now + 0.05);
    }
  },

  playBeadUpSound() {
    this.ensureContext();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.1);
  },

  playCorrectSound() {
    this.ensureContext();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playNote(freq, 0.25, 'sine', 0.25), i * 100);
    });
  },

  playWrongSound() {
    this.ensureContext();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(150, now + 0.3);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.3);
  },

  playClickSound() {
    this.ensureContext();
    this.playNote(1000, 0.08, 'sine', 0.15);
  },

  playSuccessSound() {
    this.ensureContext();
    const melody = [523.25, 587.33, 659.25, 698.46, 783.99];
    melody.forEach((freq, i) => {
      setTimeout(() => this.playNote(freq, 0.2, 'sine', 0.22), i * 120);
    });
  },

  playCelebrationSound() {
    this.ensureContext();
    const fanfare = [
      { freq: 523.25, delay: 0 },
      { freq: 659.25, delay: 150 },
      { freq: 783.99, delay: 300 },
      { freq: 1046.50, delay: 500 },
      { freq: 783.99, delay: 650 },
      { freq: 1046.50, delay: 800 }
    ];
    
    fanfare.forEach(({ freq, delay }) => {
      setTimeout(() => this.playNote(freq, 0.35, 'sine', 0.25), delay);
    });
  },

  playStarSound() {
    this.ensureContext();
    const now = this.context.currentTime;
    
    for (let i = 0; i < 4; i++) {
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + i * 200, now + i * 0.08);
      
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.2);
      
      osc.connect(gain);
      gain.connect(this.masterGain);
      
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    }
  },

  playBadgeSound() {
    this.ensureContext();
    const notes = [392, 523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.25, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.4);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.4);
      }, i * 150);
    });
  },

  playLevelCompleteSound() {
    this.ensureContext();
    const melody = [
      { freq: 523.25, time: 0, dur: 0.2 },
      { freq: 659.25, time: 0.2, dur: 0.2 },
      { freq: 783.99, time: 0.4, dur: 0.2 },
      { freq: 880, time: 0.6, dur: 0.15 },
      { freq: 1046.50, time: 0.75, dur: 0.5 }
    ];
    
    melody.forEach(({ freq, time, dur }) => {
      setTimeout(() => this.playNote(freq, dur, 'sine', 0.25), time * 1000);
    });
  },

  playHintSound() {
    this.ensureContext();
    const now = this.context.currentTime;
    
    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(550, now + 0.15);
    
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 0.2);
  },

  playButtonSound() {
    this.ensureContext();
    this.playNote(900, 0.06, 'sine', 0.12);
  },

  createNoise(duration = 0.1, volume = 0.1) {
    if (!this.context || !this.masterGain) return null;
    
    const bufferSize = this.context.sampleRate * duration;
    const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.context.createBufferSource();
    source.buffer = buffer;
    
    const gain = this.context.createGain();
    gain.gain.value = volume;
    
    source.connect(gain);
    gain.connect(this.masterGain);
    
    return source;
  },

  playBellSound(count = 1) {
    this.ensureContext();
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = 1200 + (i % 2) * 200;
        
        gain.gain.setValueAtTime(0.2, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.context.currentTime + 0.5);
      }, i * 400);
    }
  }
};
