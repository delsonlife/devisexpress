import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { license } = req.query;

  if (!license) {
    return res.status(400).json({ error: 'License key required' });
  }

  try {
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    
    const licenseData = licensesData[license];
    
    if (!licenseData) {
      return res.status(401).json({ error: 'Invalid license key' });
    }
    
    if (!licenseData.active) {
      return res.status(403).json({ error: 'License is inactive' });
    }
    
    // Récupérer le domaine depuis l'en-tête Origin ou Referer
    const origin = req.headers.origin || req.headers.referer || '';
    let domain = origin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    
    // Si aucun domaine trouvé (test direct dans navigateur), on accepte pour le debug
    // Mais en production, le widget envoie toujours l'en-tête Origin
    const allowedOrigins = licenseData.allowedOrigins || [licenseData.company?.domain];
    
    let isDomainAllowed = false;
    
    if (!domain) {
      // Mode debug : on accepte si c'est un appel direct (pour tester)
      console.log('⚠️ Appel API sans domaine (test direct)');
      isDomainAllowed = true; // ⚠️ À enlever en production
    } else {
      isDomainAllowed = allowedOrigins.some(allowed => {
        const allowedClean = allowed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
        return domain === allowedClean;
      });
    }
    
    if (!isDomainAllowed) {
      console.log(`❌ Domaine bloqué: ${domain}`);
      return res.status(403).json({ 
        error: 'Domain not authorized for this license',
        yourDomain: domain,
        allowedDomains: allowedOrigins
      });
    }
    
    console.log(`✅ Domaine autorisé: ${domain || 'direct test'}`);
    
    // Retourner la configuration complète
    return res.status(200).json({
      valid: true,
      company: licenseData.company,
      branding: licenseData.branding,
      trade: licenseData.trade,
      calculator: licenseData.calculator,
      questions: licenseData.questions || [],
      pricing: licenseData.pricing,
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
