const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { username = 'rohtheroos-84' } = req.query;
  
  try {
    // Fetch contribution data from GitHub
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=last`);
    const data = await response.json();
    
    const contributions = data.contributions || [];
    const last12Weeks = contributions.slice(-84); // Last 12 weeks (84 days)
    
    // Generate heatmap cells
    let cells = '';
    const cellSize = 10;
    const gap = 3;
    
    for (let week = 0; week < 12; week++) {
      for (let day = 0; day < 7; day++) {
        const index = week * 7 + day;
        const contrib = last12Weeks[index];
        const count = contrib ? contrib.count : 0;
        
        // Color intensity based on count
        let color = '#161b22'; // empty
        if (count > 0 && count <= 3) color = '#0e4429';
        else if (count > 3 && count <= 6) color = '#006d32';
        else if (count > 6 && count <= 9) color = '#26a641';
        else if (count > 9) color = '#39d353';
        
        const x = 30 + week * (cellSize + gap);
        const y = 35 + day * (cellSize + gap);
        
        cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
      }
    }
    
    // Calculate total for last 12 weeks
    const totalContribs = last12Weeks.reduce((sum, d) => sum + (d ? d.count : 0), 0);
    
    const svg = `
<svg width="220" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="220" height="150" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  
  <!-- Title -->
  <text x="110" y="22" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" font-weight="bold" text-anchor="middle">Last 12 Weeks</text>
  
  <!-- Heatmap grid -->
  ${cells}
  
  <!-- Legend -->
  <text x="30" y="140" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">Less</text>
  <rect x="55" y="132" width="10" height="10" rx="2" fill="#161b22"/>
  <rect x="68" y="132" width="10" height="10" rx="2" fill="#0e4429"/>
  <rect x="81" y="132" width="10" height="10" rx="2" fill="#006d32"/>
  <rect x="94" y="132" width="10" height="10" rx="2" fill="#26a641"/>
  <rect x="107" y="132" width="10" height="10" rx="2" fill="#39d353"/>
  <text x="122" y="140" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">More</text>
  
  <!-- Total -->
  <text x="190" y="140" fill="#238636" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" font-weight="bold" text-anchor="end">${totalContribs}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const svg = `
<svg width="220" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="220" height="150" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  <text x="110" y="80" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Loading heatmap...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
