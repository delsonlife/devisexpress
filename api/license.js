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
  
  const requestOrigin = req.headers.origin || req.headers.referer || '';
  let domain = requestOrigin.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  if (!license) {
    return res.status(400).json({ error: 'License key required' });
  }

  if (!domain) {
    return res.status(400).json({ error: 'Unable to determine domain' });
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
    
    // Vérification du domaine
    const allowedDomains = licenseData.allowedOrigins || [licenseData.company?.domain || licenseData.domain];
    const isDomainAllowed = allowedDomains.some(allowed => {
      const allowedClean = allowed.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      return domain === allowedClean;
    });
    
    if (!isDomainAllowed) {
      console.log(`❌ Domaine bloqué: ${domain}`);
      return res.status(403).json({ 
        error: 'Domain not authorized for this license',
        yourDomain: domain,
        allowedDomains: allowedDomains
      });
    }
    
    console.log(`✅ Domaine autorisé: ${domain} | Licence: ${license} | Métier: ${licenseData.trade || 'unknown'}`);
    
    // Retourner la configuration complète (sans les prix si on veut les cacher)
    return res.status(200).json({
      valid: true,
      company: licenseData.company,
      branding: licenseData.branding,
      trade: licenseData.trade,
      calculator: licenseData.calculator,
      questions: licenseData.questions || [],
      timestamp: Date.now()
    });
    
  } catch (error) {
    console.error('License verification error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
