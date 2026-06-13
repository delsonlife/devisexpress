// ============================================================
// CALCULATEUR TOITURE V1 (12 questions)
// ============================================================

export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    // 1. PRIX DE BASE (surface x matériau)
    const materialPrice = pricing.materials?.[answers.material] || 120;
    let total = (answers.surface || 80) * materialPrice;
    
    // 2. COEFFICIENT TYPE DE PROJET
    const projectCoeff = coefficients?.project?.[answers.projectType] || 1.0;
    total = total * projectCoeff;
    
    // 3. COEFFICIENT TYPE DE BÂTIMENT
    const buildingCoeff = coefficients?.building?.[answers.buildingType] || 1.0;
    total = total * buildingCoeff;
    
    // 4. COEFFICIENT ÂGE
    const ageCoeff = coefficients?.age?.[answers.age] || 1.0;
    total = total * ageCoeff;
    
    // 5. COEFFICIENT ÉTAT
    const stateCoeff = coefficients?.state?.[answers.state] || 1.0;
    total = total * stateCoeff;
    
    // 6. COEFFICIENT NOMBRE DE PANS
    const sidesCoeff = coefficients?.sides?.[answers.sides] || 1.0;
    total = total * sidesCoeff;
    
    // 7. COEFFICIENT PENTE
    const penteCoeff = coefficients?.pente?.[answers.pente] || 1.0;
    total = total * penteCoeff;
    
    // 8. ACCESSIBILITÉ (supplément fixe)
    const accessibilityPrice = pricing.accessibility?.[answers.accessibility] || 0;
    total = total + accessibilityPrice;
    
    // 9. DÉPOSE (pourcentage ou fixe)
    let deposeAmount = 0;
    if (answers.depose === 'oui') {
      deposeAmount = pricing.depose?.oui || (total * 0.15);
    } else if (answers.depose === 'je_ne_sais_pas') {
      deposeAmount = pricing.depose?.je_ne_sais_pas || (total * 0.10);
    }
    total = total + deposeAmount;
    
    // 10. OPTIONS SUPPLÉMENTAIRES
    let optionsTotal = 0;
    const optionsDetails = [];
    
    if (answers.options && Array.isArray(answers.options)) {
      for (const opt of answers.options) {
        let price = 0;
        switch(opt) {
          case 'Velux':
            const veluxCount = answers.veluxCount || 1;
            price = (pricing.options?.velux || 900) * veluxCount;
            optionsDetails.push({ label: `Velux (${veluxCount}x)`, price });
            break;
          case 'Gouttières':
            price = pricing.options?.gouttiere || 35;
            optionsDetails.push({ label: 'Gouttières', price });
            break;
          case 'Isolation':
            price = pricing.options?.isolation || 40;
            optionsDetails.push({ label: 'Isolation', price });
            break;
          case 'Traitement charpente':
            price = pricing.options?.charpente || 25;
            optionsDetails.push({ label: 'Traitement charpente', price });
            break;
          case 'Écran sous toiture':
            price = pricing.options?.ecran_sous_toiture || 20;
            optionsDetails.push({ label: 'Écran sous toiture', price });
            break;
        }
        optionsTotal += price;
      }
    }
    total = total + optionsTotal;
    
    // 11. FOURCHETTE DE PRIX (marges)
    const marginLow = pricing.margin_low || 0.92;
    const marginHigh = pricing.margin_high || 1.18;
    
    const lowEstimate = Math.round(total * marginLow);
    const highEstimate = Math.round(total * marginHigh);
    
    // 12. ESTIMATION DES JOURS (basée sur la surface)
    const surface = answers.surface || 80;
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
        material: answers.material,
        surface: answers.surface,
        projectType: answers.projectType,
        buildingType: answers.buildingType,
        age: answers.age,
        state: answers.state,
        sides: answers.sides,
        pente: answers.pente,
        accessibility: answers.accessibility,
        depose: answers.depose,
        options: optionsDetails
      }
    };
  }
};
