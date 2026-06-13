import roof_v1 from './calculators/roof_v1.js';
import moving_v1 from './calculators/moving_v1.js';
import windows_v1 from './calculators/windows_v1.js';
import fs from 'fs';
import path from 'path';

// Registre des calculateurs
const CALCULATORS = {
  'roof_v1': roof_v1,
  'moving_v1': moving_v1,
  'windows_v1': windows_v1
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Origin');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { license, answers, domain } = req.body;
    
    if (!license) {
      return res.status(401).json({ error: 'License key required' });
    }
    
    // Charger la licence pour connaître le calculateur
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    const licenseData = licensesData[license];
    
    if (!licenseData || !licenseData.active) {
      return res.status(403).json({ error: 'Invalid or inactive license' });
    }
    
    const calculatorName = licenseData.calculator || 'roof_v1';
    const calculator = CALCULATORS[calculatorName];
    
    if (!calculator) {
      console.error(`Calculateur inconnu: ${calculatorName}`);
      return res.status(500).json({ error: 'Calculator not found' });
    }
    
    // Exécuter le calculateur spécifique
    const result = await calculator.calculate(answers, licenseData.pricing, licenseData.coefficients);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Calculation error:', error);
    return res.status(500).json({ error: error.message });
  }
}
