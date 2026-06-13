(function() {
  // Récupération robuste de la licence
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
  
  // Méthode 3 : depuis l'URL de la page
  if (!LICENSE_KEY) {
    const urlParams = new URLSearchParams(window.location.search);
    LICENSE_KEY = urlParams.get('license');
  }
  
  // Méthode 4 : valeur par défaut
  if (!LICENSE_KEY) {
    LICENSE_KEY = 'COUVREUR_ABC123';
    console.warn('[Widget] Licence par défaut utilisée');
  }
  
  console.log('[Widget] Licence détectée :', LICENSE_KEY);
  
  const API_BASE = 'https://devisexpress-two.vercel.app';
  let currentStep = 0;
  let answers = {};
  let config = null;
  let quoteResult = null;


function injectCSS() {
  const css = `
    :root {
      --rw-primary: #ff6b00;
      --rw-primary-dark: #e05a00;
      --rw-gray-100: #f3f4f6;
      --rw-gray-200: #e5e7eb;
      --rw-gray-600: #4b5563;
      --rw-gray-900: #111827;
      --rw-shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
      --rw-radius-xl: 1.5rem;
    }

    .rw-widget {
      font-family: system-ui, -apple-system, sans-serif;
      background: white;
      border-radius: var(--rw-radius-xl);
      box-shadow: var(--rw-shadow-lg);
      overflow: hidden;
      width: 100%;
      max-width: 720px;
      margin: 0 auto;
    }

    .rw-progress-container {
      padding: 1.75rem 2rem 0.5rem;
    }

    .rw-progress-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.8125rem;
      color: var(--rw-gray-600);
      margin-bottom: 0.625rem;
    }

    .rw-progress-bar {
      height: 0.3125rem;
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

    .rw-content {
      padding: 2rem;
    }

    .rw-question {
      font-size: 1.75rem;
      font-weight: 600;
      color: var(--rw-gray-900);
      margin-bottom: 1.5rem;
    }

    .rw-options-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .rw-option-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border: 1px solid var(--rw-gray-200);
      border-radius: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .rw-option-card:hover {
      border-color: var(--rw-primary);
      transform: translateY(-1px);
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    }

    .rw-option-card--selected {
      border-color: var(--rw-primary);
      background: #fff7ed;
    }

    .rw-option-icon-svg {
      width: 24px;
      height: 24px;
    }

    .rw-option-title {
      font-weight: 500;
      color: var(--rw-gray-900);
    }

    .rw-slider-container {
      margin-top: 1.5rem;
    }

    .rw-slider-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .rw-slider-value {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--rw-primary);
    }

    .rw-slider {
      width: 100%;
      height: 0.3125rem;
      -webkit-appearance: none;
      background: var(--rw-gray-200);
      border-radius: 9999px;
    }

    .rw-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 1.125rem;
      height: 1.125rem;
      background: var(--rw-primary);
      border-radius: 50%;
      cursor: pointer;
    }

    .rw-input {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 1px solid var(--rw-gray-200);
      border-radius: 0.75rem;
      font-size: 1rem;
    }

    .rw-input:focus {
      outline: none;
      border-color: var(--rw-primary);
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
      font-weight: 500;
      cursor: pointer;
      border: none;
      font-size: 0.875rem;
    }

    .rw-btn-prev {
      background: transparent;
      color: var(--rw-gray-600);
    }

    .rw-btn-prev:hover:not(:disabled) {
      background: var(--rw-gray-100);
    }

    .rw-btn-prev:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .rw-btn-next, .rw-btn-submit {
      background: var(--rw-primary);
      color: white;
    }

    .rw-btn-next:hover, .rw-btn-submit:hover {
      background: var(--rw-primary-dark);
    }

    .rw-result-card {
      background: linear-gradient(135deg, var(--rw-primary) 0%, var(--rw-primary-dark) 100%);
      border-radius: 1.5rem;
      padding: 2rem;
      text-align: center;
      color: white;
    }

    .rw-result-price {
      font-size: 2rem;
      font-weight: 700;
    }

    .rw-assurance {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.75rem;
      color: var(--rw-gray-600);
    }

    .rw-error {
      text-align: center;
      padding: 2rem;
      background: #fef2f2;
      color: #dc2626;
      border-radius: 1rem;
    }

    .rw-loading {
      text-align: center;
      padding: 2rem;
    }

    @media (max-width: 640px) {
      .rw-content { padding: 1.5rem; }
      .rw-question { font-size: 1.375rem; }
    }
  `;
  
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}
  

  async function init() {
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
      renderDelay(container);
    } else if (currentStep === questions.length + 1 && quoteResult) {
      renderResult(container);
    } else if (currentStep === questions.length + 2) {
      renderRecap(container);
    } else if (currentStep === questions.length + 3) {
      renderSuccess(container);
    }
  }

  function renderQuestion(container, question, step, total) {
    const progress = ((step + 1) / total) * 100;
    
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
    let assuranceMsg = remaining <= 2 ? '✨ Plus que quelques étapes pour votre estimation' : '🔒 Données confidentielles · Sans engagement';
    
    html += `
        </div>
        <div class="rw-navigation">
          <button class="rw-btn rw-btn-prev" id="rw-prev" ${step === 0 ? 'disabled' : ''}>Retour</button>
          <button class="rw-btn rw-btn-next" id="rw-next">Continuer</button>
        </div>
        <div class="rw-assurance">${assuranceMsg}</div>
      </div>
    `;
    
    container.innerHTML = html;
    
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
    
    if (question.type === 'select') {
      document.querySelectorAll('.rw-option-card').forEach(card => {
        card.addEventListener('click', () => {
          const value = card.dataset.value;
          answers[question.id] = value;
          document.querySelectorAll('.rw-option-card').forEach(c => c.classList.remove('rw-option-card--selected'));
          card.classList.add('rw-option-card--selected');
          setTimeout(() => nextStep(), 300);
        });
      });
    }
    
    document.getElementById('rw-prev').addEventListener('click', prevStep);
    document.getElementById('rw-next').addEventListener('click', nextStep);
  }

  function getIconForOption(questionId, option) {
    const iconMap = {
      surface: 'surface',
      material: 'material',
      postalCode: 'postal',
      volume: 'volume',
      distance: 'distance',
      floor: 'floor',
      windowCount: 'window',
      delay: 'calendar'
    };
    
    if (option === 'urgent' || option === 'Urgent (moins d\'une semaine)') {
      return `<img src="${API_BASE}/icons/urgent.svg" alt="" class="rw-option-icon-svg">`;
    }
    
    if (questionId === 'delay') {
      return `<img src="${API_BASE}/icons/calendar.svg" alt="" class="rw-option-icon-svg">`;
    }
    
    const iconName = iconMap[questionId] || 'check';
    return `<img src="${API_BASE}/icons/${iconName}.svg" alt="" class="rw-option-icon-svg">`;
  }

  function renderDelay(container) {
    const delayOptions = [
      { value: 'urgent', label: 'Urgent (moins d\'une semaine)' },
      { value: 'moins_3', label: 'Moins de 3 mois' },
      { value: 'moins_6', label: 'Moins de 6 mois' },
      { value: 'plus_6', label: 'Plus de 6 mois' }
    ];
    
    let html = `
      <div class="rw-progress-container">
        <div class="rw-progress-label"><span>Délai souhaité</span><span>100%</span></div>
        <div class="rw-progress-bar"><div class="rw-progress-fill" style="width: 100%;"></div></div>
      </div>
      <div class="rw-content">
        <div class="rw-step">
          <h2 class="rw-question">Quel est votre délai ?</h2>
          <div class="rw-options-grid">
    `;
    
    delayOptions.forEach(opt => {
      html += `
        <div class="rw-option-card" data-value="${opt.value}">
          <div class="rw-option-icon">${getIconForOption('delay', opt.value)}</div>
          <div class="rw-option-content">
            <div class="rw-option-title">${opt.label}</div>
          </div>
        </div>
      `;
    });
    
    html += `
          </div>
        </div>
        <div class="rw-navigation">
          <button class="rw-btn rw-btn-prev" id="rw-prev">Retour</button>
          <button class="rw-btn rw-btn-next" id="rw-next">Voir mon estimation</button>
        </div>
        <div class="rw-assurance">🔒 Dernière étape avant votre estimation</div>
      </div>
    `;
    
    container.innerHTML = html;
    
    document.querySelectorAll('.rw-option-card').forEach(card => {
      card.addEventListener('click', () => {
        answers.delay = card.dataset.value;
        document.querySelectorAll('.rw-option-card').forEach(c => c.classList.remove('rw-option-card--selected'));
        card.classList.add('rw-option-card--selected');
        setTimeout(() => calculateQuote(), 300);
      });
    });
    
    document.getElementById('rw-prev').addEventListener('click', prevStep);
  }

  function renderResult(container) {
    const html = `
      <div class="rw-content">
        <div class="rw-step">
          <h2 class="rw-question">Votre estimation</h2>
          <div class="rw-result-card">
            <div class="rw-result-label">Estimation prévisionnelle</div>
            <div class="rw-result-price">${quoteResult.lowEstimate.toLocaleString()}€ – ${quoteResult.highEstimate.toLocaleString()}€</div>
            <div class="rw-result-delay">⏱ Durée estimée : ${quoteResult.daysEstimate.min} à ${quoteResult.daysEstimate.max} jours</div>
          </div>
          <div class="rw-navigation">
            <button class="rw-btn rw-btn-prev" id="rw-prev">Modifier</button>
            <button class="rw-btn rw-btn-next" id="rw-next">Continuer</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    document.getElementById('rw-prev').addEventListener('click', prevStep);
    document.getElementById('rw-next').addEventListener('click', () => {
      currentStep = config.questions.length + 2;
      render();
    });
  }

  function renderRecap(container) {
    let recapHtml = '<div class="rw-recap">';
    for (const [key, value] of Object.entries(answers)) {
      recapHtml += `<div class="rw-recap-item"><strong>${key}</strong>: ${value}</div>`;
    }
    recapHtml += '</div>';
    
    const html = `
      <div class="rw-content">
        <div class="rw-step">
          <h2 class="rw-question">Vos informations</h2>
          ${recapHtml}
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
            <button class="rw-btn rw-btn-prev" id="rw-prev">Retour</button>
            <button class="rw-btn rw-btn-submit" id="rw-submit">Recevoir mon estimation</button>
          </div>
        </div>
      </div>
    `;
    container.innerHTML = html;
    document.getElementById('rw-prev').addEventListener('click', prevStep);
    document.getElementById('rw-submit').addEventListener('click', submitLead);
  }

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

  async function calculateQuote() {
    const container = document.getElementById('roof-widget');
    container.innerHTML = '<div class="rw-loading">⏳ Calcul en cours...</div>';
    
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
    }
  }

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

  function nextStep() {
    if (currentStep < config.questions.length) {
      const question = config.questions[currentStep];
      let value = answers[question.id];
      
      if (question.type === 'input') {
        value = document.getElementById(`input-${question.id}`)?.value;
      }
      
      if (question.required && !value) {
        alert('Ce champ est requis');
        return;
      }
      
      if (question.type === 'input') {
        answers[question.id] = value;
      }
      
      currentStep++;
      render();
    } else if (currentStep === config.questions.length) {
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
