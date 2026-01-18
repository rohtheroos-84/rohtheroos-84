const fetch = require('node-fetch');

// Using CountAPI for persistent view counting
module.exports = async (req, res) => {
  const { username = 'rohtheroos-84' } = req.query;
  
  try {
    // Hit CountAPI to increment and get count
    const countRes = await fetch(`https://api.countapi.xyz/hit/github-profile/${username}`);
    const countData = await countRes.json();
    const views = countData.value || 0;

    const svg = `
<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#238636;stop-opacity:0.3" />
      <stop offset="100%" style="stop-color:#0d1117;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="200" height="120" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  
  <!-- Eye icon -->
  <g transform="translate(80, 25)">
    <ellipse cx="20" cy="12" rx="18" ry="10" fill="none" stroke="#238636" stroke-width="2"/>
    <circle cx="20" cy="12" r="5" fill="#238636"/>
  </g>
  
  <!-- Count -->
  <text x="100" y="75" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${views.toLocaleString()}</text>
  
  <!-- Label -->
  <text x="100" y="100" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Profile Views</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    // Fallback SVG on error
    const svg = `
<svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="120" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  <text x="100" y="65" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="14" text-anchor="middle">Views Loading...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
