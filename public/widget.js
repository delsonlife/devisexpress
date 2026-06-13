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
    LICENSE_KEY = 'COUVREUR_ABC123';
    console.warn('[Widget] Licence par défaut utilisée');
  }
  
  console.log('[Widget] Licence :', LICENSE_KEY);

// ============================================================
// SECTION 2 : CONFIGURATION GLOBALE
// ============================================================
  const API_BASE = 'https://devisexpress-two.vercel.app';
  let currentStep = 0;
  let answers = {};
  let config = null;
  let quoteResult = null;

// ============================================================
// SECTION 3 : INJECTION DU CSS PREMIUM
// ============================================================
  function injectCSS() {
    if (document.getElementById('rw-widget-styles')) return;
    
    const css = `
      :root {
        --rw-primary: #ff6b00;
        --rw-primary-dark: #e05a00;
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
        font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
        background: white;
        border-radius: var(--rw-radius-xl);
        box-shadow: var(--rw-shadow-lg);
        overflow: hidden;
        width: 100%;
        max-width: 720px;
        margin: 0 auto;
      }

      .rw-progress-container {
        padding: 1.5rem 2rem 0.5rem;
      }

      .rw-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        font-weight: 500;
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
        transition: width 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
      }

      .rw-content {
        padding: 2rem;
      }

      .rw-question {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--rw-gray-900);
        margin-bottom: 1.5rem;
        line-height: 1.3;
      }

      .rw-options-grid {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1rem;
      }

      .rw-option-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem 1.25rem;
        background: white;
        border: 1px solid var(--rw-gray-200);
        border-radius: var(--rw-radius-lg);
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .rw-option-card:hover {
        border-color: var(--rw-primary);
        background: #fff7ed;
        transform: translateY(-1px);
        box-shadow: var(--rw-shadow-md);
      }

      .rw-option-card--selected {
        border-color: var(--rw-primary);
        background: #fff7ed;
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
      }

      .rw-option-icon-svg {
        width: 28px;
        height: 28px;
      }

      .rw-option-title {
        font-weight: 500;
        color: var(--rw-gray-900);
      }

      .rw-slider-container {
        margin: 1.5rem 0;
      }

      .rw-slider-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        margin-bottom: 1rem;
      }

      .rw-slider-value {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--rw-primary);
      }

      .rw-slider {
        width: 100%;
        height: 0.25rem;
        -webkit-appearance: none;
        background: var(--rw-gray-200);
        border-radius: 9999px;
      }

      .rw-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 1.25rem;
        height: 1.25rem;
        background: var(--rw-primary);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: var(--rw-shadow-md);
        transition: transform 0.1s;
      }

      .rw-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }

      .rw-input {
        width: 100%;
        padding: 0.875rem 1rem;
        border: 1px solid var(--rw-gray-200);
        border-radius: var(--rw-radius-lg);
        font-size: 1rem;
        transition: all 0.2s;
      }

      .rw-input:focus {
        outline: none;
        border-color: var(--rw-primary);
        box-shadow: 0 0 0 3px rgba(255, 107, 0, 0.1);
      }

      .rw-navigation {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid var(--rw-gray-200);
      }

      .rw-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 9999px;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }

      .rw-btn-prev {
        background: transparent;
        color: var(--rw-gray-600);
      }

      .rw-btn-prev:hover:not(:disabled) {
        background: var(--rw-gray-100);
        color: var(--rw-gray-900);
      }

      .rw-btn-prev:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      .rw-btn-next, .rw-btn-submit {
        background: var(--rw-primary);
        color: white;
        box-shadow: var(--rw-shadow-md);
      }

      .rw-btn-next:hover, .rw-btn-submit:hover {
        background: var(--rw-primary-dark);
        transform: translateY(-1px);
      }

      .rw-result-card {
        background: linear-gradient(135deg, var(--rw-primary) 0%, var(--rw-primary-dark) 100%);
        border-radius: var(--rw-radius-xl);
        padding: 2rem;
        text-align: center;
        color: white;
        margin: 1rem 0;
      }

      .rw-result-label {
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        opacity: 0.9;
        margin-bottom: 0.5rem;
      }

      .rw-result-price {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .rw-result-delay {
        font-size: 0.875rem;
        opacity: 0.9;
      }

      .rw-assurance {
        text-align: center;
        margin-top: 1.5rem;
        font-size: 0.75rem;
        color: var(--rw-gray-400);
      }

      .rw-error {
        text-align: center;
        padding: 2rem;
        background: #fef2f2;
        color: #dc2626;
        border-radius: var(--rw-radius-lg);
      }

      .rw-loading {
        text-align: center;
        padding: 2rem;
        color: var(--rw-gray-600);
      }

      .rw-recap {
        background: var(--rw-gray-100);
        border-radius: var(--rw-radius-lg);
        padding: 1rem;
        margin: 1rem 0;
        font-size: 0.875rem;
      }

      .rw-recap-item {
        padding: 0.5rem 0;
        border-bottom: 1px solid var(--rw-gray-200);
      }

      .rw-recap-item:last-child {
        border-bottom: none;
      }

      .rw-form-group {
        margin-bottom: 1.25rem;
      }

      .rw-form-group label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--rw-gray-700);
      }

      @media (max-width: 640px) {
        .rw-content { padding: 1.25rem; }
        .rw-question { font-size: 1.25rem; }
        .rw-progress-container { padding: 1rem 1.25rem 0.25rem; }
        .rw-result-price { font-size: 1.5rem; }
        .rw-option-card { padding: 0.75rem 1rem; }
      }
    `;
    
    const style = document.createElement('style');
    style.id = 'rw-widget-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

// ============================================================
// SECTION 4 : FONCTIONS DE BASE (init, loadConfig, showError)
// ============================================================
  async function init() {
    injectCSS();
    const isValid = await loadConfig();
    if (!isValid) {
      showError('Licence invalide ou domaine non autorisé');
      return;
    }
    render();
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
      
      return true;
    } catch (error) {
      console.error('Erreur chargement config:', error);
      return false;
    }
  }

  function showError(message) {
    let container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      const target = document.getElementById('roof-widget-container') || document.body;
      target.appendChild(container);
    }
    container.innerHTML = `
      <div class="rw-error">
        <div class="rw-error-icon">🔒</div>
        <h3>Accès non autorisé</h3>
        <p>${message}</p>
      </div>
    `;
  }

// ============================================================
// SECTION 5 : RENDU PRINCIPAL (render)
// ============================================================
  function render() {
    let container = document.getElementById('roof-widget');
    if (!container) {
      container = document.createElement('div');
      container.id = 'roof-widget';
      container.className = 'rw-widget';
      const target = document.getElementById('roof-widget-container') || document.body;
      target.appendChild(container);
    }

    const questions = config.questions;
    
    if (!questions || questions.length === 0) {
      container.innerHTML = '<div class="rw-error">Aucune question configurée</div>';
      return;
    }

    if (currentStep < questions.length) {
      renderQuestion(container, questions[currentStep], currentStep, questions.length);
    } else if (currentStep === questions.length) {
      calculateQuote();  // Passage direct au calcul après la dernière question
    } else if (currentStep === questions.length + 1 && quoteResult) {
  renderResult(container);  // Page avec récap + estimation + bouton
} else if (currentStep === questions.length + 2) {
  renderLeadForm(container);  // Formulaire lead
} else if (currentStep === questions.length + 3) {
  renderSuccess(container);
}
  }

// ============================================================
// SECTION 6 : RENDU D'UNE QUESTION (slider, select, input)
// ============================================================
  function renderQuestion(container, question, step, total) {
    const progress = ((step + 1) / total) * 100;
    const isLastQuestion = (step + 1 === total);
    
    let html = `
      <div class="rw-progress-container">
        <div class="rw-progress-label">
          <span>Question ${step + 1} sur ${total}</span>
          <span>${Math.round(progress)}%</span>
        </div>
        <div class="rw-progress-bar">
          <div class="rw-progress-fill" style="width: ${progress}%;"></div>
        </div>
      </div>
      <div class="rw-content">
        <div class="rw-step">
          <h2 class="rw-question">${question.label}</h2>
    `;
    
    switch(question.type) {
      case 'slider':
        const value = answers[question.id] || question.min || 50;
        html += `
          <div class="rw-slider-container">
            <div class="rw-slider-header">
              <span>${question.label}</span>
              <span class="rw-slider-value" id="slider-value-${question.id}">${value}${question.unit ? ' ' + question.unit : ''}</span>
            </div>
            <input type="range" id="input-${question.id}" class="rw-slider"
              min="${question.min || 0}" max="${question.max || 100}" step="${question.step || 1}"
              value="${value}">
          </div>
        `;
        break;
        
      case 'select':
        html += '<div class="rw-options-grid" id="options-grid">';
        question.options.forEach(opt => {
          const isSelected = answers[question.id] === opt;
          html += `
            <div class="rw-option-card ${isSelected ? 'rw-option-card--selected' : ''}" data-value="${opt}">
              <div class="rw-option-icon">${getIconForOption(question.id, opt)}</div>
              <div class="rw-option-content">
                <div class="rw-option-title">${opt}</div>
              </div>
            </div>
          `;
        });
        html += '</div>';
        break;
        
      case 'text':
      case 'number':
        html += `
          <div class="rw-input-group">
            <input type="${question.type}" id="input-${question.id}" class="rw-input"
              placeholder="${question.placeholder || ''}" value="${answers[question.id] || ''}">
          </div>
        `;
        break;
    }
    
    const remaining = total - step - 1;
    let assuranceMsg = remaining <= 2 ? 'Plus que quelques étapes pour votre estimation' : 'Données confidentielles · Sans engagement';
    
    // Bouton différent selon que c'est la dernière question ou non
    const buttonHtml = isLastQuestion 
      ? '<button class="rw-btn rw-btn-submit" id="rw-next">Voir mon estimation →</button>'
      : '<button class="rw-btn rw-btn-next" id="rw-next">Continuer →</button>';
    
    html += `
        </div>
        <div class="rw-navigation">
          <button class="rw-btn rw-btn-prev" id="rw-prev" ${step === 0 ? 'disabled' : ''}>Retour</button>
          ${buttonHtml}
        </div>
        <div class="rw-assurance">${assuranceMsg}</div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Événements pour les sliders
    if (question.type === 'slider') {
      const slider = document.getElementById(`input-${question.id}`);
      const display = document.getElementById(`slider-value-${question.id}`);
      slider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        answers[question.id] = val;
        display.textContent = val + (question.unit ? ' ' + question.unit : '');
      });
      if (answers[question.id] === undefined) {
        answers[question.id] = parseInt(slider.value);
      }
    }
    
    // Événements pour les selects (PAS d'auto-advancement)
    if (question.type === 'select') {
      document.querySelectorAll('.rw-option-card').forEach(card => {
        card.addEventListener('click', () => {
          const value = card.dataset.value;
          answers[question.id] = value;
          document.querySelectorAll('.rw-option-card').forEach(c => c.classList.remove('rw-option-card--selected'));
          card.classList.add('rw-option-card--selected');
        });
      });
    }
    
    // Événements pour les inputs (sauvegarde en temps réel)
    if (question.type === 'text' || question.type === 'number') {
      const inputElement = document.getElementById(`input-${question.id}`);
      if (inputElement) {
        inputElement.addEventListener('input', (e) => {
          answers[question.id] = e.target.value;
        });
        if (answers[question.id]) {
          inputElement.value = answers[question.id];
        }
      }
    }
    
    document.getElementById('rw-prev').addEventListener('click', prevStep);
    
    // Gestion du bouton next (Continuer ou Voir mon estimation)
    document.getElementById('rw-next').addEventListener('click', () => {
      if (isLastQuestion) {
        // Dernière question → validation et calcul
        const questionData = config.questions[currentStep];
        let value = answers[questionData.id];
        
        // Pour les champs input, récupérer la valeur actuelle
        if (questionData.type === 'text' || questionData.type === 'number') {
          const inputElement = document.getElementById(`input-${questionData.id}`);
          if (inputElement) {
            value = inputElement.value;
            answers[questionData.id] = value;
          }
        }
        
        // Vérification du champ requis
        if (questionData.required && (!value || value === '')) {
          alert('Ce champ est requis');
          return;
        }
        
        // Passer au calcul
        currentStep++;
        render();
      } else {
        nextStep();
      }
    });
  }

// ============================================================
// SECTION 7 : ICÔNES SVG
// ============================================================
  function getIconForOption(questionId, option) {
    const iconMap = {
      surface: 'surface',
      material: 'material',
      postalCode: 'postal',
      volume: 'volume',
      distance: 'distance',
      floor: 'floor',
      windowCount: 'window'
    };
    
    const iconName = iconMap[questionId] || 'check';
    return `<img src="${API_BASE}/icons/${iconName}.svg" alt="" class="rw-option-icon-svg">`;
  }

// ============================================================
// SECTION 8 : ÉCRAN RÉSULTAT + RÉCAPITULATIF
// ============================================================
  function renderResult(container) {
    // Construction du récapitulatif des réponses
    let recapHtml = '<div class="rw-recap">';
    recapHtml += '<h3 style="margin-bottom: 1rem; font-size: 1rem;">📋 Récapitulatif de vos réponses</h3>';
    
    // Parcourir les questions configurées pour avoir le bon ordre et les bons libellés
    config.questions.forEach(question => {
      const value = answers[question.id];
      if (value && value !== '') {
        recapHtml += `<div class="rw-recap-item">
          <strong>${question.label}</strong> : ${value}
        </div>`;
      }
    });
    recapHtml += '</div>';
    
    const html = `
      <div class="rw-content">
        <div class="rw-step">
          <div class="rw-result-card">
            <div class="rw-result-label">Estimation prévisionnelle</div>
            <div class="rw-result-price">${quoteResult.lowEstimate.toLocaleString()}€ – ${quoteResult.highEstimate.toLocaleString()}€</div>
            <div class="rw-result-delay">⏱ Durée estimée : ${quoteResult.daysEstimate.min} à ${quoteResult.daysEstimate.max} jours</div>
          </div>
          
          ${recapHtml}
          
          <div class="rw-navigation">
            <button class="rw-btn rw-btn-prev" id="rw-prev">← Modifier mes réponses</button>
            <button class="rw-btn rw-btn-submit" id="rw-next">📩 Recevoir les détails du devis →</button>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    document.getElementById('rw-prev').addEventListener('click', () => {
      currentStep = 0;
      render();
    });
    
    document.getElementById('rw-next').addEventListener('click', () => {
      currentStep = config.questions.length + 2; // Va vers le formulaire lead
      render();
    });
  }

    // ============================================================
// SECTION 9 : FORMULAIRE LEAD (après clic sur "Recevoir les détails")
// ============================================================
  function renderLeadForm(container) {
    const html = `
      <div class="rw-content">
        <div class="rw-step">
          <h2 class="rw-question">Recevez votre devis détaillé</h2>
          <p style="color: var(--rw-gray-600); margin-bottom: 1.5rem;">Remplissez ce formulaire, votre artisan vous recontactera sous 24h.</p>
          
          <div class="rw-form-group">
            <label>Nom complet</label>
            <input type="text" id="lead-name" class="rw-input" placeholder="Jean Dupont">
          </div>
          <div class="rw-form-group">
            <label>Téléphone</label>
            <input type="tel" id="lead-phone" class="rw-input" placeholder="06 12 34 56 78">
          </div>
          <div class="rw-form-group">
            <label>Email</label>
            <input type="email" id="lead-email" class="rw-input" placeholder="contact@exemple.fr">
          </div>
          
          <div class="rw-navigation">
            <button class="rw-btn rw-btn-prev" id="rw-prev">← Retour</button>
            <button class="rw-btn rw-btn-submit" id="rw-submit">Envoyer ma demande →</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    
    document.getElementById('rw-prev').addEventListener('click', () => {
      currentStep = config.questions.length + 1; // Retour à l'estimation
      render();
    });
    
    document.getElementById('rw-submit').addEventListener('click', submitLead);
  }

// ============================================================
// SECTION 10 : ÉCRAN SUCCÈS
// ============================================================
  function renderSuccess(container) {
    container.innerHTML = `
      <div class="rw-content">
        <div class="rw-step" style="text-align: center;">
          <div class="rw-success-icon">✅</div>
          <h2 class="rw-question">Merci !</h2>
          <p>Votre demande a bien été envoyée.<br>Un artisan vous contactera rapidement.</p>
          <button class="rw-btn rw-btn-next" id="rw-restart">Nouvelle estimation</button>
        </div>
      </div>
    `;
    document.getElementById('rw-restart').addEventListener('click', () => location.reload());
  }

// ============================================================
// SECTION 11 : CALCUL DEVIS (API calculate)
// ============================================================
  async function calculateQuote() {
    const container = document.getElementById('roof-widget');
    container.innerHTML = '<div class="rw-loading">Calcul en cours...</div>';
    
    // Vérification des champs requis
    const required = ['surface', 'material', 'postalCode'];
    const missing = required.filter(r => !answers[r]);
    
    if (missing.length > 0) {
      console.error('Champs manquants:', missing);
      alert('Veuillez répondre à toutes les questions');
      currentStep = 0;
      render();
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': window.location.origin },
        body: JSON.stringify({ license: LICENSE_KEY, answers, domain: window.location.hostname })
      });
      
      if (!response.ok) throw new Error('Erreur calcul');
      
      quoteResult = await response.json();
      currentStep = config.questions.length + 1;
      render();
    } catch (error) {
      alert('Erreur lors du calcul: ' + error.message);
      currentStep = 0;
      render();
    }
  }

// ============================================================
// SECTION 12 : ENVOI LEAD (API lead)
// ============================================================
  async function submitLead() {
    const name = document.getElementById('lead-name')?.value;
    const phone = document.getElementById('lead-phone')?.value;
    const email = document.getElementById('lead-email')?.value;
    
    if (!name || !phone || !email) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      await fetch(`${API_BASE}/api/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Origin': window.location.origin },
        body: JSON.stringify({
          license: LICENSE_KEY,
          leadData: { name, phone, email, answers },
          quoteData: quoteResult,
          domain: window.location.hostname
        })
      });
      
      currentStep = config.questions.length + 3;
      render();
    } catch (error) {
      alert('Erreur lors de l\'envoi');
    }
  }

// ============================================================
// SECTION 13 : NAVIGATION (nextStep, prevStep)
// ============================================================
  function nextStep() {
    if (currentStep < config.questions.length) {
      const question = config.questions[currentStep];
      let value = answers[question.id];
      
      // Pour les champs input, récupérer la valeur actuelle du DOM
      if (question.type === 'text' || question.type === 'number') {
        const inputElement = document.getElementById(`input-${question.id}`);
        if (inputElement) {
          value = inputElement.value;
          answers[question.id] = value;
        }
      }
      
      // Vérification du champ requis
      if (question.required && (!value || value === '')) {
        alert('Ce champ est requis');
        return;
      }
      
      currentStep++;
      render();
    }
  }

  function prevStep() {
    if (currentStep > 0) {
      currentStep--;
      render();
    }
  }

// ============================================================
// SECTION 14 : DÉMARRAGE
// ============================================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
