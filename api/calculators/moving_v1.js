export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    // Base
    let total = pricing.basePrice || 38;
    
    // ⚡ CORRECTION : Distance (1€/km)
    const distanceKm = answers.distanceKm || 0;
    const distancePrice = distanceKm * (pricing.pricePerKm || 1);
    total += distancePrice;
    
    // Objets
    let itemsTotal = 0;
    const itemPrices = {
      "Canapé": 4, "Lit double": 3, "Armoire": 3,
      "Table": 2, "Réfrigérateur": 2, "Lave-linge": 2,
      "Bureau": 2, "Carton": 0.5
    };
    
    if (answers.items && Array.isArray(answers.items)) {
      for (const item of answers.items) {
        const qty = answers.itemQuantities?.[item] || 1;
        itemsTotal += (itemPrices[item] || 0) * qty;
      }
    }
    total += itemsTotal;
    
    // Étages
    let floorTotal = 0;
    if (answers.accessType === 'Montée en étage') {
      if (!answers.elevatorDepart && answers.floorDepart > 0) {
        floorTotal += answers.floorDepart * 8;
      }
      if (!answers.elevatorArrival && answers.floorArrival > 0) {
        floorTotal += answers.floorArrival * 8;
      }
    }
    total += floorTotal;
    
    // Déménageurs
    let moversTotal = 0;
    if (answers.movers === '2 déménageurs') moversTotal = 20;
    if (answers.movers === '3 déménageurs') moversTotal = 40;
    total += moversTotal;
    
    // Urgent
    let urgentTotal = 0;
    let finalTotal = total;
    if (answers.urgent === true) {
      urgentTotal = Math.round(total * 0.2);
      finalTotal = total + urgentTotal;
    }
    
    // Marges
    const marginLow = pricing.margin_low || 0.92;
    const marginHigh = pricing.margin_high || 1.18;
    
    const lowEstimate = Math.round(finalTotal * marginLow);
    const highEstimate = Math.round(finalTotal * marginHigh);
    
    return {
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round(finalTotal),
      currency: 'EUR',
      daysEstimate: { min: 1, max: 3 },
      details: {
        distanceKm,
        distancePrice,
        itemsTotal,
        floorTotal,
        moversTotal,
        urgentTotal
      }
    };
  }
};
