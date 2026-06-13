import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
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
    const { license, leadData, quoteData, domain } = req.body;
    
    // Charger la licence pour obtenir l'email de destination
    const licensesPath = path.join(process.cwd(), 'data', 'licenses.json');
    const licensesData = JSON.parse(fs.readFileSync(licensesPath, 'utf8'));
    const licenseData = licensesData[license];
    
    if (!licenseData) {
      return res.status(403).json({ error: 'Invalid license' });
    }
    
    const targetEmail = licenseData.company?.email || licenseData.lead_email;
    
    console.log('📧 Lead reçu pour:', targetEmail);
    console.log('   Nom:', leadData.name);
    console.log('   Email:', leadData.email);
    console.log('   Estimation:', quoteData.lowEstimate, '-', quoteData.highEstimate);
    
    // Ici tu peux ajouter l'envoi d'email via Resend/Brevo
    // Pour l'instant, on stocke juste dans un fichier
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
    let leads = [];
    if (fs.existsSync(leadsPath)) {
      leads = JSON.parse(fs.readFileSync(leadsPath, 'utf8'));
    }
    
    leads.push({
      id: Date.now(),
      license,
      company: licenseData.company?.name,
      lead: leadData,
      quote: quoteData,
      createdAt: new Date().toISOString()
    });
    
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2));
    
    return res.status(200).json({ 
      success: true, 
      message: 'Lead reçu avec succès',
      leadId: Date.now()
    });
    
  } catch (error) {
    console.error('Erreur lead:', error);
    return res.status(500).json({ error: error.message });
  }
}
