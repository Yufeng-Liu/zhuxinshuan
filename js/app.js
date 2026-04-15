const App = {
  currentPage: 'home',
  sessionStartTime: null,
  sessionTimerInterval: null,
  eyeCareTimer: null,
  eyeCareInterval: 20 * 60 * 1000,

  init() {
    Storage.init();
    AudioManager.init();
    this.sessionStartTime = Date.now();
    this.startSessionTimer();
    this.setupEyeCare();
    this.updateStarsDisplay();
    this.bindGlobalEvents();
    this.showLoadingScreen();
  },

  showLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const progressBar = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-tip');
    
    const tips = ['算算正在准备算盘...', '珠珠在整理珠宝宝...', '马上就好啦~', '加载精彩内容中...', '准备好了吗？'];
    let progress = 0;
    
    const loadingInterval = setInterval(() => {
      progress += Utils.randomInt(8, 15);
      if (progress >= 100) {
        progress = 100;
        clearInterval(loadingInterval);
        setTimeout(() => {
          loadingScreen.classList.add('fade-out');
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.getElementById('app').style.display = 'flex';
            Character.init('character-canvas');
            AbacusEngine.init('abacus-canvas');
            Character.welcome();
            this.navigate('home');
          }, 500);
        }, 400);
      }
      if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';
      if (loadingText) loadingText.textContent = tips[Math.floor(progress / 25)] || tips[tips.length - 1];
    }, 150);
  },

  bindGlobalEvents() {
    document.addEventListener('click', () => { AudioManager.ensureContext(); }, { once: true });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('settings-panel');
        if (panel?.classList.contains('show')) this.toggleSettings();
      }
      if (e.key === 'F11') { e.preventDefault(); this.toggleFullscreen(); }
    });
  },

  navigate(page, data = null) {
    const mainContent = document.getElementById('main-content');
    mainContent.style.opacity = '0';
    mainContent.style.transform = 'translateX(30px)';
    setTimeout(() => {
      switch(page) {
        case 'home': this.renderHomePage(); break;
        case 'learn-abacus': this.renderLearnAbacusPage(); break;
        case 'learn-beads': this.renderLearnBeadsPage(data); break;
        case 'practice-match': this.renderMatchGamePage(); break;
        case 'level-select': this.renderLevelSelectPage(data); break;
        case 'game': this.renderGamePage(data); break;
        case 'progress': this.renderProgressPage(); break;
        case 'practice': this.renderPracticePage(); break;
        default: this.renderHomePage();
      }
      this.currentPage = page;
      setTimeout(() => { mainContent.style.opacity = '1'; mainContent.style.transform = 'translateX(0)'; }, 50);
      AudioManager.play('click');
    }, 200);
  },

  renderHomePage() {
    const mainContent = document.getElementById('main-content');
    const stats = Storage.getLearningStats();

    mainContent.innerHTML = `
      <div class="home-container">
        <div class="welcome-banner">
          <div class="welcome-character">🐻</div>
          <h1 class="welcome-title">欢迎来到珠心算小乐园！</h1>
          <p class="welcome-subtitle">和算算、珠珠一起，快乐学算盘吧！✨</p>
        </div>

        <div class="stats-overview">
          <div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${stats.totalStars}</div><div class="stat-label">获得星星</div></div>
          <div class="stat-card"><div class="stat-icon">🏅</div><div class="stat-value">${stats.completedLevels}/${stats.totalLevels}</div><div class="stat-label">通关进度</div></div>
          <div class="stat-card"><div class="stat-icon">⏰</div><div class="stat-value">${stats.totalTimeMinutes}分</div><div class="stat-label">学习时长</div></div>
          <div class="stat-card"><div class="stat-icon">📅</div><div class="stat-value">${stats.learningDays}天</div><div class="stat-label">学习天数</div></div>
        </div>

        <div class="modules-grid">
          ${this.createModuleCard('🧮','认识算盘','学习算盘的结构和各个部分','learn-abacus')}
          ${this.createModuleCard('🎯','拨珠教学','跟着儿歌学会1-10每个数字的拨珠方法','learn-beads')}
          ${this.createModuleCard('👫','数珠游戏','玩找朋友、击铃说数等趣味小游戏','practice-match')}
          ${this.createModuleCard('📊','学习进度','查看你的学习成果和获得的勋章','progress')}
          ${this.createModuleCard('🎮','自由练习','拨珠练习、口算挑战、补数歌接龙','practice')}
        </div>

        <div class="challenge-section">
          <div class="section-header">
            <h2 class="section-title">🏆 闯关模式</h2>
            <button class="quick-start-btn" onclick="App.continueGame()">⚡ 继续闯关</button>
          </div>
          <div class="chapter-grid">${this.renderChapterCards()}</div>
        </div>
      </div>`;
    this.bindHomeEvents();
  },

  createModuleCard(icon,title,desc,navTarget) {
    return `<div class="module-card" data-nav="${navTarget}"><span class="module-icon">${icon}</span><h3 class="module-title">${title}</h3><p class="module-desc">${desc}</p></div>`;
  },

  renderChapterCards() {
    let html = '';
    for(let i=1;i<=3;i++){
      const chapter=GameEngine.getChapter(i);
      if(!chapter) continue;
      const isUnlocked=Storage.isChapterUnlocked(i);
      const isCompleted=GameEngine.isChapterCompleted(i);
      const progress=GameEngine.getChapterProgress(i);
      const pct=progress.total>0?(progress.completed/progress.total*100):0;
      let sc='status-locked',st='🔒 未解锁';
      if(isCompleted){sc='status-completed';st='✅ 已完成';}
      else if(isUnlocked){sc='status-in-progress';st=`${progress.completed}/${progress.total}`;}
      html+=`<div class="chapter-card${!isUnlocked?' locked':''}" data-chapter="${i}"><div class="chapter-icon">${isUnlocked?chapter.icon:'🔒'}</div><div class="chapter-name">${chapter.name}</div><div class="chapter-progress">${chapter.description}</div><div class="progress-bar-mini"><div class="progress-bar-mini-fill" style="width:${pct}%"></div></div><span class="chapter-status ${sc}">${st}</span></div>`;
    }
    return html;
  },

  bindHomeEvents(){
    document.querySelectorAll('.module-card[data-nav]').forEach(card=>{card.addEventListener('click',()=>{this.navigate(card.dataset.nav);});});
    document.querySelectorAll('.chapter-card[data-chapter]').forEach(card=>{
      card.addEventListener('click',()=>{
        const id=parseInt(card.dataset.chapter);
        if(Storage.isChapterUnlocked(id))this.navigate('level-select',{chapterId:id});
        else{UI.showToast('请先完成前面的章节哦~','warning');Character.speak('小朋友，要先通过前面的关卡才能解锁这里呢！');}
      });
    });
  },

  continueGame(){const p=Storage.getProgress();this.navigate('level-select',{chapterId:p.currentChapter,levelId:p.currentLevel});},

  renderLevelSelectPage(data){
    const{chapterId=1}=data||{};
    const chapter=GameEngine.getChapter(chapterId);
    if(!chapter){this.navigate('home');return;}
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container">
      <div style="margin-bottom:20px;"><button onclick="App.navigate('home')" style="padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 3px 10px rgba(0,0,0,0.1);">← 返回首页</button></div>
      <div class="welcome-banner" style="padding:30px;"><h2 style="font-size:28px;margin-bottom:10px;">${chapter.icon} ${chapter.name}</h2><p style="font-size:17px;color:var(--text-secondary);">${chapter.description}</p><p style="font-size:16px;color:var(--btn-primary);margin-top:12px;">🏅 通关奖励：${chapter.badge}</p></div>
      <div class="level-select-grid">${this.renderLevelCards(chapterId,chapter)}</div></div>`;
    this.bindLevelSelectEvents(chapterId);
  },

  renderLevelCards(chapterId,chapter){
    let h='';
    chapter.levels.forEach((level,i)=>{
      const n=i+1,u=Storage.isLevelUnlocked(chapterId,n),c=Storage.getProgress().completedLevels.includes(`${chapterId}-${n}`),cr=GameEngine.currentChapter===chapterId&&GameEngine.currentLevel===n;
      let sc='',st='';
      if(c){sc='completed';st='⭐ 已通关';}else if(cr){sc='current';st='▶️ 进行中';}else if(!u){sc='locked';st='';}
      h+=`<div class="level-card ${sc}" data-level="${n}" data-chapter="${chapterId}"><div class="level-number">${u?n:'🔒'}</div><div class="level-stars">${c?'⭐':''}</div><div class="level-status-text">${st}</div><div style="font-size:13px;color:var(--text-secondary);margin-top:5px;">${level.name}</div></div>`;
    });
    return h;
  },

  bindLevelSelectEvents(chapterId){
    document.querySelectorAll('.level-card[data-level]').forEach(card=>{
      card.addEventListener('click',()=>{const lid=parseInt(card.dataset.level);if(Storage.isLevelUnlocked(chapterId,lid))this.navigate('game',{chapterId,levelId:lid});else{UI.showToast('请先完成前面的关卡~','warning');Character.speak('要一关一关地挑战哦！');}});
    });
  },

  renderGamePage(data){
    const{chapterId=1,levelId=1}=data||{};
    if(!GameEngine.startLevel(chapterId,levelId)){this.navigate('home');return;}
    const ld=GameEngine.currentLevelData,ch=GameEngine.getChapter(chapterId),mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container">
      <div class="game-header">
        <div class="game-info-left"><div class="game-chapter-name">${ch?.icon||''} ${ch?.name||''}</div><div class="game-level-name">第 ${levelId} 关：${ld?.name||''}</div></div>
        <div class="game-info-right"><div class="game-stat"><span class="stat-icon-small">❤️</span><span class="stat-value-small" id="attempts-display">${GameEngine.attemptsLeft}/3</span></div><div class="game-stat"><span class="stat-icon-small">⭐</span><span class="stat-value-small">${Storage.getStars()}</span></div></div>
      </div>
      <div class="game-main-area"><div class="game-question-area" id="question-area">${this.renderQuestionContent(ld)}</div><div class="answer-area" id="answer-area">${this.renderAnswerArea(ld)}</div></div></div>`;
    this.initGameLogic(chapterId,levelId,ld);
  },

  renderQuestionContent(ld){
    if(!ld)return'<p>加载中...</p>';
    switch(ld.type){
      case'matching':return this.renderMatchingQ(ld);case'riddle':return this.renderRiddleQ(ld);
      case'dialNumber':return this.renderDialNumberQ(ld);case'numberMatch':return this.renderNumberMatchQ(ld);
      case'calculation':case'fullFiveAdd':return this.renderCalculationQ(ld);
      case'teaching':return this.renderTeachingC(ld);default:return'<p>题目...</p>';
    }
  },

  renderMatchingQ(ld){
    const pairs=ld.data||[];
    return `<div class="question-header"><span class="question-number-badge">连连看</span><h3 class="question-text">${ld.description}</h3></div>
      <div class="matching-game-area">
        <div class="match-column match-left" id="match-left">${pairs.map((p,i)=>`<div class="match-item" data-index="${i}" data-type="question" data-answer="${p.answer}">${p.question}</div>`).join('')}</div>
        <div class="match-center">💕</div>
        <div class="match-column match-right" id="match-right">${Utils.shuffleArray(pairs.map((p,i)=>({...p,shuffledIndex:i}))).map(p=>`<div class="match-item" data-index="${p.shuffledIndex}" data-type="answer" data-answer="${p.answer}">${this.getPartVisual(p.answer)}</div>`).join('')}</div>
      </div>`;
  },

  getPartVisual(k){const v={frame:'📦 框（四边）',beam:'➖ 梁（横线）',rod:'📏 档（竖杆）',upperBead:'💛 上珠（上面）',lowerBead:'🤍 下珠（下面）'};return v[k]||k;},

  renderRiddleQ(ld){const d=ld.data||{};return `<div class="question-header"><span class="question-number-badge">🧩 猜谜语</span></div><div class="visual-aid-area"><div style="background:linear-gradient(135deg,#FFF9C4,#FFE082);padding:35px;border-radius:20px;max-width:450px;margin:auto;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.08);"><div style="font-size:50px;margin-bottom:15px;">🤔</div><p style="font-size:20px;line-height:2;color:var(--text-primary);white-space:pre-line;font-weight:bold;">${d.riddle}</p></div></div>`;},

  renderDialNumberQ(ld){const nums=ld.data?.numbers||[1];return `<div class="teaching-step-info"><span class="step-number">?</span><span class="step-text">请在算盘上拨出数字：<strong style="font-size:32px;color:var(--btn-primary);">${nums[0]}</strong></span></div><div class="abacus-container" style="max-width:500px;margin:20px auto;"><canvas id="game-abacus-canvas" width="400" height="480"></canvas><div class="abacus-value-display" id="dial-value-display">0</div></div>`;},

  renderNumberMatchQ(ld){return `<div class="question-header"><span class="question-number-badge">👫 找朋友</span><h3 class="question-text">${ld.description}</h3></div><div id="number-match-content" style="padding:20px;"><p style="text-align:center;font-size:22px;color:var(--text-secondary);">点击开始按钮开始游戏</p></div>`;},

  renderCalculationQ(ld){
    const qs=ld.questions||[],q=qs[0]||{};
    return `<div class="question-header"><span class="question-number-badge">第 1 题</span><h3 class="question-text">${ld.description}</h3></div>
      <div class="visual-aid-area">${q.visual?`<div style="font-size:48px;">${q.visual}</div>`:''}<div class="equation-display">${q.equation||'?+?=?'}</div></div>
      <div class="abacus-container" style="max-width:450px;margin:15px auto;padding:18px;"><canvas id="game-abacus-canvas" width="380" height="420"></canvas><div class="abacus-value-display" id="calc-abacus-value">0</div><p style="text-align:center;font-size:14px;color:var(--text-secondary);margin-top:8px;">💡 可以用算盘帮忙计算哦</p></div>`;
  },

  renderTeachingC(ld){
    const c=ld.teachingContent||{},steps=c.steps||[];
    return `<div class="teaching-mode">
      <div style="background:linear-gradient(135deg,#E8F5E9,#C8E6C6);border-radius:20px;padding:25px;margin-bottom:20px;border-left:6px solid var(--success);"><p style="font-size:19px;line-height:1.8;color:var(--text-primary);">📖 ${c.story||''}</p></div>
      <div id="teaching-steps">${steps.map((s,i)=>`<div class="teaching-step-info" data-step="${i}" style="opacity:${i===0?'1':'0.4'};cursor:pointer;transition:all 0.3s ease;"><span class="step-number">${i+1}</span><span class="step-text">${s}</span></div>`).join('')}</div>
      <div class="abacus-container" style="max-width:450px;margin:25px auto;"><canvas id="game-abacus-canvas" width="380" height="420"></canvas></div>
      <div style="text-align:center;margin-top:20px;"><button class="abacus-btn btn-demo" id="start-teaching-btn" style="font-size:19px;padding:16px 35px;">▶️ 开始演示</button></div></div>`;
  },

  renderAnswerArea(ld){
    if(!ld)return'<p>答案区</p>';
    switch(ld.type){
      case'riddle':
        const ro=ld.data?.options||[];
        return `<div class="answer-title">选择你的答案：</div><div class="answer-options-grid" id="riddle-options">${ro.map((o,i)=>`<button class="answer-option-btn" data-index="${i}">${o}</button>`).join('')}</div><div class="attempts-display" id="hearts-display"></div>`;
      case'matching':return `<div class="answer-title">已匹配：<span id="matched-count">0</span>/5</div><div id="match-feedback" style="min-height:80px;display:flex;align-items:center;justify-content:center;"></div>`;
      case'dialNumber':case'calculation':case'fullFiveAdd':return `<div class="answer-title">输入你的答案：</div><div class="answer-input-group"><input type="number" class="answer-input" id="answer-input" placeholder="?" min="0" max="999"></div><button class="submit-answer-btn" id="submit-answer-btn">确定 ✓</button><div class="attempts-display" id="hearts-display"></div>`;
      case'numberMatch':return `<div class="answer-title">选择正确的算盘图：</div><div id="match-options-container"></div><div class="attempts-display" id="hearts-display"></div>`;
      case'teaching':return `<div style="text-align:center;padding:20px;"><p style="font-size:18px;color:var(--text-secondary);">👆 点击"开始演示"观看教学动画<br>学习完成后点击下方按钮进入练习</p><button class="abacus-btn btn-confirm" id="finish-teaching-btn" style="margin-top:15px;">我学会了，去练习！→</button></div>`;
      default:return '';
    }
  },

  initGameLogic(chapterId,levelId,ld){
    this.updateHeartsDisplay();
    switch(ld?.type){
      case'riddle':this.initRiddleGame(ld);break;case'matching':this.initMatchingGame(ld);break;
      case'dialNumber':this.initDialNumberGame(ld);break;case'calculation':case'fullFiveAdd':this.initCalculationGame(chapterId,levelId,ld);break;
      case'teaching':this.initTeachingMode(ld);break;case'numberMatch':this.initNumberMatchGame(ld);break;
    }
  },

  updateHeartsDisplay(){
    const he=document.getElementById('hearts-display'),ae=document.getElementById('attempts-display');
    if(he){he.innerHTML='';for(let i=0;i<3;i++){const h=document.createElement('span');h.className='attempt-heart'+(i>=GameEngine.attemptsLeft?' lost':'');h.textContent='❤️';he.appendChild(h);}}
    if(ae)ae.textContent=`${GameEngine.attemptsLeft}/3`;
  },

  initRiddleGame(ld){
    const opts=document.querySelectorAll('#riddle-options .answer-option-btn'),ci=ld.data?.correctAnswer??0;
    opts.forEach(btn=>{
      btn.addEventListener('click',()=>{
        const si=parseInt(btn.dataset.index),cr=si===ci;
        opts.forEach(b=>b.disabled=true);
        if(cr){btn.classList.add('correct');const r=GameEngine.submitAnswer(si,ci);this.handleGameResult(r,ld);}
        else{btn.classList.add('wrong');const r=GameEngine.submitAnswer(si,ci);if(r.exhausted)this.showRetryOption(ld);else{this.updateHeartsDisplay();UI.showToast(r.hintText||'再想想看~','warning');setTimeout(()=>{opts.forEach(b=>{b.disabled=false;b.classList.remove('wrong','selected');});},1200);}}
      });
    });
  },

  initMatchingGame(ld){
    let sl=null,sr=null,mc=0,tp=(ld.data||[]).length;
    const li=document.querySelectorAll('#match-left .match-item'),ri=document.querySelectorAll('#right .match-item');
    const hs=(item,side)=>{
      if(item.classList.contains('matched'))return;
      document.querySelectorAll('.match-item.selected').forEach(el=>el.classList.remove('selected'));
      item.classList.add('selected');
      if(side==='left')sl=item;else sr=item;
      if(sl&&sr){
        const la=sl.dataset.answer,ra=sr.dataset.answer;
        if(la===ra){sl.classList.add('matched');sr.classList.add('matched');sl.classList.remove('selected');sr.classList.remove('selected');mc++;document.getElementById('matched-count').textContent=mc;AudioManager.play('correct');if(mc>=tp){const r=GameEngine.submitAnswer(mc,tp);this.handleGameResult(r,ld);}}
        else{sl.classList.add('wrong');sr.classList.add('wrong');AudioManager.play('wrong');const r=GameEngine.submitAnswer(-1,-1);this.updateHeartsDisplay();if(r.exhausted)this.showRetryOption(ld);else{setTimeout(()=>{sl.classList.remove('wrong','selected');sr.classList.remove('wrong','selected');sl=null;sr=null;},800);}}
        sl=null;sr=null;
      }
    };
    li.forEach(item=>item.addEventListener('click',()=>hs(item,'left')));
    ri.forEach(item=>item.addEventListener('click',()=>hs(item,'right')));
  },

  initDialNumberGame(ld){
    const canvas=document.getElementById('game-abacus-canvas'),vd=document.getElementById('dial-value-display'),sb=document.getElementById('submit-answer-btn'),ip=document.getElementById('answer-input');
    if(canvas){AbacusEngine.init(canvas.id);AbacusEngine.onValueChanged=(val)=>{if(vd)vd.textContent=val;};}
    if(sb&&ip)sb.addEventListener('click',()=>{const uv=parseInt(ip.value)||AbacusEngine.getValue(),tv=ld.data?.numbers?.[0]||1,r=GameEngine.submitAnswer(uv,tv);this.handleGameResult(r,ld);});
  },

  initCalculationGame(chapterId,levelId,ld){
    let qi=0,qs=ld.questions||[];
    const canvas=document.getElementById('game-abacus-canvas'),vd=document.getElementById('calc-abacus-value'),eqEl=document.querySelector('.equation-display'),qb=document.querySelector('.question-number-badge'),ip=document.getElementById('answer-input'),sb=document.getElementById('submit-answer-btn');
    if(canvas){AbacusEngine.init(canvas.id);AbacusEngine.onValueChanged=(val)=>{if(vd)vd.textContent=val;};}
    const lq=(idx)=>{
      if(idx>=qs.length){const r=GameEngine.submitAnswer(1,1);this.handleGameResult(r,ld);return;}
      const q=qs[idx];
      if(eqEl)eqEl.textContent=q.equation;if(qb)qb.textContent=`第 ${idx+1} 题`;if(ip)ip.value='';if(canvas)AbacusEngine.reset();
    };
    lq(qi);
    if(sb&&ip){
      const hs=()=>{
        const ua=parseInt(ip.value),q=qs[qi];
        if(isNaN(ua)){UI.showToast('请输入答案哦~','warning');return;}
        const r=GameEngine.submitAnswer(ua,q.answer);
        if(r.success){qi++;if(qi>=qs.length)this.handleGameResult(r,ld);else{UI.showToast('答对了！继续下一题~','success');Character.speak('太棒了！下一题来了！');setTimeout(()=>lq(qi),1200);}}
        else{this.updateHeartsDisplay();if(r.exhausted)this.showRetryOption(ld);else{UI.showToast(r.hintText||'再想想~','warning');ip.value='';}}
      };
      sb.addEventListener('click',hs);ip.addEventListener('keypress',(e)=>{if(e.key==='Enter')hs();});
    }
  },

  initTeachingMode(ld){
    const canvas=document.getElementById('game-abacus-canvas'),startBtn=document.getElementById('start-teaching-btn'),finishBtn=document.getElementById('finish-teaching-btn'),steps=document.querySelectorAll('[data-step]');
    if(canvas)AbacusEngine.init(canvas.id);
    if(startBtn)startBtn.addEventListener('click',async()=>{
      startBtn.disabled=true;startBtn.textContent='演示中...';
      const ex=ld.teachingContent?.example;
      if(ex&&canvas)await AbacusEngine.demoSetNumber(ex.answer);
      steps.forEach(s=>{s.style.opacity='1';s.style.background='linear-gradient(135deg,#E8F5E9,#C8E6C6)';});
      startBtn.textContent='✅ 演示完成';Character.speak('你看明白了吗？现在可以去练习啦！');
    });
    if(finishBtn)finishBtn.addEventListener('click',()=>{const r=GameEngine.submitAnswer(1,1);this.handleGameResult(r,ld);});
  },

  initNumberMatchGame(ld){
    const container=document.getElementById('match-options-container');if(!container)return;
    const pairs=ld.data?.pairs||[],cp=pairs[0];if(!cp)return;
    container.innerHTML=`<div style="text-align:center;margin-bottom:20px;"><span style="font-size:48px;font-weight:bold;color:var(--btn-primary);">${cp.number}</span><p style="color:var(--text-secondary);margin-top:8px;">找出对应的算盘状态</p></div><div class="answer-options-grid">${Utils.shuffleArray([...pairs]).map((p,i)=>`<button class="answer-option-btn" data-value="${p.number}">${p.number} 的算盘</button>`).join('')}</div>`;
    container.querySelectorAll('.answer-option-btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const val=parseInt(btn.dataset.value),cr=val===cp.number;
        container.querySelectorAll('.answer-option-btn').forEach(b=>b.disabled=true);
        if(cr){btn.classList.add('correct');const r=GameEngine.submitAnswer(val,cp.number);this.handleGameResult(r,ld);}
        else{btn.classList.add('wrong');const r=GameEngine.submitAnswer(val,cp.number);if(r.exhausted)this.showRetryOption(ld);else{this.updateHeartsDisplay();setTimeout(()=>{container.querySelectorAll('.answer-option-btn').forEach(b=>{b.disabled=false;b.classList.remove('wrong','selected');});},1000);}}
      });
    });
  },

  handleGameResult(result,ld){
    if(result.success){
      UI.showResult({success:true,title:'🎉 太棒了！',message:result.message||'你完成了这一关！',starsEarned:result.starsEarned||1,badge:result.badge||null,onRetry:()=>{GameEngine.restartLevel();this.navigate('game',{chapterId:GameEngine.currentChapter,levelId:GameEngine.currentLevel});},onNext:result.hasNextLevel?()=>{const n=GameEngine.getNextLevel();if(n)this.navigate('game',n);}:null,onHome:()=>this.goToHome()});
      Character.celebrate();
    }else if(result.exhausted)this.showRetryOption(ld);
  },

  showRetryOption(ld){UI.showResult({success:false,title:'💪 别灰心',message:'机会用完了，要不要再试一次？',starsEarned:0,onRetry:()=>{GameEngine.restartLevel();this.navigate('game',{chapterId:GameEngine.currentChapter,levelId:GameEngine.currentLevel});},onHome:()=>this.goToHome()});},
  goToHome(){GameEngine.goToHome();},

  renderLearnAbacusPage(){
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container teaching-mode"><button onclick="App.navigate('home')" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;box-shadow:0 3px 10px rgba(0,0,0,0.1);">← 返回首页</button><div class="welcome-banner"><h2>🧮 认识我们的算盘朋友</h2><p>算盘是古代中国人发明的计算工具，已经有1800多年的历史啦！</p></div><div class="abacus-container" style="max-width:550px;"><h3 class="abacus-title">🎯 这是算盘的样子</h3><canvas id="learn-abacus-canvas" width="500" height="600" style="cursor:default;"></canvas></div><div class="rhyme-display"><p class="rhyme-text">小小算盘长又长又方，<br>四周边长叫做<span style="color:var(--btn-primary);">框</span>，<br>中间横卧一道<span style="color:var(--btn-primary);">梁</span>，<br>杆杆竖立叫做<span style="color:var(--btn-primary);">档</span>，<br>一颗下珠代表<span style="color:var(--btn-primary);">一</span>，<br>一颗上珠代表<span style="color:var(--btn-primary);">五</span>。</p></div><div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:25px;"><button class="abacus-btn btn-demo" onclick="App.showAbacusParts()">🔍 认识部件</button><button class="abacus-btn btn-reset" onclick="App.playAbacusRhyme()">🎵 听儿歌</button><button class="abacus-btn btn-confirm" onclick="App.navigate('level-select',{chapterId:1})">🎮 去闯关</button></div></div>`;
    setTimeout(()=>{const c=document.getElementById('learn-abacus-canvas');if(c){AbacusEngine.init(c.id);AbacusEngine.setValue(678);}},100);
    Character.speak('这就是我们的算盘朋友！让我来给你介绍它的各个部分吧~');
  },

  showAbacusParts(){Character.speak('仔细看哦，我要介绍算盘的各个部位了！');AudioManager.play('hint');[{name:'📦 框',delay:0},{name:'➖ 梁',delay:1200},{name:'📏 档',delay:2400},{name:'💛 上珠',delay:3600},{name:'🤍 下珠',delay:4800}].forEach(p=>{setTimeout(()=>{Character.speak(`这是${p.name}！`);AudioManager.play('bead-up');},p.delay);});},
  playAbacusRhyme(){Character.speak('一起来唱算盘儿歌吧！🎵');['小小算盘长又方，','四周边长叫做框，','中间横卧一道梁，','杆杆竖立叫做档，','一颗下珠代表一，','一颗上珠代表五。'].forEach((l,i)=>{setTimeout(()=>{Character.speak(l,2500);AudioManager.playBellSound(1);},i*2800);});},

  renderLearnBeadsPage(data){
    const num=data?.number||1,rhymes={1:'1像铅笔能写字',2:'2像小鸭水中游',3:'3像耳朵会听话',4:'4像红旗迎风飘',5:'5像钩子能钓鱼',6:'6像哨子嘟嘟吹',7:'7像镰刀割青草',8:'8像葫芦扭一扭',9:'9像蝌蚪尾巴摇',10:'10像油条加鸡蛋'};
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container teaching-mode"><button onclick="App.navigate('home')" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回首页</button><div class="rhyme-display"><span class="rhyme-number">${num}</span><p class="rhyme-text">${rhymes[num]||''}</p></div><div class="abacus-container" style="max-width:500px;"><h3 class="abacus-title">数字 ${num} 在算盘上的样子</h3><canvas id="learn-beads-canvas" width="450" height="520"></canvas><div class="abacus-value-display" id="beads-demo-value">${num}</div></div><div style="display:flex;gap:15px;justify-content:center;flex-wrap:wrap;margin-top:25px;"><button class="abacus-btn btn-demo" id="demo-bead-btn">▶️ 演示拨珠</button><button class="abacus-btn btn-confirm" id="practice-bead-btn">✋ 我来试试</button>${num<10?`<button class="abacus-btn btn-reset" onclick="App.renderLearnBeadsPage({number:${num+1}})">下一个 → ${num+1}</button>`:''}</div></div>`;
    setTimeout(()=>{
      const c=document.getElementById('learn-beads-canvas');if(c)AbacusEngine.init(c.id);
      const db=document.getElementById('demo-bead-btn'),pb=document.getElementById('practice-bead-btn');
      if(db)db.addEventListener('click',()=>{db.disabled=true;db.textContent='演示中...';Character.speak(`看好了，数字${num}是这样拨的！`);if(c)AbacusEngine.demoSetNumber(num,()=>{db.disabled=false;db.textContent='▶️ 再演示一次';Character.speak('学会了吗？你可以自己试试哦！');});});
      if(pb)pb.addEventListener('click',()=>{Character.speak('好棒！现在轮到你来拨出数字'+num+'了！');if(c)AbacusEngine.isDemoMode=false;});
    },100);
    Character.speak(`今天我们学习数字${num}的拨法！"${rhymes[num]}"`);
  },

  renderMatchGamePage(){
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.navigate('home')" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回首页</button><div class="welcome-banner"><h2>👫 珠宝宝找朋友</h2><p>帮助数字找到它在算盘上的好朋友！</p></div><div id="match-game-area" style="padding:20px;"><div style="text-align:center;padding:40px;background:white;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.08);"><div style="font-size:60px;margin-bottom:15px;">🎯</div><p style="font-size:22px;color:var(--text-secondary);">准备好开始了吗？</p><button class="abacus-btn btn-confirm" onclick="App.startMatchGame()" style="margin-top:20px;font-size:20px;">🚀 开始游戏</button></div></div></div>`;
    Character.speak('欢迎来到珠宝宝找朋友游戏！准备好了吗？');
  },

  startMatchGame(){
    Character.speak('游戏开始！看清楚数字，在算盘上拨出来哦！');
    const tn=Utils.randomInt(1,10),ga=document.getElementById('match-game-area');
    ga.innerHTML=`<div class="target-display"><div class="target-label">请拨出这个数字：</div><div class="target-number">${tn}</div></div><div class="abacus-container" style="max-width:450px;"><canvas id="match-game-canvas" width="420" height="500"></canvas><div class="abacus-value-display" id="match-game-value">0</div></div><div class="feedback-area" id="match-feedback" style="min-height:140px;"><p style="color:var(--text-secondary);">在算盘上拨出 ${tn} 然后点击确定</p></div><button class="abacus-btn btn-confirm" id="match-confirm-btn" style="width:100%;margin-top:15px;">确定 ✓</button>`;
    setTimeout(()=>{
      const c=document.getElementById('match-game-canvas');if(c){AbacusEngine.init(c.id);AbacusEngine.onValueChanged=(val)=>{const d=document.getElementById('match-game-value');if(d)d.textContent=val;};}
      const cb=document.getElementById('match-confirm-btn');
      if(cb)cb.addEventListener('click',()=>{const v=AbacusEngine.getValue(),fb=document.getElementById('match-feedback');if(v===tn){fb.className='feedback-area feedback-correct';fb.innerHTML=`<div class="feedback-icon">🎉</div><div class="feedback-text">太棒了！答对了！<br>${tn} 就是这个样子！</div>`;AudioManager.play('success');Character.showHappy(`哇！你成功拨出了${tn}！真厉害！`);setTimeout(()=>this.startMatchGame(),2000);}else{fb.className='feedback-area feedback-wrong';fb.innerHTML=`<div class="feedback-icon">🤔</div><div class="feedback-text">哎呀，不是${v}<br>再试一次，拨出${tn}哦！</div>`;AudioManager.play('wrong');Character.showSad('没关系，再拨一次看看！');}});
    },100);
  },

  renderProgressPage(){
    const s=Storage.getLearningStats(),bd=Storage.getBadges(),allB=GameEngine.getAllBadges(),mk=Storage.getMistakes(5),mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.navigate('home')" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回首页</button><div class="welcome-banner"><h2>🐻 算算的学习报告</h2><p>看看你这段时间的学习成果吧！</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;margin-bottom:30px;"><div class="stat-card"><div class="stat-icon">⭐</div><div class="stat-value">${s.totalStars}</div><div class="stat-label">获得星星</div></div><div class="stat-card"><div class="stat-icon">🏅</div><div class="stat-value">${s.totalBadges}</div><div class="stat-label">获得勋章</div></div><div class="stat-card"><div class="stat-icon">📚</div><div class="stat-value">${s.completedLevels}/${s.totalLevels}</div><div class="stat-label">通关进度</div></div><div class="stat-card"><div class="stat-icon">⏰</div><div class="stat-value">${s.totalTimeMinutes}分</div><div class="stat-label">学习时长</div></div></div><div class="welcome-banner" style="margin-bottom:25px;"><h3 style="font-size:22px;margin-bottom:15px;">🏅 获得的勋章</h3><div style="display:flex;gap:15px;flex-wrap:wrap;justify-content:center;">${allB.map(b=>`<div style="padding:18px 24px;border-radius:18px;text-align:center;background:${bd.includes(b.id)?'linear-gradient(135deg,#FFD700,#FFA500)':'#f0f0f0'};color:${bd.includes(b.id)?'white':'#999'};box-shadow:${bd.includes(b.id)?'0 5px 15px rgba(255,215,0,0.3)':'none'};opacity:${bd.includes(b.id)?'1':'0.6'};min-width:130px;"><div style="font-size:32px;margin-bottom:6px;">${b.icon}</div><div style="font-size:14px;font-weight:bold;">${b.name}</div></div>`).join('')}</div></div><div class="welcome-banner" style="margin-bottom:25px;"><h3 style="font-size:22px;margin-bottom:15px;">📝 最近练习记录</h3>${mk.length>0?`<div style="text-align:left;">${mk.map(m=>`<div style="padding:12px 16px;margin:8px 0;border-radius:12px;background:${m.correct?'#E8F5E9':'#FFEBEE'};border-left:4px solid ${m.correct?'#4CAF50':'#F44336'};font-size:15px;"><strong>${m.level||'未知关卡'}</strong><span style="float:right;color:${m.correct?'#4CAF50':'#F44336'};">${m.correct?'✓ 正确':'✗ 错误'}</span>${m.timestamp?`<br><small style="color:#999;">${new Date(m.timestamp).toLocaleDateString()}</small>`:''}</div>`).join('')}</div>`:'<p style="color:var(--text-secondary);text-align:center;">还没有练习记录哦，快去学习吧！</p>'}</div><div style="text-align:center;margin-top:20px;"><button class="abacus-btn btn-confirm" onclick="App.navigate('home')">🏠 返回首页</button></div></div>`;
    Character.speak(s.totalStars>0?`你已经获得了${s.totalStars}颗星星和${s.totalBadges}枚勋章，太厉害了！`:'这里可以查看你的学习成果，快去学习获得星星和勋章吧！');
  },

  renderPracticePage(){
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.navigate('home')" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回首页</button><div class="welcome-banner"><h2>🎮 自由练习场</h2><p>在这里可以自由练习各种技能，没有时间压力哦！</p></div><div class="modules-grid">${this.createModuleCard('🎯','拨珠练习','随机出现数字，快速在算盘上拨出来','practice-dial')}${this.createModuleCard('✏️','口算小挑战','10以内加减法口算训练','practice-math')}${this.createModuleCard('🎵','补数歌接龙','一起唱补数歌，记住10的好朋友','practice-song')}${this.createModuleCard('🔔','击铃说数','听声音数数，选出正确的数量','practice-bell')}</div></div>`;
    document.querySelectorAll('.module-card[data-nav]').forEach(c=>{c.addEventListener('click',()=>this.startPracticeMode(c.dataset.nav));});
    Character.speak('欢迎来到自由练习场！想练什么就选什么，慢慢来不着急~');
  },

  startPracticeMode(mode){switch(mode){case'practice-dial':this.startDialPractice();break;case'practice-math':this.startMathPractice();break;case'practice-song':this.startSongPractice();break;case'practice-bell':this.startBellPractice();break;}},

  startDialPractice(){
    const tn=Utils.randomInt(1,10),mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.renderPracticePage()" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回练习</button><div class="practice-mode"><div class="target-display"><div class="target-label">目标数字</div><div class="target-number" id="ptn">${tn}</div></div><div class="abacus-container" style="max-width:450px;"><canvas id="prac-abacus-canvas" width="420" height="500"></canvas><div class="abacus-value-display" id="prac-ab-val">0</div><button class="abacus-btn btn-confirm" id="prac-check-btn" style="width:100%;margin-top:12px;">检查答案 ✓</button></div></div><div id="prac-fb" style="margin-top:20px;"></div></div>`;
    setTimeout(()=>{
      const c=document.getElementById('prac-abacus-canvas');if(c){AbacusEngine.init(c.id);AbacusEngine.reset();AbacusEngine.onValueChanged=(v)=>{const d=document.getElementById('prac-ab-val');if(d)d.textContent=v;};}
      const cb=document.getElementById('prac-check-btn');
      if(cb)cb.addEventListener('click',()=>{const v=AbacusEngine.getValue(),t=parseInt(document.getElementById('ptn').textContent),fb=document.getElementById('prac-fb');if(v===tn){fb.innerHTML='<div style="text-align:center;padding:20px;background:linear-gradient(135deg,#E8F5E9,#C8E6C6);border-radius:20px;"><div style="font-size:50px;">🎉</div><div style="font-size:22px;color:var(--success);font-weight:bold;margin-top:10px;">正确！太棒了！</div><button class="abacus-btn btn-demo" onclick="App.startDialPractice()" style="margin-top:15px;">下一题 →</button></div>';AudioManager.play('success');Character.showHappy('答对啦！你真棒！');}else{fb.innerHTML='<div style="text-align:center;padding:20px;background:linear-gradient(135deg,#FFEBEE,#FFCDD2);border-radius:20px;"><div style="font-size:50px;">🤔</div><div style="font-size:20px;color:var(--error);font-weight:bold;margin-top:10px;">你拨的是 ${v}，目标是 ${tn}</div><p style="color:var(--text-secondary);margin-top:8px;">再调整一下算珠试试~</div></div>';AudioManager.play('wrong');}});
    },100);
    Character.speak(`这次的目标是拨出数字${tn}，加油！`);
  },

  startMathPractice(){
    const a=Utils.randomInt(1,9),b=Math.min(Utils.randomInt(1,9),9-a),isAdd=Math.random()>0.5,ans=isAdd?a+b:Math.max(0,a-b),eq=isAdd?`${a}+${b}=?`:`${a}-${b}=?`,mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.renderPracticePage()" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回练习</button><div class="welcome-banner"><h2>✏️ 口算小挑战</h2></div><div style="text-align:center;padding:40px;"><div class="equation-display" style="font-size:56px;">${eq}</div><div style="margin:30px 0;"><input type="number" class="answer-input" id="math-pi" placeholder="?" style="width:150px;font-size:40px;"></div><button class="abacus-btn btn-confirm" id="math-ps" style="font-size:22px;padding:18px 45px;">提交答案</button></div><div id="math-pfb" style="margin-top:25px;"></div></div>`;
    const sb=document.getElementById('math-ps'),ip=document.getElementById('math-pi');
    if(sb&&ip){const ck=()=>{const ua=parseInt(ip.value),fb=document.getElementById('math-pfb');if(isNaN(ua)){UI.showToast('请输入答案哦~','warning');return;}if(ua===ans){fb.innerHTML=`<div style="text-align:center;padding:25px;background:linear-gradient(135deg,#E8F5E9,#C8E6C6);border-radius:20px;"><div style="font-size:55px;">🎉</div><div style="font-size:24px;color:var(--success);font-weight:bold;margin-top:12px;">正确！答案是 ${ans}</div><button class="abacus-btn btn-demo" onclick="App.startMathPractice()" style="margin-top:18px;font-size:19px;">下一题 →</button></div>`;AudioManager.play('correct');Character.showHappy('算对啦！你聪明！');}else{fb.innerHTML=`<div style="text-align:center;padding:25px;background:linear-gradient(135deg,#FFEBEE,#FFCDD2);border-radius:20px;"><div style="font-size:55px;">💪</div><div style="font-size:20px;color:var(--error);font-weight:bold;margin-top:12px;">你写的是 ${ua}，正确答案是 ${ans}</div><p style="color:var(--text-secondary);margin-top:10px;">没关系，再试一次！</p><button class="abacus-btn btn-reset" onclick="App.startMathPractice()" style="margin-top:12px;">换一题</button></div>`;AudioManager.play('wrong');Character.showSad('差一点点就对啦，加油！');}};sb.addEventListener('click',ck);ip.addEventListener('keypress',(e)=>{if(e.key==='Enter')ck();});}
    Character.speak(`${eq} 等于多少呢？动动小脑筋！`);
  },

  startSongPractice(){
    const mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.renderPracticePage()" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回练习</button><div class="welcome-banner"><h2>🎵 补数歌接龙</h2><p>两个数加起来等于10，它们就是好朋友（补数）！</p></div><div class="rhyme-display" style="margin:25px 0;"><p class="rhyme-text" style="font-size:22px;">一的补数九，九的补数一 ♪<br>二的补数八，八的补数二 ♪<br>三的补数七，七的补数三 ♪<br>四的补数六，六的补数四 ♪<br>五的补数五，五的五是五 ♪</p></div><div id="sg-area" style="background:white;border-radius:20px;padding:30px;text-align:center;box-shadow:0 4px 15px rgba(0,0,0,0.08);"><p style="font-size:20px;color:var(--text-secondary);margin-bottom:20px;">准备好了吗？我们来玩接龙游戏！</p><button class="abacus-btn btn-confirm" onclick="App.playSongGame()" style="font-size:20px;padding:16px 35px;">🎤 开始接龙</button></div></div>`;
    Character.speak('补数歌很有趣哦！两个好朋友加起来正好是10！');
  },

  playSongGame(){
    const pairs=[{q:'1 的补数是几？',a:9},{q:'2 的补数是几？',a:8},{q:'3 的补数是几？',a:7},{q:'4 的补数是几？',a:6},{q:'5 的补数是几？',a:5}],cp=pairs[Utils.randomInt(0,pairs.length-1)],opts=Utils.shuffleArray([cp.a,...Array.from({length:3},()=>Utils.randomInt(1,9)).filter(n=>n!==cp.a)]).slice(0,4),ga=document.getElementById('sg-area');
    ga.innerHTML=`<div style="font-size:28px;font-weight:bold;color:var(--text-primary);margin-bottom:25px;">🎵 ${cp.q}</div><div class="answer-options-grid" style="max-width:500px;margin:0 auto;">${opts.map(o=>`<button class="answer-option-btn song-opt" data-val="${o}">${o}</button>`).join('')}</div>`;
    ga.querySelectorAll('.song-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=parseInt(btn.dataset.val);
        ga.querySelectorAll('.song-opt').forEach(b=>b.disabled=true);
        if(v===cp.a){btn.classList.add('correct');AudioManager.playBellSound(2);Character.speak(`答对啦！${cp.q.replace('是几？','')}就是${v}！`);ga.innerHTML+='<div style="margin-top:25px;padding:20px;background:linear-gradient(135deg,#E8F5E9,#C8E6C6);border-radius:18px;"><p style="font-size:20px;color:var(--success);font-weight:bold;">🎉 正确！${cp.q} 答案是 ${v}</p><button class="abacus-btn btn-demo" onclick="App.playSongGame()" style="margin-top:12px;">再来一首 →</button></div>';}
        else{btn.classList.add('wrong');AudioManager.play('wrong');Character.speak(`不对哦，再想想...${cp.q}`);setTimeout(()=>{ga.querySelectorAll('.song-opt').forEach(b=>{b.disabled=false;b.classList.remove('wrong','selected');});},1200);}
      });
    });
  },

  startBellPractice(){
    const cnt=Utils.randomInt(1,6),opts=[cnt,...Array.from({length:3},()=>Utils.randomInt(1,9)).filter(n=>n!==cnt)].slice(0,4),mc=document.getElementById('main-content');
    mc.innerHTML=`<div class="game-container"><button onclick="App.renderPracticePage()" style="margin-bottom:20px;padding:10px 20px;border:none;border-radius:20px;background:var(--primary-yellow);cursor:pointer;font-size:16px;font-weight:bold;">← 返回练习</button><div class="welcome-banner"><h2>🔔 击铃说数</h2><p>仔细听铃声，数数响了几次？</p></div><div id="bell-ga" style="text-align:center;padding:40px;background:white;border-radius:20px;box-shadow:0 4px 15px rgba(0,0,0,0.08);"><div style="font-size:70px;margin-bottom:20px;">🔔</div><p style="font-size:20px;color:var(--text-secondary);margin-bottom:25px;">点击播放按钮听铃声</p><button class="abacus-btn btn-demo" id="play-bell-btn" style="font-size:20px;padding:16px 35px;margin-bottom:25px;">🔊 播放铃声</button><div id="bell-opts" style="display:none;"><p style="font-size:18px;font-weight:bold;margin-bottom:15px;">你听到了几次铃声？</p><div class="answer-options-grid" style="max-width:400px;margin:0 auto;">${Utils.shuffleArray(opts).map(o=>`<button class="answer-option-btn bell-opt" data-val="${o}" style="font-size:28px;">${o}</button>`).join('')}</div></div></div></div>`;
    const pb=document.getElementById('play-bell-btn');
    if(pb)pb.addEventListener('click',()=>{pb.disabled=true;pb.textContent='🔔 铃声播放中...';Character.speak('仔细听哦，数数响了几次？');AudioManager.playBellSound(cnt);setTimeout(()=>{pb.style.display='none';document.getElementById('bell-opts').style.display='block';},cnt*400+500);});
    document.querySelectorAll('.bell-opt').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const v=parseInt(btn.dataset.val);
        document.querySelectorAll('.bell-opt').forEach(b=>b.disabled=true);
        if(v===cnt){btn.classList.add('correct');AudioManager.play('correct');Character.showHappy(`太棒了！确实是${cnt}次铃声！耳朵真灵！`);document.getElementById('bell-ga').innerHTML+='<div style="margin-top:25px;padding:20px;background:linear-gradient(135deg,#E8F5E9,#C8E6C6);border-radius:18px;"><p style="font-size:20px;color:var(--success);font-weight:bold;">🎉 正确！响了 ${cnt} 次</p><button class="abacus-btn btn-demo" onclick="App.startBellPractice()" style="margin-top:12px;">再玩一次 →</button></div>';}
        else{btn.classList.add('wrong');AudioManager.play('wrong');Character.showSad(`哎呀，响了${cnt}次，不是${v}次哦`);setTimeout(()=>this.startBellPractice(),2000);}
      });
    });
  },

  toggleSettings(){const p=document.getElementById('settings-panel');if(p){p.classList.toggle('show');AudioManager.play('click');}},
  toggleSound(){const t=document.getElementById('sound-toggle'),en=t?.checked??true;AudioManager.toggle(en);UI.showToast(en?'🔊 音效已开启':'🔇 音效已关闭','info');},
  toggleEyeCare(){const t=document.getElementById('eye-care-toggle'),en=t?.checked??true;document.body.classList.toggle('eye-care-mode',en);UI.showToast(en?'👀 护眼模式已开启':'👁️ 护眼模式已关闭','info');},
  toggleBGM(){const t=document.getElementById('bgm-toggle'),en=t?.checked??false;UI.showToast(en?'🎵 背景音乐已开启':'🔇 背景音乐已关闭','info');},

  toggleFullscreen(){
    if(!document.fullscreenElement){
      document.documentElement.requestFullscreen().catch(err=>console.log(err));
      document.body.classList.add('fullscreen-mode');
    }else{
      document.exitFullscreen();
      document.body.classList.remove('fullscreen-mode');
    }
    AudioManager.play('click');
  },

  updateStarsDisplay(){const el=document.getElementById('total-stars');if(el)el.textContent=Storage.getStars();},

  startSessionTimer(){
    this.sessionTimerInterval=setInterval(()=>{
      const elapsed=Math.floor((Date.now()-this.sessionStartTime)/1000);
      Storage.addSessionTime(1);
      const el=document.getElementById('session-time-display');
      if(el)el.textContent=Utils.formatTime(elapsed);
    },1000);
  },

  setupEyeCare(){
    setInterval(()=>{
      if(this.eyeCareInterval<=0)return;
      const elapsed=(Date.now()-this.sessionStartTime)%this.eyeCareInterval;
      if(elapsed<this.eyeCareInterval&&elapsed>this.eyeCareInterval-1000){
        // 接近20分钟时提示
      }
    },30000);

    setTimeout(()=>{
      const modal=document.getElementById('eye-care-modal');
      if(modal){
        modal.style.display='flex';
        GameEngine.pause();
        
        let remaining=60;
        const timerEl=document.getElementById('eye-care-timer');
        const iv=setInterval(()=>{
          remaining--;
          if(timerEl)timerEl.textContent=remaining+'秒';
          if(remaining<=0){
            clearInterval(iv);
            modal.style.display='none';
            GameEngine.resume();
            UI.showToast('休息结束，继续学习吧！','info');
            this.sessionStartTime=Date.now();
          }
        },1000);
      }
    },this.eyeCareInterval);
  }
};

window.addEventListener('DOMContentLoaded', () => { App.init(); });
