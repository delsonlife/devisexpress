(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const LICENSE_KEY = urlParams.get('license');
  
  const API_BASE = 'https://roof-widget.vercel.app';
  let currentStep = 0;
  let answers = {};
  let config = null;
  let quoteResult = null;

  if (!LICENSE_KEY) {
    console.error('[Widget] License key required');
    return;
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
      
      // Appliquer le branding
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
    
    // Rendu selon le type de question
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
    
    // Message d'assurance
    const remaining = total - step - 1;
    let assuranceMsg = '';
    if (remaining <= 2) {
      assuranceMsg = '✨ Plus que quelques étapes pour votre estimation';
    } else {
      assuranceMsg = '🔒 Données confidentielles · Sans engagement';
    }
    
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
    
    // Attacher les événements
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
    // Mapping des icônes par type de question
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
    
    // Mapping spécial pour les options "urgent"
    if (option === 'urgent' || option === 'Urgent (moins d\'une semaine)') {
      return `<img src="${API_BASE}/icons/urgent.svg" alt="" class="rw-option-icon-svg">`;
    }
    
    // Mapping pour les options de délai
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
      alert('Erreur lors du calcul');
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
