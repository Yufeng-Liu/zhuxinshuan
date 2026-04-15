const Storage = {
  KEYS: {
    PROGRESS: 'abacus_progress',
    SETTINGS: 'abacus_settings',
    STARS: 'abacus_stars',
    BADGES: 'abacus_badges',
    SKINS: 'abacus_skins',
    MISTAKES: 'abacus_mistakes',
    SESSION_TIME: 'abacus_session_time',
    LAST_PLAY: 'abacus_last_play'
  },

  _defaultProgress: {
    currentChapter: 1,
    currentLevel: 1,
    completedLevels: [],
    chapterProgress: {
      1: { completed: 0, total: 5 },
      2: { completed: 0, total: 5 },
      3: { completed: 0, total: 5 }
    }
  },

  _defaultSettings: {
    soundEnabled: true,
    eyeCareEnabled: true,
    bgmEnabled: false,
    volume: 0.7
  },

  init() {
    if (!localStorage.getItem(this.KEYS.PROGRESS)) {
      this.save(this.KEYS.PROGRESS, this._defaultProgress);
    }
    if (!localStorage.getItem(this.KEYS.SETTINGS)) {
      this.save(this.KEYS.SETTINGS, this._defaultSettings);
    }
    if (!localStorage.getItem(this.KEYS.STARS)) {
      this.save(this.KEYS.STARS, 0);
    }
    if (!localStorage.getItem(this.KEYS.BADGES)) {
      this.save(this.KEYS.BADGES, []);
    }
    if (!localStorage.getItem(this.KEYS.SKINS)) {
      this.save(this.KEYS.SKINS, ['default']);
    }
    if (!localStorage.getItem(this.KEYS.MISTAKES)) {
      this.save(this.KEYS.MISTAKES, []);
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  },

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clearAll() {
    Object.values(this.KEYS).forEach(key => localStorage.removeItem(key));
  },

  getProgress() {
    return this.load(this.KEYS.PROGRESS) || Utils.deepClone(this._defaultProgress);
  },

  saveProgress(progress) {
    return this.save(this.KEYS.PROGRESS, progress);
  },

  getSettings() {
    return this.load(this.KEYS.SETTINGS) || Utils.deepClone(this._defaultSettings);
  },

  saveSettings(settings) {
    return this.save(this.KEYS.SETTINGS, settings);
  },

  getStars() {
    return this.load(this.KEYS.STARS) || 0;
  },

  addStars(count) {
    const current = this.getStars();
    const newTotal = current + count;
    this.save(this.KEYS.STARS, newTotal);
    return newTotal;
  },

  getBadges() {
    return this.load(this.KEYS.BADGES) || [];
  },

  addBadge(badgeId) {
    const badges = this.getBadges();
    if (!badges.includes(badgeId)) {
      badges.push(badgeId);
      this.save(this.KEYS.BADGES, badges);
      return true;
    }
    return false;
  },

  getSkins() {
    return this.load(this.KEYS.SKINS) || ['default'];
  },

  unlockSkin(skinId) {
    const skins = this.getSkins();
    if (!skins.includes(skinId)) {
      skins.push(skinId);
      this.save(this.KEYS.SKINS, skins);
      return true;
    }
    return false;
  },

  addMistake(mistake) {
    const mistakes = this.load(this.KEYS.MISTAKES) || [];
    mistake.timestamp = Date.now();
    mistakes.unshift(mistake);
    if (mistakes.length > 50) mistakes.pop();
    this.save(this.KEYS.MISTAKES, mistakes);
  },

  getMistakes(limit = 10) {
    const mistakes = this.load(this.KEYS.MISTAKES) || [];
    return mistakes.slice(0, limit);
  },

  completeLevel(chapterId, levelId) {
    const progress = this.getProgress();
    const levelKey = `${chapterId}-${levelId}`;
    
    if (!progress.completedLevels.includes(levelKey)) {
      progress.completedLevels.push(levelKey);
      
      const chapterKey = String(chapterId);
      if (progress.chapterProgress[chapterKey]) {
        progress.chapterProgress[chapterKey].completed++;
      }
      
      progress.currentChapter = chapterId;
      progress.currentLevel = levelId + 1;
      
      this.saveProgress(progress);
      return true;
    }
    return false;
  },

  isLevelUnlocked(chapterId, levelId) {
    const progress = this.getProgress();
    
    if (chapterId === 1 && levelId === 1) return true;
    
    const prevLevel = levelId > 1 ? `${chapterId}-${levelId - 1}` : `${chapterId - 1}-5`;
    return progress.completedLevels.includes(prevLevel);
  },

  isChapterUnlocked(chapterId) {
    if (chapterId === 1) return true;
    const prevChapter = chapterId - 1;
    const progress = this.getProgress();
    const prevData = progress.chapterProgress[String(prevChapter)];
    return prevData && prevData.completed >= prevData.total;
  },

  getSessionTime() {
    return this.load(this.KEYS.SESSION_TIME) || 0;
  },

  addSessionTime(seconds) {
    const current = this.getSessionTime();
    this.save(this.KEYS.SESSION_TIME, current + seconds);
  },

  resetSessionTime() {
    this.save(this.KEYS.SESSION_TIME, 0);
  },

  getLastPlayDate() {
    return this.load(this.KEYS.LAST_PLAY);
  },

  updateLastPlay() {
    this.save(this.KEYS.LAST_PLAY, new Date().toISOString());
  },

  getLearningStats() {
    const progress = this.getProgress();
    const stars = this.getStars();
    const badges = this.getBadges();
    const mistakes = this.getMistakes(20);
    const sessionTime = this.getSessionTime();
    
    let totalDays = 0;
    const dates = new Set();
    mistakes.forEach(m => {
      if (m.timestamp) {
        const date = new Date(m.timestamp).toDateString();
        dates.add(date);
      }
    });
    totalDays = dates.size || 1;

    return {
      totalStars: stars,
      totalBadges: badges.length,
      completedLevels: progress.completedLevels.length,
      totalLevels: 15,
      chapterProgress: progress.chapterProgress,
      recentMistakes: mistakes.slice(0, 5),
      totalTimeMinutes: Math.floor(sessionTime / 60),
      learningDays: totalDays
    };
  }
};
