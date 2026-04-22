const fetch = require('node-fetch');

// Using counterapi.dev - free, reliable, counts every hit
module.exports = async (req, res) => {
  const { username = 'rohtheroos-84' } = req.query;
  const rawBase = req.query.base ?? req.query.offset;
  const baseParam = rawBase === undefined ? NaN : Number.parseInt(rawBase, 10);
  const defaultBase = username === 'rohtheroos-84' ? 406 : 0;
  const baseViews = Number.isFinite(baseParam) ? Math.max(baseParam, 0) : defaultBase;
  const namespace = 'github-profile-views';
  
  // Set headers to prevent GitHub camo caching
  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  let views = 0;
  let counterApiCount = 0;
  
  try {
    // Increment and get count from counterapi.dev
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const countRes = await fetch(`https://api.counterapi.dev/v1/${namespace}/${username}/up`, {
      signal: controller.signal
    });
    clearTimeout(timeout);
    
    const countData = await countRes.json();
    counterApiCount = Number.parseInt(countData.count, 10) || 0;
  } catch (error) {
    // If API fails, try to get current count without incrementing
    try {
      const countRes = await fetch(`https://api.counterapi.dev/v1/${namespace}/${username}`);
      const countData = await countRes.json();
      counterApiCount = Number.parseInt(countData.count, 10) || 0;
    } catch (e) {
      counterApiCount = 0;
    }
  }

  if (counterApiCount > 0) {
    views = counterApiCount;
  } else {
    // Fallback provider when counterapi is unavailable.
    try {
      const fallbackPath = encodeURIComponent(`profile-readme-kappa-${username}`);
      const fallbackRes = await fetch(`https://api.visitorbadge.io/api/visitors?path=${fallbackPath}`);
      const fallbackSvg = await fallbackRes.text();
      const match = fallbackSvg.match(/VISITORS:\s*([0-9,]+)/i);
      const fallbackCount = match ? Number.parseInt(match[1].replace(/,/g, ''), 10) : 0;
      views = Math.max(baseViews + (fallbackCount || 0), baseViews);
    } catch (fallbackError) {
      // Keep a stable non-zero floor if every provider fails.
      views = baseViews;
    }
  }

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

  res.status(200).send(svg);
};
