const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { username = 'rohtheroos-84' } = req.query;
  
  try {
    // Fetch contribution data
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}`);
    const data = await response.json();
    
    // Calculate total contributions
    let total = 0;
    if (data.total) {
      total = Object.values(data.total).reduce((sum, val) => sum + val, 0);
    }
    
    // Define milestones
    const milestones = [100, 250, 500, 1000, 2500, 5000, 10000];
    let nextMilestone = milestones.find(m => m > total) || total + 1000;
    let prevMilestone = milestones.filter(m => m <= total).pop() || 0;
    
    // Calculate progress
    const progress = ((total - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
    const progressWidth = Math.min(progress, 100) * 2.2; // Scale to 220px max
    
    const svg = `
<svg width="280" height="130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#16c43e" />
      <stop offset="100%" stop-color="#22e55f" />
    </linearGradient>
  </defs>
  
  <rect width="280" height="130" rx="10" fill="#000000" stroke="#00d84a" stroke-width="1.5"/>
  
  <!-- Title -->
  <text x="140" y="25" fill="#e5e7eb" font-family="Segoe UI, Ubuntu, sans-serif" font-size="13" font-weight="700" text-anchor="middle">🏅 Contribution Milestone</text>
  
  <!-- Current count -->
  <text x="140" y="55" fill="#22e55f" font-family="Segoe UI, Ubuntu, sans-serif" font-size="40" font-weight="700" text-anchor="middle">${total.toLocaleString()}</text>
  <text x="140" y="72" fill="#9ca3af" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="middle">total contributions</text>
  
  <!-- Progress bar background -->
  <rect x="25" y="88" width="230" height="12" rx="6" fill="#111827"/>
  
  <!-- Progress bar fill -->
  <rect x="25" y="88" width="${progressWidth}" height="12" rx="6" fill="url(#progressGrad)"/>
  
  <!-- Milestone labels -->
  <text x="25" y="119" fill="#9ca3af" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">${prevMilestone.toLocaleString()}</text>
  <text x="255" y="119" fill="#22e55f" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="end">${nextMilestone.toLocaleString()}</text>
  <text x="140" y="119" fill="#d1d5db" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="middle">${Math.round(progress)}% to next</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const svg = `
<svg width="280" height="130" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="130" rx="10" fill="#000000" stroke="#00d84a" stroke-width="1.5"/>
  <text x="140" y="70" fill="#e5e7eb" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Loading milestone...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
