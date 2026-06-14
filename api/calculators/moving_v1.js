// ============================================================
// CALCULATEUR DÉMÉNAGEMENT V1 (distance auto + fallback)
// ============================================================

// Clé API OpenRouteService (gratuite)
// Inscription : https://openrouteservice.org/sign-up/
const ORS_API_KEY = 'TON_API_KEY_ICI';

// Fonction de géocodage + calcul de distance
async function getDistance(departure, arrival) {
  try {
    // 1. Géocodage des adresses
    const geocodeUrl = (address) => 
      `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(address)}&boundary.country=FR`;
    
    const [departureGeo, arrivalGeo] = await Promise.all([
      fetch(geocodeUrl(departure)).then(r => r.json()),
      fetch(geocodeUrl(arrival)).then(r => r.json())
    ]);
    
    if (!departureGeo.features?.length || !arrivalGeo.features?.length) {
      console.warn('Adresse non trouvée');
      return null;
    }
    
    const [lng1, lat1] = departureGeo.features[0].geometry.coordinates;
    const [lng2, lat2] = arrivalGeo.features[0].geometry.coordinates;
    
    // 2. Calcul de la matrice de distance
    const matrixUrl = `https://api.openrouteservice.org/v2/matrix/driving-car`;
    const response = await fetch(matrixUrl, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        locations: [[lng1, lat1], [lng2, lat2]],
        metrics: ['distance']
      })
    });
    
    if (!response.ok) {
      console.warn('Erreur matrice distance:', response.status);
      return null;
    }
    
    const data = await response.json();
    const distanceMeters = data.distances?.[0]?.[1];
    
    if (!distanceMeters) {
      return null;
    }
    
    const distanceKm = distanceMeters / 1000;
    return distanceKm;
    
  } catch (error) {
    console.error('Erreur calcul distance:', error.message);
    return null;
  }
}

// Fallback : déterminer la tranche de distance à partir des adresses
function getDistanceFallback(departure, arrival) {
  // Par défaut, on suppose une distance moyenne
  // Tu peux améliorer cette logique si besoin
  return 100; // 100 km par défaut
}

export default {
  calculate: async (answers, pricing, coefficients = {}) => {
    const volume = answers.volume || 50;
    const floor = answers.floor || 0;
    
    // 1. Prix au m³
    const pricePerM3 = pricing.moving?.pricePerM3 || 38;
    let total = volume * pricePerM3;
    
    // 2. Distance (auto ou fallback)
    let distanceKm = null;
    let distancePrice = 0;
    let usedFallback = false;
    
    if (answers.departureAddress && answers.arrivalAddress) {
      try {
        distanceKm = await getDistance(answers.departureAddress, answers.arrivalAddress);
      } catch (e) {
        console.warn('Erreur API distance:', e);
        distanceKm = null;
      }
      
      if (distanceKm !== null && distanceKm > 0) {
        // API OK → prix réel
        const pricePerKm = pricing.moving?.pricePerKm || 1;
        distancePrice = Math.round(distanceKm * pricePerKm);
        total += distancePrice;
      } else {
        // API KO → fallback sur les tranches
        usedFallback = true;
        
        // Déterminer la distance approximative depuis la réponse utilisateur (si disponible)
        let distanceFallback = 50; // valeur par défaut
        
        if (answers.distanceFallback) {
          const fallbackMap = {
            'moins_50km': 25,
            '50_200km': 100,
            'plus_200km': 300
          };
          distanceFallback = fallbackMap[answers.distanceFallback] || 50;
          distanceKm = distanceFallback;
        } else {
          distanceKm = getDistanceFallback(answers.departureAddress, answers.arrivalAddress);
        }
        
        const pricePerKm = pricing.moving?.pricePerKm || 1;
        distancePrice = Math.round(distanceKm * pricePerKm);
        total += distancePrice;
      }
    } else {
      // Pas d'adresses fournies → fallback sur la réponse distance si disponible
      const distanceType = answers.distance || '50_200km';
      const fallbackMap = {
        'moins_50km': 25,
        '50_200km': 100,
        'plus_200km': 300
      };
      distanceKm = fallbackMap[distanceType] || 100;
      const pricePerKm = pricing.moving?.pricePerKm || 1;
      distancePrice = Math.round(distanceKm * pricePerKm);
      total += distancePrice;
      usedFallback = true;
    }
    
    // 3. Supplément par étage
    const floorSurcharge = (pricing.moving?.floorSurcharge || 15) * floor;
    total += floorSurcharge;
    
    // 4. Fourchette de prix
    const marginLow = pricing.margin_low || 0.92;
    const marginHigh = pricing.margin_high || 1.18;
    
    const lowEstimate = Math.round(total * marginLow);
    const highEstimate = Math.round(total * marginHigh);
    
    // 5. Estimation des jours
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
        distanceKm: distanceKm !== null ? Math.round(distanceKm * 10) / 10 : 'Non calculée',
        distancePrice: Math.round(distancePrice),
        floor,
        pricePerM3,
        pricePerKm: pricing.moving?.pricePerKm || 1,
        usedFallback
      }
    };
  }
};
