const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { username = 'rohtheroos-84' } = req.query;
  
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  let dnaData = [];
  
  try {
    // Fetch user's repos to generate unique pattern
    const reposRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=30&sort=updated`);
    const repos = await reposRes.json();
    
    // Generate DNA from repo data
    repos.forEach((repo, i) => {
      if (repo.name) {
        dnaData.push({
          char: repo.name.charCodeAt(0) % 26,
          stars: repo.stargazers_count || 0,
          size: repo.size || 0,
          lang: repo.language || 'Unknown'
        });
      }
    });
  } catch (e) {
    // Fallback pattern
    for (let i = 0; i < 20; i++) {
      dnaData.push({ char: i, stars: 0, size: 100, lang: 'Code' });
    }
  }

  // Color palette (green theme)
  const colors = ['#238636', '#2ea043', '#3fb950', '#56d364', '#7ee787'];
  
  // Generate DNA helix strands
  let leftStrand = '';
  let rightStrand = '';
  let bridges = '';
  
  const width = 400;
  const height = 200;
  const centerX = width / 2;
  const amplitude = 60;
  const segments = Math.min(dnaData.length, 20);
  
  for (let i = 0; i < segments; i++) {
    const y = 20 + (i * (height - 40) / segments);
    const phase = (i / segments) * Math.PI * 2;
    
    const leftX = centerX - amplitude * Math.sin(phase);
    const rightX = centerX + amplitude * Math.sin(phase);
    
    const colorIdx = dnaData[i]?.char % colors.length || 0;
    const nodeSize = 4 + (dnaData[i]?.stars || 0) * 0.5;
    const clampedSize = Math.min(nodeSize, 10);
    
    // Left strand node
    leftStrand += `<circle cx="${leftX}" cy="${y}" r="${clampedSize}" fill="${colors[colorIdx]}" opacity="0.9">
      <animate attributeName="opacity" values="0.9;0.5;0.9" dur="${2 + (i % 3)}s" repeatCount="indefinite"/>
    </circle>`;
    
    // Right strand node
    rightStrand += `<circle cx="${rightX}" cy="${y}" r="${clampedSize}" fill="${colors[(colorIdx + 2) % colors.length]}" opacity="0.9">
      <animate attributeName="opacity" values="0.5;0.9;0.5" dur="${2 + (i % 3)}s" repeatCount="indefinite"/>
    </circle>`;
    
    // Bridge connecting strands
    if (i % 2 === 0) {
      bridges += `<line x1="${leftX}" y1="${y}" x2="${rightX}" y2="${y}" stroke="${colors[colorIdx]}" stroke-width="2" opacity="0.4"/>`;
    }
  }
  
  // Draw connecting lines for strands
  let leftPath = 'M ';
  let rightPath = 'M ';
  
  for (let i = 0; i < segments; i++) {
    const y = 20 + (i * (height - 40) / segments);
    const phase = (i / segments) * Math.PI * 2;
    const leftX = centerX - amplitude * Math.sin(phase);
    const rightX = centerX + amplitude * Math.sin(phase);
    
    if (i === 0) {
      leftPath += `${leftX} ${y}`;
      rightPath += `${rightX} ${y}`;
    } else {
      leftPath += ` L ${leftX} ${y}`;
      rightPath += ` L ${rightX} ${y}`;
    }
  }

  const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0d1117;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#161b22;stop-opacity:1" />
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="${width}" height="${height}" rx="10" fill="url(#bgGrad)" stroke="#238636" stroke-width="2"/>
  
  <!-- Title -->
  <text x="20" y="25" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="600">CODE DNA</text>
  <text x="${width - 20}" y="25" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="9" text-anchor="end">@${username}</text>
  
  <!-- DNA Helix -->
  <g filter="url(#glow)" transform="translate(0, 10)">
    <!-- Strand paths -->
    <path d="${leftPath}" fill="none" stroke="#238636" stroke-width="2" opacity="0.6"/>
    <path d="${rightPath}" fill="none" stroke="#3fb950" stroke-width="2" opacity="0.6"/>
    
    <!-- Bridges -->
    ${bridges}
    
    <!-- Nodes -->
    ${leftStrand}
    ${rightStrand}
  </g>
  
  <!-- Subtitle -->
  <text x="${width / 2}" y="${height - 10}" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="9" text-anchor="middle">unique fingerprint</text>
</svg>`;

  res.status(200).send(svg);
};
