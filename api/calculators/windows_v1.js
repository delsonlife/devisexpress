export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    const windowCount = answers.windowCount || 5;
    const material = answers.material || 'pvc';
    const glazing = answers.glazing || 'double';
    
    // Prix par fenêtre
    const materialPrices = pricing.windows?.materialPrices || {
      pvc: 450,
      wood: 800,
      aluminum: 650
    };
    
    let pricePerWindow = materialPrices[material] || 450;
    
    // Coefficient vitrage
    const glazingCoeff = {
      'double': 1.0,
      'triple': 1.35
    };
    pricePerWindow = pricePerWindow * (glazingCoeff[glazing] || 1.0);
    
    const total = windowCount * pricePerWindow;
    
    const lowEstimate = Math.round(total * 0.92);
    const highEstimate = Math.round(total * 1.12);
    
    const daysEstimate = {
      min: Math.ceil(windowCount / 3),
      max: Math.ceil(windowCount / 2) + 1
    };
    
    return {
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
      currency: 'EUR',
      daysEstimate,
      details: {
        windowCount,
        material,
        glazing
      }
    };
  }
};
