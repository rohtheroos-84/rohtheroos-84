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
    
    // Trophy icon based on milestone
    let trophy = '🎯';
    if (total >= 5000) trophy = '🏆';
    else if (total >= 2500) trophy = '🥇';
    else if (total >= 1000) trophy = '🥈';
    else if (total >= 500) trophy = '🥉';
    else if (total >= 250) trophy = '🎖️';
    
    const svg = `
<svg width="280" height="130" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#238636" />
      <stop offset="100%" style="stop-color:#39d353" />
    </linearGradient>
  </defs>
  
  <rect width="280" height="130" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  
  <!-- Title -->
  <text x="140" y="25" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">${trophy} Contribution Milestone</text>
  
  <!-- Current count -->
  <text x="140" y="55" fill="#238636" font-family="Segoe UI, Ubuntu, sans-serif" font-size="24" font-weight="bold" text-anchor="middle">${total.toLocaleString()}</text>
  <text x="140" y="70" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="middle">total contributions</text>
  
  <!-- Progress bar background -->
  <rect x="25" y="85" width="230" height="12" rx="6" fill="#161b22"/>
  
  <!-- Progress bar fill -->
  <rect x="25" y="85" width="${progressWidth}" height="12" rx="6" fill="url(#progressGrad)"/>
  
  <!-- Milestone labels -->
  <text x="25" y="115" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">${prevMilestone.toLocaleString()}</text>
  <text x="255" y="115" fill="#39d353" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="end">${nextMilestone.toLocaleString()}</text>
  <text x="140" y="115" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" text-anchor="middle">${Math.round(progress)}% to next</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const svg = `
<svg width="280" height="130" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="130" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  <text x="140" y="70" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Loading milestone...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
