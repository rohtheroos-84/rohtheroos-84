const fetch = require('node-fetch');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDate(dateString) {
  // Force UTC to avoid timezone drift when calculating day differences.
  return new Date(`${dateString}T00:00:00Z`);
}

function formatDate(dateString) {
  if (!dateString) return '--';
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month} ${day}, ${year}`;
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildStats(contributions) {
  const sorted = [...contributions]
    .filter((item) => item && item.date)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));

  if (sorted.length === 0) {
    return {
      total: 0,
      currentStreak: 0,
      currentStart: null,
      currentEnd: null,
      longestStreak: 0,
      longestStart: null,
      longestEnd: null,
      firstContributionDate: null
    };
  }

  const total = sorted.reduce((sum, item) => sum + (item.count || 0), 0);
  const contributionMap = new Map(sorted.map((item) => [item.date, item.count || 0]));

  let longestStreak = 0;
  let longestStart = null;
  let longestEnd = null;
  let runLength = 0;
  let runStart = null;

  for (let i = 0; i < sorted.length; i += 1) {
    const item = sorted[i];
    if (item.count > 0) {
      if (runLength === 0) {
        runStart = item.date;
      }

      runLength += 1;

      if (runLength > longestStreak) {
        longestStreak = runLength;
        longestStart = runStart;
        longestEnd = item.date;
      }
    } else {
      runLength = 0;
      runStart = null;
    }
  }

  const firstContribution = sorted.find((item) => item.count > 0);
  const firstContributionDate = firstContribution ? firstContribution.date : null;

  const today = new Date();
  const todayKey = dateKey(today);
  const yesterdayKey = dateKey(addDays(today, -1));

  let currentEnd = null;
  if ((contributionMap.get(todayKey) || 0) > 0) {
    currentEnd = todayKey;
  } else if ((contributionMap.get(yesterdayKey) || 0) > 0) {
    currentEnd = yesterdayKey;
  }

  let currentStreak = 0;
  let currentStart = null;

  if (currentEnd) {
    let cursor = parseDate(currentEnd);
    while ((contributionMap.get(dateKey(cursor)) || 0) > 0) {
      currentStreak += 1;
      currentStart = dateKey(cursor);
      cursor = addDays(cursor, -1);
    }
  }

  return {
    total,
    currentStreak,
    currentStart,
    currentEnd,
    longestStreak,
    longestStart,
    longestEnd,
    firstContributionDate
  };
}

function renderCard(username, stats, hideBorder) {
  const borderStroke = hideBorder ? 'transparent' : '#1f6f3a';

  const currentRange = stats.currentStreak > 0
    ? `${formatDate(stats.currentStart)} - ${formatDate(stats.currentEnd)}`
    : 'No active streak';

  const longestRange = stats.longestStreak > 0
    ? `${formatDate(stats.longestStart)} - ${formatDate(stats.longestEnd)}`
    : '--';

  const totalRange = stats.firstContributionDate
    ? `${formatDate(stats.firstContributionDate)} - Present`
    : '--';

  return `
<svg width="500" height="195" viewBox="0 0 500 195" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub streak stats for ${username}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1220"/>
      <stop offset="100%" stop-color="#0d1117"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#39d353" flood-opacity="0.15"/>
    </filter>
  </defs>

  <rect x="0.5" y="0.5" width="499" height="194" rx="9" fill="url(#bg)" stroke="${borderStroke}"/>

  <line x1="166.67" y1="24" x2="166.67" y2="171" stroke="#263242" stroke-width="1"/>
  <line x1="333.33" y1="24" x2="333.33" y2="171" stroke="#263242" stroke-width="1"/>

  <text x="83.33" y="80" fill="#9bdcb0" font-family="Segoe UI, Ubuntu, sans-serif" font-size="42" font-weight="700" text-anchor="middle">${stats.total.toLocaleString()}</text>
  <text x="83.33" y="116" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="28" text-anchor="middle">Total Contributions</text>
  <text x="83.33" y="147" fill="#39d353" font-family="Segoe UI, Ubuntu, sans-serif" font-size="22" text-anchor="middle">${totalRange}</text>

  <circle cx="250" cy="69" r="40" fill="none" stroke="#39d353" stroke-width="6" filter="url(#softShadow)"/>
  <path d="M250 17 C245 24, 244 28, 246 33 C248 37, 253 39, 257 36 C261 33, 262 27, 259 23 C257 20, 254 18, 250 17 Z" fill="#39d353"/>
  <text x="250" y="80" fill="#b6f2c5" font-family="Segoe UI, Ubuntu, sans-serif" font-size="44" font-weight="700" text-anchor="middle">${stats.currentStreak}</text>
  <text x="250" y="140" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="30" font-weight="600" text-anchor="middle">Current Streak</text>
  <text x="250" y="167" fill="#39d353" font-family="Segoe UI, Ubuntu, sans-serif" font-size="22" text-anchor="middle">${currentRange}</text>

  <text x="416.67" y="80" fill="#9bdcb0" font-family="Segoe UI, Ubuntu, sans-serif" font-size="42" font-weight="700" text-anchor="middle">${stats.longestStreak.toLocaleString()}</text>
  <text x="416.67" y="116" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="28" text-anchor="middle">Longest Streak</text>
  <text x="416.67" y="147" fill="#39d353" font-family="Segoe UI, Ubuntu, sans-serif" font-size="22" text-anchor="middle">${longestRange}</text>
</svg>`;
}

module.exports = async (req, res) => {
  const username = req.query.username || req.query.user || 'rohtheroos-84';
  const hideBorder = String(req.query.hide_border || 'false').toLowerCase() === 'true';

  try {
    const response = await fetch(`https://github-contributions-api.jogruber.de/v4/${username}?y=all`);
    if (!response.ok) {
      throw new Error(`Failed to fetch contributions for ${username}`);
    }

    const data = await response.json();
    const contributions = Array.isArray(data.contributions) ? data.contributions : [];
    const stats = buildStats(contributions);
    const svg = renderCard(username, stats, hideBorder);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const fallback = `
<svg width="500" height="195" viewBox="0 0 500 195" xmlns="http://www.w3.org/2000/svg">
  <rect x="0.5" y="0.5" width="499" height="194" rx="9" fill="#0d1117" stroke="#1f6f3a"/>
  <text x="250" y="95" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="18" text-anchor="middle">Loading streak stats...</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(fallback);
  }
};