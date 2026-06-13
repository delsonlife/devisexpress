export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    const volume = answers.volume || 50;
    const distance = answers.distance || 'moins_50km';
    const floor = answers.floor || 0;
    
    // Prix au m³
    const pricePerM3 = pricing.moving?.pricePerM3 || 45;
    let total = volume * pricePerM3;
    
    // Coefficient distance
    const distanceCoeff = {
      'moins_50km': 1.0,
      '50_200km': 1.3,
      'plus_200km': 1.8
    };
    total = total * (distanceCoeff[distance] || 1.0);
    
    // Supplément étage
    const floorSurcharge = (pricing.moving?.floorSurcharge || 50) * floor;
    total += floorSurcharge;
    
    const lowEstimate = Math.round(total * 0.95);
    const highEstimate = Math.round(total * 1.15);
    
    const daysEstimate = {
      min: volume < 50 ? 1 : 2,
      max: volume > 150 ? 4 : 2
    };
    
    return {
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
      currency: 'EUR',
      daysEstimate,
      details: {
        volume,
        distance,
        floor
      }
    };
  }
};
