export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    // Extraire les valeurs
    const surface = answers.surface || 80;
    const material = answers.material || 'tuile';
    const materialPrice = pricing.materials?.[material] || 120;
    
    // Calcul de base
    let total = surface * materialPrice;
    
    // Appliquer les coefficients
    const projectCoeff = coefficients?.project?.[answers.projectType] || 1.0;
    const ageCoeff = coefficients?.age?.[answers.age] || 1.0;
    const stateCoeff = coefficients?.state?.[answers.state] || 1.0;
    const sidesCoeff = coefficients?.sides?.[answers.sides] || 1.0;
    
    total = total * projectCoeff * ageCoeff * stateCoeff * sidesCoeff;
    
    // Options supplémentaires
    let optionsTotal = 0;
    const optionsDetails = [];
    
    if (answers.options) {
      if (answers.options.velux) {
        const veluxCount = answers.options.veluxCount || 1;
        const veluxPrice = pricing.options?.velux || 900;
        optionsTotal += veluxPrice * veluxCount;
        optionsDetails.push({ label: `Velux (${veluxCount}x)`, price: veluxPrice * veluxCount });
      }
      if (answers.options.gouttiere) {
        const price = pricing.options?.gouttiere || 35;
        optionsTotal += price;
        optionsDetails.push({ label: 'Gouttières', price });
      }
      if (answers.options.isolation) {
        const price = pricing.options?.isolation || 40;
        optionsTotal += price;
        optionsDetails.push({ label: 'Isolation', price });
      }
    }
    
    total += optionsTotal;
    
    // Fourchette de prix
    const marginLow = pricing.margin_low || 0.92;
    const marginHigh = pricing.margin_high || 1.18;
    
    const lowEstimate = Math.round(total * marginLow);
    const highEstimate = Math.round(total * marginHigh);
    
    // Estimation des jours
    const daysEstimate = {
      min: Math.max(2, Math.floor(surface / 50)),
      max: Math.min(15, Math.floor(surface / 30) + 2)
    };
    
    return {
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
      currency: 'EUR',
      daysEstimate,
      details: {
        material,
        surface,
        options: optionsDetails
      }
    };
  }
};
