const GameEngine = {
  currentChapter: null,
  currentLevel: null,
  currentLevelData: null,
  attemptsLeft: 3,
  score: 0,
  isPaused: false,
  isActive: false,

  chapters: {
    chapter1: {
      id: 'chapter1',
      name: '入门关·认识算盘',
      icon: '🧮',
      badge: '算盘小达人',
      badgeIcon: '🏅',
      description: '认识算盘的各个部分，学会数珠对应',
      levels: [
        {
          id: '1-1',
          name: '算盘部件连连看',
          type: 'matching',
          difficulty: 'easy',
          description: '帮算盘找到它的各个部位吧！',
          data: [
            { question: '📦 框', answer: 'frame', hint: '四周边长的城墙' },
            { question: '➖ 梁', answer: 'beam', hint: '中间横卧的道路' },
            { question: '📏 档', answer: 'rod', hint: '竖立的小杆杆' },
            { question: '💛 上珠', answer: 'upperBead', hint: '代表5的珠哥哥' },
            { question: '🤍 下珠', answer: 'lowerBead', hint: '代表1的珠弟弟' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '1-2',
          name: '猜谜语',
          type: 'riddle',
          difficulty: 'easy',
          description: '听谜语，猜猜是什么？',
          data: {
            riddle: '一座城，四面墙，\n里面藏着珠宝宝，\n我用小手轻轻拨，\n噼里啪啦响起来！',
            options: ['📚 书本', '🎨 画笔', '🧮 算盘', '🎸 吉他'],
            correctAnswer: 2,
            hint: '会发出噼里啪啦声音的计算工具哦'
          },
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '1-3',
          name: '拨出数字（1-5）',
          type: 'dialNumber',
          difficulty: 'easy',
          description: '在算盘上拨出正确的数字',
          data: {
            numbers: [1, 2, 3, 4, 5],
            showRhyme: true
          },
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '1-4',
          name: '拨出数字（6-10）',
          type: 'dialNumber',
          difficulty: 'medium',
          description: '继续挑战更大的数字！',
          data: {
            numbers: [6, 7, 8, 9, 10],
            showRhyme: true
          },
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '1-5',
          name: '数珠找朋友',
          type: 'numberMatch',
          difficulty: 'medium',
          description: '看数字，找出对应的算盘图',
          data: {
            pairs: [
              { number: 3, beads: { lower: 3 } },
              { number: 5, beads: { upper: 1 } },
              { number: 7, beads: { upper: 1, lower: 2 } },
              { number: 9, beads: { upper: 1, lower: 4 } },
              { number: 2, beads: { lower: 2 } }
            ]
          },
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 2, unlockNext: true, specialReward: 'badge-chapter1' }
        }
      ]
    },

    chapter2: {
      id: 'chapter2',
      name: '基础关·直加直减',
      icon: '➕➖',
      badge: '计算小能手',
      badgeIcon: '🎯',
      description: '学习10以内的加减法，用算盘来帮忙！',
      levels: [
        {
          id: '2-1',
          name: '简单加法 (1+1, 1+2)',
          type: 'calculation',
          difficulty: 'easy',
          visualAid: 'apple',
          questions: [
            { equation: '1 + 1 = ?', answer: 2, hint: '拨1个下珠，再拨1个下珠', visual: '🍎+🍎=?' },
            { equation: '1 + 2 = ?', answer: 3, hint: '先拨1，再拨2个下珠', visual: '🍎+🍎🍎=?' },
            { equation: '2 + 1 = ?', answer: 3, hint: '拨2个下珠，再加1个', visual: '🍎🍎+🍎=?' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '2-2',
          name: '继续加法 (2+2, 3+2)',
          type: 'calculation',
          difficulty: 'easy',
          visualAid: 'rabbit',
          questions: [
            { equation: '2 + 2 = ?', answer: 4, hint: '2只兔子加2只兔子', visual: '🐰🐰+🐰🐰=?' },
            { equation: '3 + 2 = ?', answer: 5, hint: '可以请上珠哥哥帮忙哦', visual: '🐰🐰🐰+🐰🐰=?' },
            { equation: '1 + 3 = ?', answer: 4, hint: '1加3等于几呢？', visual: '🐰+🐰🐰🐰=?' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '2-3',
          name: '简单减法 (3-1, 5-2)',
          type: 'calculation',
          difficulty: 'medium',
          visualAid: 'star',
          questions: [
            { equation: '3 - 1 = ?', answer: 2, hint: '3颗星星拿走1颗', visual: '⭐⭐⭐-⭐=?' },
            { equation: '5 - 2 = ?', answer: 3, hint: '上珠5减去2', visual: '⭐⭐⭐⭐⭐-⭐⭐=?' },
            { equation: '4 - 2 = ?', answer: 2, hint: '4个减去2个', visual: '⭐⭐⭐⭐-⭐⭐=?' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '2-4',
          name: '混合练习 (一)',
          type: 'calculation',
          difficulty: 'medium',
          visualAid: 'mixed',
          questions: [
            { equation: '4 + 5 = ?', answer: 9, hint: '4个加5个', visual: '' },
            { equation: '8 - 3 = ?', answer: 5, hint: '8减去3', visual: '' },
            { equation: '2 + 6 = ?', answer: 8, hint: '2加6等于？', visual: '' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '2-5',
          name: '混合练习 (二) 🌟',
          type: 'calculation',
          difficulty: 'hard',
          visualAid: 'mixed',
          questions: [
            { equation: '7 - 4 = ?', answer: 3, hint: '7减4，想一想怎么拨', visual: '' },
            { equation: '3 + 6 = ?', answer: 9, hint: '3加6', visual: '' },
            { equation: '9 - 5 = ?', answer: 4, hint: '9减5，去掉上珠', visual: '' },
            { equation: '1 + 8 = ?', answer: 9, hint: '最后一步加油！', visual: '' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 2, unlockNext: true, specialReward: 'badge-chapter2' }
        }
      ]
    },

    chapter3: {
      id: 'chapter3',
      name: '提升关·满五加基础',
      icon: '⭐',
      badge: '珠心算小天才',
      badgeIcon: '👑',
      description: '当下珠不够时，请上珠哥哥来帮忙！',
      levels: [
        {
          id: '3-1',
          name: '认识满五加',
          type: 'teaching',
          difficulty: 'medium',
          description: '学习"下珠不够，请上珠帮忙"',
          teachingContent: {
            story: '有一天，小明想算 1+4，可是下珠只有4个位置，不够加4了怎么办呢？',
            steps: [
              '首先，我们在算盘上拨入1（1个下珠）',
              '现在要加4，但是下珠只剩3个空位了',
              '没关系！我们请上珠哥哥（代表5）来帮忙',
              '拨入上珠5，但是我们多加了1（因为只要加4）',
              '所以要把多加的这1个下珠拨去',
              '看！答案是5！你学会了吗？'
            ],
            example: { equation: '1 + 4 = ?', answer: 5 }
          },
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '3-2',
          name: '满五加练习 (1+4, 2+4)',
          type: 'fullFiveAdd',
          difficulty: 'medium',
          questions: [
            { 
              equation: '1 + 4 = ?', 
              answer: 5, 
              hint: '下珠不够加4，请上珠5帮忙，再拨去1',
              teachingHint: ['拨入上珠5', '拨去1个下珠'],
              rhyme: '4的下珠不够加，\n请来上珠5帮忙，\n拨入5后多加了1，\n快把1给拨回家！'
            },
            { 
              equation: '2 + 4 = ?', 
              answer: 6, 
              hint: '同样请上珠5帮忙哦',
              teachingHint: ['拨入上珠5', '拨去1个下珠'],
              rhyme: ''
            },
            { 
              equation: '3 + 4 = ?', 
              answer: 7, 
              hint: '3加4，想想该怎么拨',
              teachingHint: ['拨入上珠5', '拨去1个下珠'],
              rhyme: ''
            }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '3-3',
          name: '满五加进阶 (2+3, 3+3)',
          type: 'fullFiveAdd',
          difficulty: 'hard',
          questions: [
            { 
              equation: '2 + 3 = ?', 
              answer: 5, 
              hint: '加3的时候也要请上珠帮忙哦',
              teachingHint: ['拨入上珠5', '拨去2个下珠'],
              rhyme: '3的下珠不够加，\n上珠5来帮大忙，\n多了2要拨回去，\n答案就是5！'
            },
            { 
              equation: '3 + 3 = ?', 
              answer: 6, 
              hint: '3加3等于？',
              teachingHint: ['拨入上珠5', '拨去2个下珠'],
              rhyme: ''
            },
            { 
              equation: '4 + 3 = ?', 
              answer: 7, 
              hint: '4加3，你一定行！',
              teachingHint: ['拨入上珠5', '拨去2个下珠'],
              rhyme: ''
            }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 1, unlockNext: true }
        },
        {
          id: '3-4',
          name: '综合挑战 ⚡',
          type: 'mixedChallenge',
          difficulty: 'hard',
          questions: [
            { equation: '1 + 4 = ?', answer: 5, type: 'fullFive' },
            { equation: '4 + 1 = ?', answer: 5, type: 'direct' },
            { equation: '2 + 3 = ?', answer: 5, type: 'fullFive' },
            { equation: '6 - 2 = ?', answer: 4, type: 'direct' },
            { equation: '3 + 4 = ?', answer: 7, type: 'fullFive' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 2, unlockNext: true }
        },
        {
          id: '3-5',
          name: '终极考验 👑',
          type: 'finalBoss',
          difficulty: 'boss',
          description: '恭喜你来到最后一关！完成它就能获得"珠心算小天才"称号！',
          questions: [
            { equation: '2 + 4 = ?', answer: 6, hint: '第一题：满五加' },
            { equation: '7 - 3 = ?', answer: 4, hint: '第二题：直减' },
            { equation: '1 + 4 + 2 = ?', answer: 7, hint: '第三题：连加！' },
            { equation: '9 - 4 - 1 = ?', answer: 4, hint: '第四题：连减！' },
            { equation: '3 + 3 + 1 = ?', answer: 7, hint: '最后一题：加油！' }
          ],
          maxAttempts: 3,
          timeLimit: 0,
          reward: { stars: 3, unlockNext: true, specialReward: 'badge-chapter3', unlockSkin: 'golden-abacus' }
        }
      ]
    }
  },

  init() {
    Storage.init();
    this.loadProgress();
  },

  loadProgress() {
    const progress = Storage.getProgress();
    this.currentChapter = progress.currentChapter || 1;
    this.currentLevel = progress.currentLevel || 1;
  },

  getChapter(chapterId) {
    return this.chapters[`chapter${chapterId}`] || null;
  },

  getLevel(chapterId, levelId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter || !chapter.levels) return null;
    return chapter.levels.find(l => l.id === `${chapterId}-${levelId}`) || null;
  },

  startLevel(chapterId, levelId) {
    const level = this.getLevel(chapterId, levelId);
    if (!level) {
      UI.showToast('关卡不存在！', 'error');
      return false;
    }

    if (!Storage.isLevelUnlocked(chapterId, levelId)) {
      UI.showToast('请先完成前面的关卡哦~', 'warning');
      Character.speak('小朋友，要先通过前面的关卡才能来这里哦！');
      return false;
    }

    this.currentChapter = chapterId;
    this.currentLevel = levelId;
    this.currentLevelData = level;
    this.attemptsLeft = level.maxAttempts || 3;
    this.score = 0;
    this.isActive = true;
    this.isPaused = false;

    this.saveCurrentProgress();

    Character.speak(`开始${level.name}，加油！你一定可以的！💪`);
    
    AudioManager.play('click');

    return true;
  },

  submitAnswer(userAnswer, correctAnswer) {
    if (!this.isActive || this.isPaused) return;

    if (userAnswer === correctAnswer) {
      return this.handleCorrect();
    } else {
      return this.handleWrong(correctAnswer);
    }
  },

  handleCorrect() {
    AudioManager.play('correct');
    Character.showHappy('答对啦！你太厉害了！🎉');
    
    this.score += Math.max(1, this.attemptsLeft);

    const starsEarned = this.attemptsLeft === 3 ? 3 : this.attemptsLeft === 2 ? 2 : 1;
    const newTotalStars = Storage.addStars(starsEarned);
    
    document.getElementById('total-stars').textContent = newTotalStars;

    Storage.completeLevel(this.currentChapter, this.currentLevel);
    Storage.addMistake({ 
      level: `${this.currentChapter}-${this.currentLevel}`, 
      correct: true,
      attemptsUsed: (this.currentLevelData?.maxAttempts || 3) - this.attemptsLeft + 1
    });

    const levelData = this.currentLevelData;
    const reward = levelData?.reward || {};
    
    let badgeText = null;
    if (reward.specialReward && reward.specialReward.startsWith('badge-')) {
      const chapter = this.getChapter(this.currentChapter);
      if (chapter) {
        Storage.addBadge(reward.specialReward);
        badgeText = chapter.badge;
      }
    }

    if (reward.unlockSkin) {
      Storage.unlockSkin(reward.unlockSkin);
    }

    this.isActive = false;

    const hasNext = this.hasNextLevel();

    return {
      success: true,
      starsEarned,
      totalStars: newTotalStars,
      badge: badgeText,
      hasNextLevel: hasNext,
      message: `太棒了！你完成了「${levelData?.name}」！`
    };
  },

  handleWrong(correctAnswer) {
    this.attemptsLeft--;
    
    AudioManager.play('wrong');
    
    const hints = this.getCurrentHints();
    const hintIndex = (this.currentLevelData?.maxAttempts || 3) - this.attemptsLeft - 1;
    const hintText = hints?.[hintIndex] || '再仔细想想哦~';

    Character.showSad(`没关系，${hintText}`);

    Storage.addMistake({
      level: `${this.currentChapter}-${this.currentLevel}`,
      correct: false,
      userAnswer: arguments.length > 1 ? arguments[0] : null,
      correctAnswer: correctAnswer
    });

    if (this.attemptsLeft <= 0) {
      this.isActive = false;
      
      return {
        success: false,
        exhausted: true,
        message: '机会用完了，要不要再试一次？'
      };
    }

    return {
      success: false,
      exhausted: false,
      attemptsLeft: this.attemptsLeft,
      hintText
    };
  },

  getCurrentHints() {
    const level = this.currentLevelData;
    if (!level) return [];

    switch (level.type) {
      case 'calculation':
      case 'fullFiveAdd':
        return level.questions?.map(q => q.hint) || [];
      case 'riddle':
        return [level.data?.hint];
      default:
        return ['再试一次吧！'];
    }
  },

  hasNextLevel() {
    const chapter = this.getChapter(this.currentChapter);
    if (!chapter) return false;
    
    const currentIdx = chapter.levels.findIndex(l => l.id === `${this.currentChapter}-${this.currentLevel}`);
    return currentIdx < chapter.levels.length - 1;
  },

  getNextLevel() {
    if (!this.hasNextLevel()) return null;
    
    return {
      chapterId: this.currentChapter,
      levelId: this.currentLevel + 1
    };
  },

  hasPrevLevel() {
    return this.currentLevel > 1;
  },

  getPrevLevel() {
    if (!this.hasPrevLevel()) return null;
    
    return {
      chapterId: this.currentChapter,
      levelId: this.currentLevel - 1
    };
  },

  pause() {
    this.isPaused = true;
  },

  resume() {
    this.isPaused = false;
  },

  restartLevel() {
    if (this.currentChapter && this.currentLevel) {
      this.startLevel(this.currentChapter, this.currentLevel);
    }
  },

  goToHome() {
    this.isActive = false;
    this.isPaused = false;
    App.navigate('home');
  },

  saveCurrentProgress() {
    const progress = Storage.getProgress();
    progress.currentChapter = this.currentChapter;
    progress.currentLevel = this.currentLevel;
    Storage.saveProgress(progress);
    Storage.updateLastPlay();
  },

  getChapterProgress(chapterId) {
    const chapter = this.getChapter(chapterId);
    if (!chapter) return { completed: 0, total: 0 };

    const progress = Storage.getProgress();
    const chapterKey = String(chapterId);
    return progress.chapterProgress?.[chapterKey] || { completed: 0, total: chapter.levels?.length || 0 };
  },

  isChapterCompleted(chapterId) {
    const progress = this.getChapterProgress(chapterId);
    return progress.completed >= progress.total && progress.total > 0;
  },

  getTotalProgress() {
    let totalCompleted = 0;
    let totalLevels = 0;

    Object.keys(this.chapters).forEach(key => {
      const chapter = this.chapters[key];
      if (chapter?.levels) {
        totalLevels += chapter.levels.length;
        const progress = this.getChapterProgress(parseInt(key.replace('chapter', '')));
        totalCompleted += progress.completed;
      }
    });

    return {
      completed: totalCompleted,
      total: totalLevels,
      percent: totalLevels > 0 ? (totalCompleted / totalLevels * 100) : 0
    };
  },

  getAllBadges() {
    const allBadges = [];
    Object.values(this.chapters).forEach(chapter => {
      if (chapter?.badge) {
        allBadges.push({
          id: `badge-chapter${chapter.id.replace('chapter', '')}`,
          name: chapter.badge,
          icon: chapter.badgeIcon,
          chapter: chapter.name
        });
      }
    });
    return allBadges;
  }
};
