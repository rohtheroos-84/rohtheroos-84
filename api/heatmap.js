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
        let color = '#03170b'; // empty
        if (count > 0 && count <= 3) color = '#0b4f2a';
        else if (count > 3 && count <= 6) color = '#0f703a';
        else if (count > 6 && count <= 9) color = '#17a34a';
        else if (count > 9) color = '#22e55f';
        
        const x = 30 + week * (cellSize + gap);
        const y = 35 + day * (cellSize + gap);
        
        cells += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${color}"/>`;
      }
    }
    
    // Calculate total for last 12 weeks
    const totalContribs = last12Weeks.reduce((sum, d) => sum + (d ? d.count : 0), 0);
    
    const svg = `
<svg width="220" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="220" height="150" rx="10" fill="#000000" stroke="#00d84a" stroke-width="1.5"/>
  
  <!-- Title -->
  <text x="110" y="22" fill="#e5e7eb" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" font-weight="700" text-anchor="middle">Last 12 Weeks</text>
  
  <!-- Heatmap grid -->
  ${cells}
  
  <!-- Legend -->
  <text x="30" y="140" fill="#9ca3af" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">Less</text>
  <rect x="55" y="132" width="10" height="10" rx="2" fill="#03170b"/>
  <rect x="68" y="132" width="10" height="10" rx="2" fill="#0b4f2a"/>
  <rect x="81" y="132" width="10" height="10" rx="2" fill="#0f703a"/>
  <rect x="94" y="132" width="10" height="10" rx="2" fill="#17a34a"/>
  <rect x="107" y="132" width="10" height="10" rx="2" fill="#22e55f"/>
  <text x="122" y="140" fill="#9ca3af" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10">More</text>
  
  <!-- Total -->
  <text x="190" y="140" fill="#22e55f" font-family="Segoe UI, Ubuntu, sans-serif" font-size="10" font-weight="700" text-anchor="end">${totalContribs}</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const svg = `
<svg width="220" height="150" xmlns="http://www.w3.org/2000/svg">
  <rect width="220" height="150" rx="10" fill="#000000" stroke="#00d84a" stroke-width="1.5"/>
  <text x="110" y="80" fill="#e5e7eb" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Loading heatmap...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
