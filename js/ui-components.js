const UI = {
  createButton(text, onClick, options = {}) {
    const {
      className = 'abacus-btn btn-confirm',
      type = 'button',
      icon = '',
      size = 'normal'
    } = options;

    const btn = document.createElement('button');
    btn.type = type;
    btn.className = className;
    btn.innerHTML = icon ? `${icon} ${text}` : text;
    
    if (onClick) {
      btn.addEventListener('click', (e) => {
        AudioManager.play('button');
        onClick(e);
      });
    }

    return btn;
  },

  createCard(title, content, options = {}) {
    const { icon = '', className = '', onClick = null } = options;

    const card = Utils.createElement('div', `module-card ${className}`);
    
    card.innerHTML = `
      <span class="module-icon">${icon}</span>
      <h3 class="module-title">${title}</h3>
      <p class="module-desc">${content}</p>
    `;

    if (onClick) {
      card.addEventListener('click', () => {
        AudioManager.play('click');
        onClick();
      });
    }

    return card;
  },

  createModal(options = {}) {
    const {
      title = '',
      message = '',
      icon = '📢',
      buttons = [],
      onClose = null,
      size = 'medium'
    } = options;

    const overlay = document.getElementById('modal-overlay');
    const body = document.getElementById('modal-body');

    let html = '';
    
    if (icon) {
      html += `<div style="font-size:60px;margin-bottom:15px;">${icon}</div>`;
    }
    
    if (title) {
      html += `<h2 style="font-size:26px;color:var(--text-primary);margin-bottom:12px;">${title}</h2>`;
    }
    
    if (message) {
      html += `<p style="font-size:18px;color:var(--text-secondary);line-height:1.7;">${message}</p>`;
    }

    if (buttons.length > 0) {
      html += '<div style="display:flex;gap:12px;justify-content:center;margin-top:25px;flex-wrap:wrap;">';
      buttons.forEach(btn => {
        const btnClass = btn.primary 
          ? 'result-btn btn-next-level' 
          : 'result-btn btn-home';
        html += `<button class="${btnClass}" data-action="${btn.action || ''}">${btn.text}</button>`;
      });
      html += '</div>';
    }

    body.innerHTML = html;

    buttons.forEach(btn => {
      const btnEl = body.querySelector(`[data-action="${btn.action}"]`);
      if (btnEl && btn.onClick) {
        btnEl.addEventListener('click', (e) => {
          e.stopPropagation();
          btn.onClick();
        });
      }
    });

    overlay.style.display = 'flex';

    const closeHandler = () => {
      overlay.style.display = 'none';
      if (onClose) onClose();
    };

    if (onClose) {
      overlay.onclick = closeHandler;
    }
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  showResult(resultData) {
    const {
      success = true,
      title = '太棒了！',
      message = '你完成得非常好！',
      starsEarned = 1,
      badge = null,
      onRetry = null,
      onNext = null,
      onHome = null
    } = resultData;

    let overlay = document.querySelector('.result-overlay');
    if (overlay) overlay.remove();

    overlay = Utils.createElement('div', 'result-overlay');
    overlay.innerHTML = `
      <div class="result-content">
        <div class="result-emoji">${success ? '🎉' : '💪'}</div>
        <h2 class="result-title">${title}</h2>
        <p class="result-message">${message}</p>
        <div class="stars-earned">
          ${Array(starsEarned).fill(0).map((_, i) => 
            `<span class="star-animate" style="display:inline-block;animation-delay:${i * 0.2}s">⭐</span>`
          ).join('')}
        </div>
        ${badge ? `<div class="badge-earned">🏅 ${badge}</div>` : ''}
        <div class="result-buttons">
          ${onHome ? '<button class="result-btn btn-home" id="result-home">🏠 首页</button>' : ''}
          ${onRetry ? '<button class="result-btn btn-retry" id="result-retry">🔄 再试一次</button>' : ''}
          ${onNext ? '<button class="result-btn btn-next-level" id="result-next">➡️ 下一关</button>' : ''}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    if (success) {
      AudioManager.play('celebration');
      Character.celebrateEffect();
    }

    const homeBtn = overlay.querySelector('#result-home');
    const retryBtn = overlay.querySelector('#result-retry');
    const nextBtn = overlay.querySelector('#result-next');

    if (homeBtn && onHome) homeBtn.addEventListener('click', () => { overlay.remove(); onHome(); });
    if (retryBtn && onRetry) retryBtn.addEventListener('click', () => { overlay.remove(); onRetry(); });
    if (nextBtn && onNext) nextBtn.addEventListener('click', () => { overlay.remove(); onNext(); });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });
  },

  showToast(message, type = 'info', duration = 2500) {
    const toast = Utils.createElement('div', `toast toast-${type}`);
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: 'fixed',
      top: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '14px 28px',
      borderRadius: '25px',
      fontSize: '17px',
      fontWeight: 'bold',
      zIndex: '800',
      animation: 'fadeInUp 0.3s ease-out, fadeOut 0.3s ease-in forwards',
      animationDelay: '0s, ' + (duration - 300) + 'ms',
      boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
      color: 'white',
      maxWidth: '80%'
    });

    const colors = {
      info: 'linear-gradient(135deg, #4ECDC4, #45b7aa)',
      success: 'linear-gradient(135deg, #95E1D3, #6BCFB8)',
      error: 'linear-gradient(135deg, #F38181, #E06C6C)',
      warning: 'linear-gradient(135deg, #FFB74D, #FF9800)'
    };
    
    toast.style.background = colors[type] || colors.info;

    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, duration);
  },

  createProgress(percent, options = {}) {
    const { 
      showLabel = true, 
      color = 'var(--btn-secondary)',
      height = 16,
      animated = true
    } = options;

    const container = Utils.createElement('div', 'progress-container');
    container.innerHTML = `
      <div class="progress-bar" style="height:${height}px;border-radius:${height/2}px;background:#e0e0e0;overflow:hidden;">
        <div class="progress-fill" style="
          width:${percent}%;
          height:100%;
          background:${color};
          border-radius:${height/2}px;
          transition:width ${animated ? '0.5s' : '0s'} ease;
          box-shadow:0 0 10px rgba(78,205,196,0.3);
        "></div>
      </div>
      ${showLabel ? `<span style="margin-left:10px;font-weight:bold;color:var(--text-primary);">${Math.round(percent)}%</span>` : ''}
    `;

    return container;
  },

  createStarsDisplay(count, maxCount = 3) {
    const container = Utils.createElement('div', 'stars-display-mini');
    
    for (let i = 0; i < maxCount; i++) {
      const star = Utils.createElement('span', 'mini-star', i < count ? '⭐' : '☆');
      star.style.fontSize = '24px';
      star.style.transition = 'all 0.3s ease';
      
      if (i < count) {
        star.style.animation = `starPop 0.5s ease-out backwards`;
        star.style.animationDelay = `${i * 0.15}s`;
      }
      
      container.appendChild(star);
    }

    return container;
  },

  createAnswerInput(options = {}) {
    const { placeholder = '输入答案...', maxValue = 999, onSubmit = null } = options;

    const wrapper = Utils.createElement('div', 'answer-input-group');
    
    const input = Utils.createElement('input', 'answer-input');
    input.type = 'number';
    input.placeholder = placeholder;
    input.min = 0;
    input.max = maxValue;
    input.pattern = '[0-9]*';

    const submitBtn = this.createButton('确定 ✓', onSubmit, {
      className: 'submit-answer-btn',
      icon: ''
    });

    wrapper.appendChild(input);
    wrapper.appendChild(submitBtn);

    if (onSubmit) {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          onSubmit(parseInt(input.value));
        }
      });
    }

    return { wrapper, input, submitBtn };
  },

  createAnswerOptions(options, onSelect, optionsPerRow = 2) {
    const grid = Utils.createElement('div', 'answer-options-grid');
    grid.style.gridTemplateColumns = `repeat(${optionsPerRow}, 1fr)`;

    options.forEach(opt => {
      const btn = Utils.createElement('button', 'answer-option-btn', opt.label || opt.toString());
      btn.dataset.value = opt.value !== undefined ? opt.value : opt;
      
      btn.addEventListener('click', () => {
        grid.querySelectorAll('.answer-option-btn').forEach(b => {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        
        setTimeout(() => {
          if (onSelect) onSelect(opt.value !== undefined ? opt.value : opt);
        }, 200);
      });

      grid.appendChild(btn);
    });

    return grid;
  },

  showCorrectAnimation(element) {
    element.classList.add('correct');
    AudioManager.play('correct');
    
    setTimeout(() => {
      element.classList.remove('correct');
    }, 600);
  },

  showWrongAnimation(element) {
    element.classList.add('wrong');
    AudioManager.play('wrong');

    setTimeout(() => {
      element.classList.remove('wrong');
    }, 500);
  },

  createHeartsDisplay(attempts, maxAttempts = 3) {
    const container = Utils.createElement('div', 'attempts-display');
    
    for (let i = 0; i < maxAttempts; i++) {
      const heart = Utils.createElement('span', 'attempt-heart' + (i >= attempts ? ' lost' : ''), '❤️');
      container.appendChild(heart);
    }

    return container;
  },

  createTimer(seconds, onComplete) {
    const container = Utils.createElement('div', 'timer-display');
    container.innerHTML = `
      <span class="timer-icon">⏱️</span>
      <span class="timer-value">${Utils.formatTime(seconds)}</span>
    `;

    let remaining = seconds;
    let intervalId;

    const update = () => {
      remaining--;
      const valueEl = container.querySelector('.timer-value');
      if (valueEl) valueEl.textContent = Utils.formatTime(Math.max(0, remaining));

      if (remaining <= 0) {
        clearInterval(intervalId);
        if (onComplete) onComplete();
      }
    };

    intervalId = setInterval(update, 1000);

    container.stop = () => clearInterval(intervalId);
    container.getTime = () => remaining;

    return container;
  },

  addLoadingState(element, text = '加载中...') {
    const originalText = element.textContent;
    element.disabled = true;
    element.textContent = text;
    element.style.opacity = '0.7';

    return () => {
      element.disabled = false;
      element.textContent = originalText;
      element.style.opacity = '1';
    };
  }
};

const Modal = {
  show(options = {}) {
    UI.createModal(options);
  },

  confirm(message, onConfirm, onCancel) {
    UI.createModal({
      icon: '❓',
      title: '确认操作',
      message: message,
      buttons: [
        { text: '取消', action: 'cancel', onClick: onCancel },
        { text: '确定', action: 'confirm', primary: true, onClick: onConfirm }
      ]
    });
  },

  alert(message, onClose) {
    UI.createModal({
      icon: 'ℹ️',
      title: '提示',
      message: message,
      buttons: [
        { text: '知道了', action: 'ok', primary: true, onClick: onClose }
      ]
    });
  },

  close() {
    UI.closeModal();
  }
};
