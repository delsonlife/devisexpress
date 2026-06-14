export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    // 1. Base
    let total = pricing.basePrice || 38;
    let details = {};
    
    // 2. Distance (calculée par le widget)
    let distanceKm = answers.distanceKm || 0;
    let distancePrice = distanceKm * (pricing.pricePerKm || 1);
    total += distancePrice;
    
    // 3. Objets avec quantités
    let itemsTotal = 0;
    let itemsList = [];
    
    const itemPrices = {
      "Canapé": 4, "Lit double": 3, "Armoire": 3,
      "Table": 2, "Réfrigérateur": 2, "Lave-linge": 2,
      "Bureau": 2, "Carton": 0.5
    };
    
    if (answers.items && Array.isArray(answers.items)) {
      for (const item of answers.items) {
        const quantity = answers[`qty_${item}`] || 1;
        const price = (itemPrices[item] || 0) * quantity;
        itemsTotal += price;
        itemsList.push({ name: item, quantity, price });
      }
    }
    total += itemsTotal;
    
    // 4. Étages
    let floorTotal = 0;
    if (answers.accessType === "Montée en étage") {
      const floorSurcharge = pricing.floorSurcharge || 8;
      
      const floorDepart = answers.floorDepart || 0;
      const elevatorDepart = answers.elevatorDepart === true;
      if (!elevatorDepart && floorDepart > 0) {
        floorTotal += floorDepart * floorSurcharge;
      }
      
      const floorArrival = answers.floorArrival || 0;
      const elevatorArrival = answers.elevatorArrival === true;
      if (!elevatorArrival && floorArrival > 0) {
        floorTotal += floorArrival * floorSurcharge;
      }
    }
    total += floorTotal;
    
    // 5. Déménageurs supplémentaires
    let moversTotal = 0;
    if (answers.movers === "2 déménageurs") {
      moversTotal = pricing.extraMoverPrice || 20;
    } else if (answers.movers === "3 déménageurs") {
      moversTotal = (pricing.extraMoverPrice || 20) * 2;
    }
    total += moversTotal;
    
    // 6. Urgent (+20%)
    let urgentTotal = 0;
    if (answers.urgent === true) {
      urgentTotal = Math.round(total * 0.2);
      total = total * 1.2;
    }
    
    // 7. Marges
    const marginLow = pricing.margin_low || 0.92;
    const marginHigh = pricing.margin_high || 1.18;
    
    const lowEstimate = Math.round(total * marginLow);
    const highEstimate = Math.round(total * marginHigh);
    
    return {
      lowEstimate,
      highEstimate,
      averageEstimate: Math.round((lowEstimate + highEstimate) / 2),
      currency: 'EUR',
      daysEstimate: { min: 1, max: 3 },
      details: {
        distanceKm,
        items: itemsList,
        floorTotal,
        moversTotal,
        urgentTotal
      }
    };
  }
};
