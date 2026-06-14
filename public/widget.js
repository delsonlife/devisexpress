// ============================================================
// SECTION 1 : RÉCUPÉRATION DE LA LICENCE
// ============================================================
(function() {
  let LICENSE_KEY = null;
  
  // Méthode 1 : depuis l'URL du script
  try {
    const scriptTag = document.currentScript;
    if (scriptTag && scriptTag.src) {
      const url = new URL(scriptTag.src);
      LICENSE_KEY = url.searchParams.get('license');
    }
  } catch(e) {}
  
  // Méthode 2 : chercher dans tous les scripts
  if (!LICENSE_KEY) {
    const scripts = document.querySelectorAll('script[src*="widget.js"]');
    for (const script of scripts) {
      if (script.src) {
        const match = script.src.match(/[?&]license=([^&]+)/);
        if (match) {
          LICENSE_KEY = match[1];
          break;
        }
      }
    }
  }
  
  // Méthode 3 : depuis l'URL de la page (fallback)
  if (!LICENSE_KEY) {
    const urlParams = new URLSearchParams(window.location.search);
    LICENSE_KEY = urlParams.get('license');
  }
  
  // Méthode 4 : valeur par défaut
  if (!LICENSE_KEY) {
    LICENSE_KEY = 'MOVING001';
    console.warn('[Widget] Licence par défaut utilisée');
  }
  
  console.log('[Widget] Licence :', LICENSE_KEY);

// ============================================================
// SECTION 2 : CONFIGURATION GLOBALE
// ============================================================
  const API_BASE = 'https://devisexpress-two.vercel.app';
  let currentQuestionIndex = 0;
  let answers = {};
  let config = null;
  let quoteResult = null;
  let distanceKm = 0;
  let addressCoords = {};
  let container = null;
  let questions = [];

// ============================================================
// SECTION 3 : INJECTION DU CSS PREMIUM
// ============================================================
  function injectCSS() {
    if (document.getElementById('rw-widget-styles')) return;
    
    const css = `
      :root {
        --rw-primary: #1e30d4;
        --rw-primary-dark: #1a28ab;
        --rw-secondary: #f59e0b;
        --rw-gray-100: #f3f4f6;
        --rw-gray-200: #e5e7eb;
        --rw-gray-400: #9ca3af;
        --rw-gray-600: #4b5563;
        --rw-gray-900: #111827;
        --rw-radius-lg: 1rem;
        --rw-radius-xl: 1.5rem;
        --rw-shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        --rw-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      }

      .rw-widget {
        font-family: 'Montserrat', system-ui, -apple-system, sans-serif;
        background: white;
        border-radius: var(--rw-radius-xl);
        box-shadow: var(--rw-shadow-lg);
        overflow: hidden;
        width: 100%;
        max-width: 1100px;
        margin: 0 auto;
      }

      .rw-progress-container {
        padding: 1.5rem 2rem 0.5rem;
        background: #f8fafc;
      }

      .rw-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--rw-gray-600);
        margin-bottom: 0.5rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .rw-progress-bar {
        height: 0.25rem;
        background: var(--rw-gray-200);
        border-radius: 9999px;
        overflow: hidden;
      }

      .rw-progress-fill {
        height: 100%;
        background: var(--rw-primary);
        border-radius: 9999px;
        transition: width 0.3s ease;
      }

      .rw-wizard-body {
        display: grid;
        grid-template-columns: 1fr 300px;
        min-height: 500px;
      }

      @media (max-width: 768px) {
        .rw-wizard-body {
          grid-template-columns: 1fr;
        }
      }

      .rw-steps-area {
        padding: 2rem;
      }

      .rw-step-panel {
        display: none;
        animation: rw-fadeIn 0.3s ease;
      }

      .rw-step-panel.active {
        display: block;
      }

      @keyframes rw-fadeIn {
        from { opacity: 0; transform: translateX(8px); }
        to { opacity: 1; transform: translateX(0); }
      }

      .rw-step-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--rw-gray-900);
        margin-bottom: 0.5rem;
      }

      .rw-step-desc {
        font-size: 0.875rem;
        color: var(--rw-gray-400);
        margin-bottom: 1.5rem;
      }

      .rw-addr-wrap {
        position: relative;
        margin-bottom: 1.5rem;
      }

      .rw-addr-input {
        width: 100%;
        border: 2px solid var(--rw-gray-200);
        border-radius: 0.875rem;
        padding: 1rem 1rem 1rem 3rem;
        font-size: 1rem;
        outline: none;
        transition: all 0.2s;
        background: #f8fafc;
      }

      .rw-addr-input:focus {
        border-color: var(--rw-primary);
        background: white;
        box-shadow: 0 0 0 3px rgba(30, 48, 212, 0.07);
      }

      .rw-addr-icon {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        font-size: 1.25rem;
      }

      .rw-addr-suggestions {
        position: absolute;
        top: calc(100% + 0.5rem);
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--rw-gray-200);
        border-radius: 0.75rem;
        box-shadow: var(--rw-shadow-lg);
        z-index: 200;
        display: none;
        max-height: 200px;
        overflow-y: auto;
      }

      .rw-addr-suggestions.open {
        display: block;
      }

      .rw-addr-sugg-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background 0.15s;
        border-bottom: 1px solid var(--rw-gray-100);
      }

      .rw-addr-sugg-item:hover {
        background: #f0f4ff;
      }

      .rw-dist-badge {
        display: none;
        align-items: center;
        gap: 0.5rem;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 0.625rem;
        padding: 0.625rem 0.875rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #15803d;
        margin-bottom: 1.25rem;
      }

      .rw-dist-badge.loading {
        background: #f0f4ff;
        border-color: #c3d0ff;
        color: var(--rw-primary);
      }

      .rw-item-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 0.625rem;
        margin-bottom: 1rem;
      }

      .rw-item-card {
        background: #f8fafc;
        border: 1.5px solid var(--rw-gray-200);
        border-radius: 0.875rem;
        padding: 0.75rem 0.5rem;
        text-align: center;
        transition: all 0.2s;
        cursor: pointer;
      }

      .rw-item-card.selected {
        border-color: var(--rw-primary);
        background: #f0f4ff;
      }

      .rw-item-emoji {
        font-size: 1.625rem;
        margin-bottom: 0.25rem;
      }

      .rw-item-name {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #334155;
        margin-bottom: 0.125rem;
      }

      .rw-item-vol {
        font-size: 0.625rem;
        color: var(--rw-gray-400);
        margin-bottom: 0.5rem;
      }

      .rw-item-qty {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.375rem;
      }

      .rw-qty-btn {
        width: 1.625rem;
        height: 1.625rem;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        font-size: 0.9375rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
      }

      .rw-qty-btn.plus {
        background: var(--rw-primary);
        color: white;
      }

      .rw-qty-btn.plus:hover {
        background: var(--rw-primary-dark);
      }

      .rw-qty-btn.minus {
        background: var(--rw-gray-200);
        color: #475569;
      }

      .rw-qty-btn.minus:hover {
        background: #cbd5e1;
      }

      .rw-qty-val {
        font-weight: 700;
        font-size: 0.9375rem;
        color: var(--rw-gray-900);
        min-width: 1.125rem;
        text-align: center;
      }

      .rw-truck-bar {
        background: #f1f5f9;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        margin-bottom: 1rem;
      }

      .rw-truck-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.8125rem;
        font-weight: 600;
        color: #475569;
        margin-bottom: 0.5rem;
      }

      .rw-truck-bg {
        background: var(--rw-gray-200);
        border-radius: 9999px;
        height: 0.625rem;
        overflow: hidden;
      }

      .rw-truck-fill {
        height: 100%;
        border-radius: 9999px;
        background: linear-gradient(90deg, var(--rw-primary), #4a63f5);
        transition: width 0.3s ease;
        width: 0%;
      }

      .rw-access-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .rw-access-card {
        border: 2px solid var(--rw-gray-200);
        border-radius: 0.875rem;
        padding: 1rem;
        cursor: pointer;
        transition: all 0.2s;
      }

      .rw-access-card.selected {
        border-color: var(--rw-primary);
        background: #f0f4ff;
      }

      .rw-access-card:hover:not(.selected) {
        border-color: #9db3ff;
      }

      .rw-access-emoji {
        font-size: 1.625rem;
        margin-bottom: 0.375rem;
      }

      .rw-access-name {
        font-weight: 700;
        font-size: 0.875rem;
        color: var(--rw-gray-900);
        margin-bottom: 0.125rem;
      }

      .rw-access-desc {
        font-size: 0.75rem;
        color: var(--rw-gray-400);
      }

      .rw-floor-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 0.875rem;
      }

      .rw-floor-card {
        background: #f8fafc;
        border: 1.5px solid var(--rw-gray-200);
        border-radius: 0.75rem;
        padding: 0.875rem;
      }

      .rw-floor-title {
        font-size: 0.6875rem;
        font-weight: 700;
        color: #64748b;
        margin-bottom: 0.625rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .rw-floor-counter {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        margin-bottom: 0.5rem;
      }

      .rw-floor-val {
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--rw-gray-900);
        min-width: 1.75rem;
        text-align: center;
      }

      .rw-asc-row {
        display: flex;
        gap: 0.5rem;
      }

      .rw-toggle-pill {
        border: 1.5px solid var(--rw-gray-200);
        border-radius: 9999px;
        padding: 0.3125rem 0.875rem;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        background: white;
        color: #64748b;
        transition: all 0.15s;
      }

      .rw-toggle-pill.on {
        background: var(--rw-primary);
        border-color: var(--rw-primary);
        color: white;
      }

      .rw-urgent-box {
        border: 1.5px solid #fcd34d;
        background: #fffbeb;
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
        transition: all 0.2s;
      }

      .rw-urgent-box.selected {
        background: #fef3c7;
        border-color: #f59e0b;
      }

      .rw-urgent-text {
        font-size: 0.875rem;
        font-weight: 700;
        color: #92400e;
      }

      .rw-urgent-sub {
        font-size: 0.75rem;
        color: #b45309;
      }

      .rw-movers-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.625rem;
        margin-bottom: 1rem;
      }

      .rw-mover-card {
        border: 2px solid var(--rw-gray-200);
        border-radius: 0.75rem;
        padding: 0.75rem 0.5rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s;
      }

      .rw-mover-card.selected {
        border-color: var(--rw-primary);
        background: #f0f4ff;
      }

      .rw-mover-emoji {
        font-size: 1.5rem;
        margin-bottom: 0.25rem;
      }

      .rw-mover-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--rw-gray-900);
      }

      .rw-mover-sub {
        font-size: 0.6875rem;
        color: var(--rw-gray-400);
        margin-top: 0.125rem;
      }

      .rw-form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
      }

      @media (max-width: 500px) {
        .rw-form-grid {
          grid-template-columns: 1fr;
        }
      }

      .rw-form-row {
        margin-bottom: 0.875rem;
      }

      .rw-form-label {
        font-size: 0.6875rem;
        font-weight: 700;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        display: block;
        margin-bottom: 0.3125rem;
      }

      .rw-form-input {
        width: 100%;
        border: 2px solid var(--rw-gray-200);
        border-radius: 0.75rem;
        padding: 0.8125rem 0.9375rem;
        font-size: 0.875rem;
        outline: none;
        transition: all 0.2s;
        background: #f8fafc;
      }

      .rw-form-input:focus {
        border-color: var(--rw-primary);
        background: white;
        box-shadow: 0 0 0 3px rgba(30, 48, 212, 0.07);
      }

      .rw-recap {
        background: #f8fafc;
        border: 1px solid var(--rw-gray-200);
        border-radius: 0.75rem;
        padding: 0.75rem 0.875rem;
        margin-bottom: 1rem;
      }

      .rw-recap-title {
        font-size: 0.625rem;
        font-weight: 700;
        color: var(--rw-gray-400);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.375rem;
      }

      .rw-recap-pills {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      .rw-recap-pill {
        background: #dde6ff;
        color: var(--rw-primary);
        font-size: 0.6875rem;
        font-weight: 600;
        border-radius: 9999px;
        padding: 0.1875rem 0.625rem;
      }

      .rw-step-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.75rem;
      }

      .rw-btn-back {
        background: none;
        border: none;
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--rw-gray-400);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.5rem 0;
        transition: all 0.15s;
      }

      .rw-btn-back:hover {
        color: var(--rw-primary);
      }

      .rw-btn-next {
        background: linear-gradient(135deg, var(--rw-primary), #2e44ea);
        color: white;
        border: none;
        border-radius: 0.625rem;
        padding: 0.8125rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .rw-btn-next:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(30, 48, 212, 0.3);
      }

      .rw-btn-submit {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
        color: #111750;
        border: none;
        border-radius: 0.625rem;
        padding: 0.8125rem 1.5rem;
        font-size: 0.875rem;
        font-weight: 800;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s;
      }

      .rw-btn-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
      }

      .rw-price-panel {
        background: #111750;
        padding: 1.75rem 1.5rem;
        display: flex;
        flex-direction: column;
      }

      @media (max-width: 768px) {
        .rw-price-panel {
          border-top: 2px solid var(--rw-gray-200);
          padding: 1.25rem;
        }
      }

      .rw-price-label {
        font-size: 0.625rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.375rem;
      }

      .rw-price-amount {
        font-size: 3.25rem;
        font-weight: 800;
        color: white;
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      .rw-price-sub {
        font-size: 0.6875rem;
        color: rgba(255, 255, 255, 0.35);
        margin-bottom: 1.25rem;
      }

      .rw-price-rows {
        flex: 1;
      }

      .rw-price-row {
        display: flex;
        justify-content: space-between;
        padding: 0.4375rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        font-size: 0.75rem;
        color: rgba(255, 255, 255, 0.55);
      }

      .rw-price-row span:last-child {
        color: white;
        font-weight: 700;
      }

      .rw-success-state {
        display: none;
        text-align: center;
        padding: 2.5rem 1.75rem;
      }

      .rw-success-state.show {
        display: block;
      }

      .rw-success-icon {
        font-size: 3.75rem;
        margin-bottom: 0.875rem;
      }

      .rw-success-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--rw-gray-900);
        margin-bottom: 0.5rem;
      }

      .rw-success-sub {
        color: #64748b;
        font-size: 0.9375rem;
        margin-bottom: 1.25rem;
      }

      .rw-success-price-box {
        background: #f0f4ff;
        border: 2px solid #c3d0ff;
        border-radius: 0.875rem;
        padding: 0.875rem 1.25rem;
        display: inline-block;
        font-size: 1.375rem;
        font-weight: 800;
        color: var(--rw-gray-900);
        margin-bottom: 1.5rem;
      }

      .rw-loading {
        text-align: center;
        padding: 2rem;
        color: var(--rw-gray-600);
      }

      .rw-error {
        text-align: center;
        padding: 2rem;
        background: #fef2f2;
        color: #dc2626;
        border-radius: var(--rw-radius-lg);
      }

      @media (max-width: 640px) {
        .rw-steps-area { padding: 1.25rem; }
        .rw-step-title { font-size: 1.375rem; }
        .rw-price-amount { font-size: 2.5rem; }
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'rw-widget-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

// ============================================================
// SECTION 4 : FONCTIONS DE BASE
// ============================================================
  async function init() {
    injectCSS();
    const isValid = await loadConfig();
    if (!isValid) {
      showError('Licence invalide ou domaine non autorisé');
      return;
    }
    setupWidget();
  }

  async function loadConfig() {
    try {
      const response = await fetch(`${API_BASE}/api/license?license=${LICENSE_KEY}`, {
        headers: { 'Origin': window.location.origin }
      });
      
      if (!response.ok) {
        throw new Error('License invalid');
      }
      
      config = await response.json();
      
      if (config.branding?.primaryColor) {
        document.documentElement.style.setProperty('--rw-primary', config.branding.primaryColor);
      }
      
      questions = config.questions || [];
      return true;
    } catch (error) {
      console.error('Erreur chargement config:', error);
      return false;
    }
  }

  function showError(message) {
    container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      const target = document.getElementById('roof-widget-container') || document.body;
      target.appendChild(container);
    }
    container.innerHTML = `<div class="rw-error">${message}</div>`;
  }

  function setupWidget() {
    container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      container.className = 'rw-widget';
      const target = document.getElementById('roof-widget-container') || document.body;
      target.appendChild(container);
    }
    
    answers = {};
    currentQuestionIndex = 0;
    
    render();
  }

// ============================================================
// SECTION 5 : RENDU PRINCIPAL + RENDERQUESTION + RENDERFINALFORM
// ============================================================
  function render() {
    if (currentQuestionIndex < questions.length) {
      renderQuestion(container, questions[currentQuestionIndex], currentQuestionIndex, questions.length);
    } else {
      renderFinalForm();
    }
  }

  function renderQuestion(container, question, index, total) {
    const progress = ((index + 1) / total) * 100;
    const isLastQuestion = (index + 1 === total);
    
    let html = `
      <div class="rw-progress-container">
        <div class="rw-progress-label">
          <span>Étape ${index + 1} sur ${total}</span>
          <span>${Math.round(progress)}%</span>
        </div>
        <div class="rw-progress-bar">
          <div class="rw-progress-fill" style="width: ${progress}%;"></div>
        </div>
      </div>
      <div class="rw-wizard-body">
        <div class="rw-steps-area">
          <div class="rw-step-panel active">
            <div class="rw-step-title">${question.label}</div>
            <div class="rw-step-desc">${question.placeholder || ''}</div>
    `;
    
    switch(question.type) {
      case 'address':
        html += `
          <div class="rw-addr-wrap">
            <span class="rw-addr-icon">📍</span>
            <input type="text" id="addr-input-${question.id}" class="rw-addr-input" 
                   placeholder="${question.placeholder}" autocomplete="off">
            <div class="rw-addr-suggestions" id="suggest-${question.id}"></div>
          </div>
          ${question.id === 'arrivalAddress' ? '<div class="rw-dist-badge" id="dist-badge" style="display:none"><span id="dist-icon">📏</span><span id="dist-text"></span></div>' : ''}
        `;
        break;
        
      case 'multiselect':
        html += `
          <div class="rw-item-grid" id="item-grid"></div>
          <div class="rw-truck-bar">
            <div class="rw-truck-label"><span>🚚 Remplissage camion 12m³</span><span id="truck-pct">0%</span></div>
            <div class="rw-truck-bg"><div class="rw-truck-fill" id="truck-fill"></div></div>
          </div>
        `;
        break;
        
            case 'select':
        if (question.id === 'accessType') {
          html += `
            <div class="rw-access-grid" id="access-grid">
              <div class="rw-access-card" data-value="Trottoir à trottoir">
                <div class="rw-access-emoji">🚶</div>
                <div class="rw-access-name">Trottoir à trottoir</div>
                <div class="rw-access-desc">Chargement et déchargement au pied de l'immeuble</div>
              </div>
              <div class="rw-access-card" data-value="Montée en étage">
                <div class="rw-access-emoji">🏢</div>
                <div class="rw-access-name">Montée en étage</div>
                <div class="rw-access-desc">Transport jusqu'à l'appartement</div>
              </div>
            </div>
            <div id="floor-section" style="display:none">
              <div class="rw-floor-grid">
                <div class="rw-floor-card">
                  <div class="rw-floor-title">Départ — Étage</div>
                  <div class="rw-floor-counter">
                    <button class="rw-qty-btn minus" data-side="depart" data-delta="-1">−</button>
                    <span class="rw-floor-val" id="floor-depart-val">0</span>
                    <button class="rw-qty-btn plus" data-side="depart" data-delta="1">+</button>
                  </div>
                  <div class="rw-asc-row">
                    <button class="rw-toggle-pill on" data-side="depart" data-asc="true">Ascenseur Oui</button>
                    <button class="rw-toggle-pill" data-side="depart" data-asc="false">Ascenseur Non</button>
                  </div>
                </div>
                <div class="rw-floor-card">
                  <div class="rw-floor-title">Arrivée — Étage</div>
                  <div class="rw-floor-counter">
                    <button class="rw-qty-btn minus" data-side="arrival" data-delta="-1">−</button>
                    <span class="rw-floor-val" id="floor-arrival-val">0</span>
                    <button class="rw-qty-btn plus" data-side="arrival" data-delta="1">+</button>
                  </div>
                  <div class="rw-asc-row">
                    <button class="rw-toggle-pill on" data-side="arrival" data-asc="true">Ascenseur Oui</button>
                    <button class="rw-toggle-pill" data-side="arrival" data-asc="false">Ascenseur Non</button>
                  </div>
                </div>
              </div>
            </div>
          `;
        } else if (question.id === 'movers') {
          html += `
            <div class="rw-movers-grid" id="movers-grid">
              <div class="rw-mover-card" data-value="1 déménageur">
                <div class="rw-mover-emoji">🧍</div>
                <div class="rw-mover-label">1 déménageur</div>
                <div class="rw-mover-sub">Studio</div>
              </div>
              <div class="rw-mover-card" data-value="2 déménageurs">
                <div class="rw-mover-emoji">👥</div>
                <div class="rw-mover-label">2 déménageurs</div>
                <div class="rw-mover-sub">Recommandé</div>
              </div>
              <div class="rw-mover-card" data-value="3 déménageurs">
                <div class="rw-mover-emoji">👨‍👨‍👦</div>
                <div class="rw-mover-label">3 déménageurs</div>
                <div class="rw-mover-sub">Grande maison</div>
              </div>
            </div>
          `;
        } else if (question.id === 'time') {
          html += `<select id="input-${question.id}" class="rw-form-input">`;
          question.options.forEach(opt => {
            html += `<option value="${opt}">${opt}</option>`;
          });
          html += `</select>`;
        }
        break;
        
      case 'checkbox':
        if (question.id === 'urgent') {
          html += `
            <div class="rw-urgent-box" id="urgent-box">
              <input type="checkbox" id="urgent-chk" style="width:1rem;height:1rem;accent-color:#f59e0b">
              <span style="font-size:1.125rem">⚡</span>
              <div>
                <div class="rw-urgent-text">Transport urgent (+20%)</div>
                <div class="rw-urgent-sub">Livraison dans les prochaines heures</div>
              </div>
            </div>
          `;
        }
        break;
        
      case 'date':
        const today = new Date().toISOString().split('T')[0];
        html += `<input type="date" id="input-${question.id}" class="rw-form-input" value="${today}">`;
        break;
        
      case 'text':
      case 'tel':
        html += `<input type="${question.type}" id="input-${question.id}" class="rw-form-input" placeholder="">`;
        break;
    }
    
    const buttonText = isLastQuestion ? 'Obtenir mon devis' : 'Suivant';
    const buttonClass = isLastQuestion ? 'rw-btn-submit' : 'rw-btn-next';
    
    html += `
            <div class="rw-step-nav">
              <button class="rw-btn-back" id="rw-prev" ${index === 0 ? 'disabled style="opacity:0.5"' : ''}>← Retour</button>
              <button class="${buttonClass}" id="rw-next">${buttonText} →</button>
            </div>
          </div>
        </div>
        
        <div class="rw-price-panel">
          <div class="rw-price-label">Prix estimé</div>
          <div class="rw-price-amount"><span id="price-total">38</span>€</div>
          <div class="rw-price-sub">TTC · Prix fixe, sans surprise</div>
          <div class="rw-price-rows">
            <div class="rw-price-row"><span>Base</span><span>38€</span></div>
            <div class="rw-price-row" id="price-row-dist"><span>Distance</span><span id="price-dist">0€</span></div>
            <div class="rw-price-row" id="price-row-items"><span>Objets</span><span id="price-items">0€</span></div>
            <div class="rw-price-row" id="price-row-floor" style="display:none"><span>Étages</span><span id="price-floor">0€</span></div>
            <div class="rw-price-row" id="price-row-movers" style="display:none"><span>Déménageurs</span><span id="price-movers">0€</span></div>
            <div class="rw-price-row" id="price-row-urgent" style="display:none"><span>Urgent +20%</span><span id="price-urgent">0€</span></div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    attachEvents(question);
    
    document.getElementById('rw-prev')?.addEventListener('click', prevStep);
    document.getElementById('rw-next')?.addEventListener('click', () => {
      if (isLastQuestion) {
        submitForm();
      } else {
        nextStep();
      }
    });
  }

  function renderFinalForm() {
    const html = `
      <div class="rw-progress-container">
        <div class="rw-progress-label">
          <span>Dernière étape</span>
          <span>100%</span>
        </div>
        <div class="rw-progress-bar">
          <div class="rw-progress-fill" style="width: 100%;"></div>
        </div>
      </div>
      <div class="rw-wizard-body">
        <div class="rw-steps-area">
          <div class="rw-step-panel active">
            <div class="rw-step-title">Date et coordonnées</div>
            <div class="rw-step-desc">Planifiez votre déménagement et recevez votre devis.</div>
            
            <div class="rw-recap" id="recap-box">
              <div class="rw-recap-title">Récapitulatif</div>
              <div class="rw-recap-pills" id="recap-pills"></div>
            </div>
            
            <div class="rw-form-grid">
              <div class="rw-form-row">
                <label class="rw-form-label">📅 Date souhaitée</label>
                <input id="input-date" type="date" class="rw-form-input">
              </div>
              <div class="rw-form-row">
                <label class="rw-form-label">🕐 Heure</label>
                <select id="input-time" class="rw-form-input">
                  <option>08:00</option><option>09:00</option><option>10:00</option>
                  <option>11:00</option><option>14:00</option><option>15:00</option><option>16:00</option>
                </select>
              </div>
            </div>
            
            <div class="rw-form-row">
              <label class="rw-form-label">👤 Votre nom</label>
              <input id="input-fullName" type="text" class="rw-form-input" placeholder="Jean Dupont">
            </div>
            <div class="rw-form-row">
              <label class="rw-form-label">📱 Téléphone</label>
              <input id="input-phone" type="tel" class="rw-form-input" placeholder="">
            </div>
            
            <div class="rw-step-nav">
              <button class="rw-btn-back" id="rw-prev-final">← Retour</button>
              <button class="rw-btn-submit" id="rw-submit-final">Envoyer ma demande →</button>
            </div>
          </div>
        </div>
        
        <div class="rw-price-panel">
          <div class="rw-price-label">Prix estimé</div>
          <div class="rw-price-amount"><span id="price-total-final">38</span>€</div>
          <div class="rw-price-sub">TTC · Prix fixe, sans surprise</div>
          <div class="rw-price-rows">
            <div class="rw-price-row"><span>Base</span><span>38€</span></div>
            <div class="rw-price-row" id="price-row-dist-final"><span>Distance</span><span id="price-dist-final">0€</span></div>
            <div class="rw-price-row" id="price-row-items-final"><span>Objets</span><span id="price-items-final">0€</span></div>
            <div class="rw-price-row" id="price-row-floor-final" style="display:none"><span>Étages</span><span id="price-floor-final">0€</span></div>
            <div class="rw-price-row" id="price-row-movers-final" style="display:none"><span>Déménageurs</span><span id="price-movers-final">0€</span></div>
            <div class="rw-price-row" id="price-row-urgent-final" style="display:none"><span>Urgent +20%</span><span id="price-urgent-final">0€</span></div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    const today = new Date();
    today.setDate(today.getDate() + 7);
    const dateInput = document.getElementById('input-date');
    if (dateInput) dateInput.value = today.toISOString().split('T')[0];
    
    updateRecapAndPrice();
    
    document.getElementById('rw-prev-final')?.addEventListener('click', () => {
      currentQuestionIndex = questions.length - 1;
      render();
    });
    
    document.getElementById('rw-submit-final')?.addEventListener('click', () => {
      const name = document.getElementById('input-fullName')?.value;
      const phone = document.getElementById('input-phone')?.value;
      const date = document.getElementById('input-date')?.value;
      const time = document.getElementById('input-time')?.value;
      
      if (!name || !phone) {
        alert('Veuillez renseigner votre nom et téléphone');
        return;
      }
      
      answers.fullName = name;
      answers.phone = phone;
      answers.date = date;
      answers.time = time;
      answers.distanceKm = distanceKm;
      answers.items = Object.keys(itemQuantities).filter(id => itemQuantities[id] > 0);
      answers.itemQuantities = { ...itemQuantities };
      
      calculateQuote();
    });
  }

  function updateRecapAndPrice() {
    const recapPills = document.getElementById('recap-pills');
    if (recapPills) {
      const pills = [];
      if (answers.departureAddress) pills.push(`📍 ${answers.departureAddress.split(',')[0]}`);
      if (answers.arrivalAddress) pills.push(`🏠 ${answers.arrivalAddress.split(',')[0]}`);
      if (distanceKm) pills.push(`📏 ${distanceKm} km`);
      const itemCount = Object.values(itemQuantities).reduce((s, q) => s + q, 0);
      if (itemCount > 0) pills.push(`📦 ${itemCount} objet(s)`);
      recapPills.innerHTML = pills.map(p => `<span class="rw-recap-pill">${p}</span>`).join('');
    }
    updatePriceFinal();
  }

  function updatePriceFinal() {
    let total = 38;
    
    const distPrice = distanceKm;
    total += distPrice;
    const priceDist = document.getElementById('price-dist-final');
    if (priceDist) priceDist.textContent = `${distPrice}€`;
    
    let itemsPrice = 0;
    for (const item of itemsList) {
      itemsPrice += (itemQuantities[item.id] || 0) * item.price;
    }
    total += itemsPrice;
    const priceItems = document.getElementById('price-items-final');
    if (priceItems) priceItems.textContent = `${itemsPrice}€`;
    
    let floorPrice = 0;
    if (answers.accessType === 'Montée en étage') {
      if (!answers.elevatorDepart && answers.floorDepart > 0) {
        floorPrice += answers.floorDepart * 8;
      }
      if (!answers.elevatorArrival && answers.floorArrival > 0) {
        floorPrice += answers.floorArrival * 8;
      }
    }
    total += floorPrice;
    const rowFloor = document.getElementById('price-row-floor-final');
    const priceFloor = document.getElementById('price-floor-final');
    if (floorPrice > 0) {
      rowFloor.style.display = '';
      priceFloor.textContent = `${floorPrice}€`;
    } else {
      rowFloor.style.display = 'none';
    }
    
    let moversPrice = 0;
    if (answers.movers === '2 déménageurs') moversPrice = 20;
    if (answers.movers === '3 déménageurs') moversPrice = 40;
    total += moversPrice;
    const rowMovers = document.getElementById('price-row-movers-final');
    const priceMovers = document.getElementById('price-movers-final');
    if (moversPrice > 0) {
      rowMovers.style.display = '';
      priceMovers.textContent = `${moversPrice}€`;
    } else {
      rowMovers.style.display = 'none';
    }
    
    let urgentPrice = 0;
    if (answers.urgent) {
      urgentPrice = Math.round(total * 0.2);
      total = total * 1.2;
    }
    const rowUrgent = document.getElementById('price-row-urgent-final');
    const priceUrgent = document.getElementById('price-urgent-final');
    if (urgentPrice > 0) {
      rowUrgent.style.display = '';
      priceUrgent.textContent = `${urgentPrice}€`;
    } else {
      rowUrgent.style.display = 'none';
    }
    
    const totalEl = document.getElementById('price-total-final');
    if (totalEl) totalEl.textContent = Math.round(total);
  }

// ============================================================
// SECTION 6 : ÉVÉNEMENTS PAR TYPE DE QUESTION
// ============================================================
  let addressTimers = {};
  let suggestionsData = {};

  function attachEvents(question) {
          if (question.type === 'address') {
      const input = document.getElementById(`addr-input-${question.id}`);
      const suggestBox = document.getElementById(`suggest-${question.id}`);
      
      // Restaurer la valeur sauvegardée
      if (answers[question.id]) {
        input.value = answers[question.id];
      }
      
      input.addEventListener('input', () => {
        const query = input.value.trim();
        if (query.length < 3) {
          suggestBox.classList.remove('open');
          return;
        }
        
        clearTimeout(addressTimers[question.id]);
        addressTimers[question.id] = setTimeout(() => {
          fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`)
            .then(r => r.json())
            .then(data => {
              if (!data.features?.length) {
                suggestBox.classList.remove('open');
                return;
              }
              
              suggestionsData[question.id] = data.features.map(f => ({
                label: f.properties.label,
                context: f.properties.context,
                lat: f.geometry.coordinates[1],
                lon: f.geometry.coordinates[0]
              }));
              
              suggestBox.innerHTML = suggestionsData[question.id].map((item, idx) => `
                <div class="rw-addr-sugg-item" data-idx="${idx}">
                  <span>📍</span>
                  <div>
                    <div style="font-weight:600">${item.label}</div>
                    <div style="font-size:0.75rem;color:#94a3b8">${item.context}</div>
                  </div>
                </div>
              `).join('');
              
              suggestBox.classList.add('open');
              
              document.querySelectorAll(`#suggest-${question.id} .rw-addr-sugg-item`).forEach(el => {
                el.addEventListener('click', () => {
                  const idx = parseInt(el.dataset.idx);
                  const selected = suggestionsData[question.id][idx];
                  input.value = selected.label;
                  suggestBox.classList.remove('open');
                  
                  addressCoords[question.id] = { lat: selected.lat, lon: selected.lon };
                  answers[question.id] = selected.label;
                  
                  if (addressCoords.departureAddress && addressCoords.arrivalAddress) {
                    calculateDistance();
                  }
                  // Mettre à jour le prix immédiatement
                  updatePrice();
                });
              });
            });
        }, 300);
      });
      
      document.addEventListener('click', (e) => {
        if (suggestBox && !suggestBox.contains(e.target) && e.target !== input) {
          suggestBox.classList.remove('open');
        }
      });
    }
    
    if (question.type === 'multiselect') {
      renderItemsGrid();
    }
    
    if (question.id === 'accessType') {
      if (!answers.accessType) {
        answers.accessType = 'Trottoir à trottoir';
      }
      if (answers.floorDepart === undefined) answers.floorDepart = 0;
      if (answers.floorArrival === undefined) answers.floorArrival = 0;
      if (answers.elevatorDepart === undefined) answers.elevatorDepart = true;
      if (answers.elevatorArrival === undefined) answers.elevatorArrival = true;
      
      document.querySelectorAll('.rw-access-card').forEach(card => {
        const cardValue = card.dataset.value;
        if (cardValue === answers.accessType) {
          card.classList.add('selected');
        }
        
        card.addEventListener('click', () => {
          const value = card.dataset.value;
          answers.accessType = value;
          document.querySelectorAll('.rw-access-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          
          const floorSection = document.getElementById('floor-section');
          if (value === 'Montée en étage') {
            floorSection.style.display = 'block';
            document.getElementById('floor-depart-val').textContent = answers.floorDepart;
            document.getElementById('floor-arrival-val').textContent = answers.floorArrival;
            
            const departAscOui = document.querySelector('#floor-section .rw-floor-card:first-child .rw-toggle-pill[data-asc="true"]');
            const departAscNon = document.querySelector('#floor-section .rw-floor-card:first-child .rw-toggle-pill[data-asc="false"]');
            const arrivalAscOui = document.querySelector('#floor-section .rw-floor-card:last-child .rw-toggle-pill[data-asc="true"]');
            const arrivalAscNon = document.querySelector('#floor-section .rw-floor-card:last-child .rw-toggle-pill[data-asc="false"]');
            
            if (answers.elevatorDepart) {
              departAscOui.classList.add('on');
              departAscNon.classList.remove('on');
            } else {
              departAscOui.classList.remove('on');
              departAscNon.classList.add('on');
            }
            if (answers.elevatorArrival) {
              arrivalAscOui.classList.add('on');
              arrivalAscNon.classList.remove('on');
            } else {
              arrivalAscOui.classList.remove('on');
              arrivalAscNon.classList.add('on');
            }
          } else {
            floorSection.style.display = 'none';
          }
          updatePrice();
        });
      });
      
      const floorSectionEl = document.getElementById('floor-section');
      if (floorSectionEl && answers.accessType === 'Montée en étage') {
        floorSectionEl.style.display = 'block';
      }
      
      document.querySelectorAll('.rw-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const side = btn.dataset.side;
          const delta = parseInt(btn.dataset.delta);
          if (side === 'depart') {
            const newVal = Math.max(0, answers.floorDepart + delta);
            answers.floorDepart = newVal;
            document.getElementById('floor-depart-val').textContent = newVal;
          } else {
            const newVal = Math.max(0, answers.floorArrival + delta);
            answers.floorArrival = newVal;
            document.getElementById('floor-arrival-val').textContent = newVal;
          }
          updatePrice();
        });
      });
      
      document.querySelectorAll('.rw-toggle-pill').forEach(pill => {
        const side = pill.dataset.side;
        const asc = pill.dataset.asc === 'true';
        
        if (side === 'depart' && answers.elevatorDepart === asc) {
          pill.classList.add('on');
        }
        if (side === 'arrival' && answers.elevatorArrival === asc) {
          pill.classList.add('on');
        }
        
        pill.addEventListener('click', () => {
          const sidePill = pill.dataset.side;
          const ascValue = pill.dataset.asc === 'true';
          if (sidePill === 'depart') {
            answers.elevatorDepart = ascValue;
            const container = pill.parentElement;
            container.querySelectorAll('.rw-toggle-pill').forEach(p => p.classList.remove('on'));
            pill.classList.add('on');
          } else {
            answers.elevatorArrival = ascValue;
            const container = pill.parentElement;
            container.querySelectorAll('.rw-toggle-pill').forEach(p => p.classList.remove('on'));
            pill.classList.add('on');
          }
          updatePrice();
        });
      });
    }
    
    if (question.id === 'movers') {
      if (!answers.movers) {
        answers.movers = '1 déménageur';
      }
      
      document.querySelectorAll('.rw-mover-card').forEach(card => {
        const cardValue = card.dataset.value;
        if (cardValue === answers.movers) {
          card.classList.add('selected');
        }
        
        card.addEventListener('click', () => {
          const value = card.dataset.value;
          answers.movers = value;
          document.querySelectorAll('.rw-mover-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          updatePrice();
        });
      });
    }
    
    if (question.id === 'urgent') {
      const urgentBox = document.getElementById('urgent-box');
      const urgentChk = document.getElementById('urgent-chk');
      if (answers.urgent) {
        urgentChk.checked = true;
        urgentBox.classList.add('selected');
      }
      urgentBox.addEventListener('click', () => {
        urgentChk.checked = !urgentChk.checked;
        urgentBox.classList.toggle('selected', urgentChk.checked);
        answers.urgent = urgentChk.checked;
        updatePrice();
      });
    }
    
    if (question.type === 'select' && question.id !== 'accessType' && question.id !== 'movers') {
      const select = document.getElementById(`input-${question.id}`);
      select.addEventListener('change', () => {
        answers[question.id] = select.value;
      });
    }
    
    if (question.type === 'text' || question.type === 'tel') {
      const input = document.getElementById(`input-${question.id}`);
      input.addEventListener('input', () => {
        answers[question.id] = input.value;
      });
    }
    
    if (question.type === 'date') {
      const dateInput = document.getElementById(`input-${question.id}`);
      dateInput.addEventListener('change', () => {
        answers[question.id] = dateInput.value;
      });
    }
  }

// ============================================================
// SECTION 7 : OBJETS (MULTISELECT)
// ============================================================
  const itemsList = [
    { id: 'canape', label: 'Canapé', emoji: '🛋️', vol: 3.0, price: 4 },
    { id: 'lit', label: 'Lit double', emoji: '🛏️', vol: 2.0, price: 3 },
    { id: 'armoire', label: 'Armoire', emoji: '🗄️', vol: 2.5, price: 3 },
    { id: 'table', label: 'Table', emoji: '🪑', vol: 1.0, price: 2 },
    { id: 'frigo', label: 'Réfrigérateur', emoji: '🧊', vol: 0.8, price: 2 },
    { id: 'machine', label: 'Lave-linge', emoji: '🫧', vol: 0.6, price: 2 },
    { id: 'bureau', label: 'Bureau', emoji: '🖥️', vol: 1.2, price: 2 },
    { id: 'carton', label: 'Carton', emoji: '📦', vol: 0.1, price: 0.5 }
  ];
  
  let itemQuantities = {};
  
  function getSelectedItemsCount() {
    return Object.values(itemQuantities).reduce((sum, qty) => sum + qty, 0);
  }
  
  function renderItemsGrid() {
    const grid = document.getElementById('item-grid');
    if (!grid) return;
    
    grid.innerHTML = itemsList.map(item => `
      <div class="rw-item-card" data-id="${item.id}">
        <div class="rw-item-emoji">${item.emoji}</div>
        <div class="rw-item-name">${item.label}</div>
        <div class="rw-item-vol">${item.vol}m³</div>
        <div class="rw-item-qty">
          <button class="rw-qty-btn minus" data-id="${item.id}" data-delta="-1">−</button>
          <span class="rw-qty-val" id="qty-${item.id}">${itemQuantities[item.id] || 0}</span>
          <button class="rw-qty-btn plus" data-id="${item.id}" data-delta="1">+</button>
        </div>
      </div>
    `).join('');
    
    grid.querySelectorAll('.rw-qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const delta = parseInt(btn.dataset.delta);
        const current = itemQuantities[id] || 0;
        const newVal = Math.max(0, current + delta);
        itemQuantities[id] = newVal;
        const qtyEl = document.getElementById(`qty-${id}`);
        if (qtyEl) qtyEl.textContent = newVal;
        
        const card = btn.closest('.rw-item-card');
        if (newVal > 0) {
          card.classList.add('selected');
        } else {
          card.classList.remove('selected');
        }
        
        updateTruckFill();
        updatePrice();
      });
    });
    
    grid.querySelectorAll('.rw-item-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('rw-qty-btn')) return;
        const id = card.dataset.id;
        const current = itemQuantities[id] || 0;
        const newVal = current + 1;
        itemQuantities[id] = newVal;
        const qtyEl = document.getElementById(`qty-${id}`);
        if (qtyEl) qtyEl.textContent = newVal;
        card.classList.add('selected');
        updateTruckFill();
        updatePrice();
      });
    });
  }
  
  function updateTruckFill() {
    let totalVol = 0;
    for (const item of itemsList) {
      totalVol += (itemQuantities[item.id] || 0) * item.vol;
    }
    const pct = Math.min(Math.round(totalVol / 12 * 100), 100);
    const pctEl = document.getElementById('truck-pct');
    const fillEl = document.getElementById('truck-fill');
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (fillEl) fillEl.style.width = `${pct}%`;
  }

   // ============================================================
// SECTION 8 : DISTANCE (via proxy Vercel)
// ============================================================
  async function calculateDistance() {
    const dep = addressCoords.departureAddress;
    const arr = addressCoords.arrivalAddress;
    if (!dep || !arr) return;
    
    const badge = document.getElementById('dist-badge');
    if (!badge) return;
    
    const distIcon = document.getElementById('dist-icon');
    const distText = document.getElementById('dist-text');
    
    badge.style.display = 'flex';
    badge.className = 'rw-dist-badge loading';
    distIcon.textContent = '⏳';
    distText.textContent = 'Calcul de la distance routière…';
    
    try {
      const coordinates = [[dep.lon, dep.lat], [arr.lon, arr.lat]];
      
      // Appel au proxy Vercel (évite CORS)
      const response = await fetch(`${API_BASE}/api/proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ coordinates })
      });
      
      if (!response.ok) throw new Error('Proxy error');
      
      const data = await response.json();
      const meters = data.routes[0].summary.distance;
      distanceKm = Math.round(meters / 1000);
      
      badge.className = 'rw-dist-badge';
      distIcon.textContent = '📏';
      distText.textContent = `Distance routière réelle : ${distanceKm} km`;
      
      updatePrice();
      
    } catch (err) {
      console.warn('Distance error:', err);
      badge.style.display = 'none';
      distanceKm = 0;
      updatePrice();
    }
  }
  
// ============================================================
// SECTION 9 : MISE À JOUR PRIX
// ============================================================
  function updatePrice() {
    let total = 38;
    
    // 1. Distance
    const distPrice = distanceKm;
    total += distPrice;
    
    // Mettre à jour l'affichage de la distance
    const priceDist = document.getElementById('price-dist');
    if (priceDist) {
      priceDist.textContent = `${distPrice}€`;
      const distRow = document.getElementById('price-row-dist');
      if (distRow) {
        if (distanceKm > 0) {
          distRow.querySelector('span:first-child').textContent = `Distance (${distanceKm} km)`;
        } else {
          distRow.querySelector('span:first-child').textContent = `Distance`;
        }
      }
    }
    
    // 2. Objets
    let itemsPrice = 0;
    for (const item of itemsList) {
      itemsPrice += (itemQuantities[item.id] || 0) * item.price;
    }
    total += itemsPrice;
    
    const priceItems = document.getElementById('price-items');
    if (priceItems) {
      priceItems.textContent = `${itemsPrice}€`;
    }
    
    // 3. Étages (uniquement si Montée en étage)
    let floorPrice = 0;
    if (answers.accessType === 'Montée en étage') {
      if (!answers.elevatorDepart && answers.floorDepart > 0) {
        floorPrice += answers.floorDepart * 8;
      }
      if (!answers.elevatorArrival && answers.floorArrival > 0) {
        floorPrice += answers.floorArrival * 8;
      }
    }
    total += floorPrice;
    
    const rowFloor = document.getElementById('price-row-floor');
    const priceFloor = document.getElementById('price-floor');
    if (rowFloor && priceFloor) {
      if (floorPrice > 0) {
        rowFloor.style.display = '';
        priceFloor.textContent = `${floorPrice}€`;
      } else {
        rowFloor.style.display = 'none';
      }
    }
    
    // 4. Déménageurs
    let moversPrice = 0;
    if (answers.movers === '2 déménageurs') moversPrice = 20;
    if (answers.movers === '3 déménageurs') moversPrice = 40;
    total += moversPrice;
    
    const rowMovers = document.getElementById('price-row-movers');
    const priceMovers = document.getElementById('price-movers');
    if (rowMovers && priceMovers) {
      if (moversPrice > 0) {
        rowMovers.style.display = '';
        priceMovers.textContent = `${moversPrice}€`;
      } else {
        rowMovers.style.display = 'none';
      }
    }
    
    // 5. Urgent
    let urgentPrice = 0;
    let totalBeforeUrgent = total;
    if (answers.urgent) {
      urgentPrice = Math.round(totalBeforeUrgent * 0.2);
      total = totalBeforeUrgent + urgentPrice;
    }
    
    const rowUrgent = document.getElementById('price-row-urgent');
    const priceUrgent = document.getElementById('price-urgent');
    if (rowUrgent && priceUrgent) {
      if (urgentPrice > 0) {
        rowUrgent.style.display = '';
        priceUrgent.textContent = `${urgentPrice}€`;
      } else {
        rowUrgent.style.display = 'none';
      }
    }
    
    // 6. Total final
    const totalEl = document.getElementById('price-total');
    if (totalEl) {
      totalEl.textContent = Math.round(total);
    }
    
    // 7. Mettre à jour le panneau final s'il existe
    const totalFinal = document.getElementById('price-total-final');
    if (totalFinal) {
      totalFinal.textContent = Math.round(total);
      
      const priceDistFinal = document.getElementById('price-dist-final');
      if (priceDistFinal) priceDistFinal.textContent = `${distPrice}€`;
      
      const priceItemsFinal = document.getElementById('price-items-final');
      if (priceItemsFinal) priceItemsFinal.textContent = `${itemsPrice}€`;
      
      const priceFloorFinal = document.getElementById('price-floor-final');
      if (priceFloorFinal) {
        if (floorPrice > 0) {
          document.getElementById('price-row-floor-final').style.display = '';
          priceFloorFinal.textContent = `${floorPrice}€`;
        } else {
          document.getElementById('price-row-floor-final').style.display = 'none';
        }
      }
      
      const priceMoversFinal = document.getElementById('price-movers-final');
      if (priceMoversFinal) {
        if (moversPrice > 0) {
          document.getElementById('price-row-movers-final').style.display = '';
          priceMoversFinal.textContent = `${moversPrice}€`;
        } else {
          document.getElementById('price-row-movers-final').style.display = 'none';
        }
      }
      
      const priceUrgentFinal = document.getElementById('price-urgent-final');
      if (priceUrgentFinal) {
        if (urgentPrice > 0) {
          document.getElementById('price-row-urgent-final').style.display = '';
          priceUrgentFinal.textContent = `${urgentPrice}€`;
        } else {
          document.getElementById('price-row-urgent-final').style.display = 'none';
        }
      }
    }
    
    // 8. Mettre à jour le récapitulatif si le formulaire final est affiché
    const recapPills = document.getElementById('recap-pills');
    if (recapPills) {
      const pills = [];
      if (answers.departureAddress) pills.push(`📍 ${answers.departureAddress.split(',')[0]}`);
      if (answers.arrivalAddress) pills.push(`🏠 ${answers.arrivalAddress.split(',')[0]}`);
      if (distanceKm > 0) pills.push(`📏 ${distanceKm} km`);
      const itemCount = Object.values(itemQuantities).reduce((s, q) => s + q, 0);
      if (itemCount > 0) pills.push(`📦 ${itemCount} objet(s)`);
      recapPills.innerHTML = pills.map(p => `<span class="rw-recap-pill">${p}</span>`).join('');
    }
  }

// ============================================================
// SECTION 10 : NAVIGATION
// ============================================================
  function nextStep() {
    const currentQ = questions[currentQuestionIndex];
    
    if (currentQ.type === 'address') {
      const value = document.getElementById(`addr-input-${currentQ.id}`)?.value;
      if (!value) {
        alert('Veuillez renseigner une adresse');
        return;
      }
      answers[currentQ.id] = value;
    }
    
    if (currentQ.id === 'accessType' && !answers.accessType) {
      alert('Veuillez sélectionner le type d\'accès');
      return;
    }
    
    if (currentQ.id === 'movers' && !answers.movers) {
      alert('Veuillez sélectionner le nombre de déménageurs');
      return;
    }
    
    if (currentQ.type === 'multiselect') {
      const selectedCount = getSelectedItemsCount();
      if (selectedCount === 0) {
        alert('Veuillez sélectionner au moins un objet à déménager');
        return;
      }
      answers.items = Object.keys(itemQuantities).filter(id => itemQuantities[id] > 0);
      answers.itemQuantities = { ...itemQuantities };
    }
    
    currentQuestionIndex++;
    render();
  }
  
  function prevStep() {
    if (currentQuestionIndex > 0) {
      currentQuestionIndex--;
      render();
    }
  }
  
  function submitForm() {
    const name = document.getElementById('input-fullName')?.value;
    const phone = document.getElementById('input-phone')?.value;
    const date = document.getElementById('input-date')?.value;
    const time = document.getElementById('input-time')?.value;
    
    if (name && phone) {
      answers.fullName = name;
      answers.phone = phone;
      answers.date = date;
      answers.time = time;
      answers.distanceKm = distanceKm;
      answers.items = Object.keys(itemQuantities).filter(id => itemQuantities[id] > 0);
      answers.itemQuantities = { ...itemQuantities };
    }
    
    calculateQuote();
  }
  
  async function calculateQuote() {
    const pricePanel = document.querySelector('.rw-price-panel');
    if (pricePanel) pricePanel.style.opacity = '0.5';
    
    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': window.location.origin },
        body: JSON.stringify({ license: LICENSE_KEY, answers, domain: window.location.hostname })
      });
      
      if (!response.ok) throw new Error('Erreur calcul');
      
      quoteResult = await response.json();
      
      container.innerHTML = `
        <div class="rw-success-state show">
          <div class="rw-success-icon">🎉</div>
          <div class="rw-success-title">Demande envoyée !</div>
          <p class="rw-success-sub">Un conseiller vous rappelle <strong>sous 2 heures</strong> au numéro indiqué.</p>
          <div class="rw-success-price-box">Devis estimatif : ${quoteResult.lowEstimate}€ - ${quoteResult.highEstimate}€ TTC</div>
          <button class="rw-price-btn" onclick="location.reload()">Nouvelle estimation</button>
        </div>
      `;
    } catch (error) {
      alert('Erreur lors du calcul');
      if (pricePanel) pricePanel.style.opacity = '1';
    }
  }

// ============================================================
// SECTION 11 : DÉMARRAGE
// ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
