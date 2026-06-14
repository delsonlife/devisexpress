export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { coordinates } = req.body;
    const ORS_KEY = '5b3ce3597851110001cf6248a2e2b44aa88e41db9c515d4258e8c668';
    
    console.log('Coordinates received:', coordinates);
    
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ORS_KEY
      },
      body: JSON.stringify({ 
        coordinates: coordinates,
        format: 'json'
      })
    });
    
    const data = await response.json();
    console.log('ORS response:', data);
    
    if (!response.ok) {
      console.error('ORS error:', data);
      return res.status(response.status).json({ error: data.error || 'ORS request failed' });
    }
    
    if (!data.routes || !data.routes[0]) {
      console.error('No routes found in response:', data);
      return res.status(500).json({ error: 'No routes found' });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
