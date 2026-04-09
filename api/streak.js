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

function formatDateShort(dateString) {
  if (!dateString) return '--';
  const date = parseDate(dateString);
  if (Number.isNaN(date.getTime())) return '--';
  const month = MONTHS[date.getUTCMonth()];
  const day = date.getUTCDate();
  return `${month} ${day}`;
}

function formatDateWithOptionalYear(dateString, includeYear) {
  return includeYear ? formatDate(dateString) : formatDateShort(dateString);
}

function formatRange(start, end, options = {}) {
  const { shortCurrentYearRange = false } = options;
  if (!start || !end) return '--';

  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '--';

  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear();
  const currentYear = new Date().getUTCFullYear();
  const bothCurrentYear = startDate.getUTCFullYear() === currentYear && endDate.getUTCFullYear() === currentYear;

  if (shortCurrentYearRange && bothCurrentYear) {
    return `${formatDateShort(start)} - ${formatDateShort(end)}`;
  }

  if (sameYear) {
    return `${formatDate(start)} - ${formatDateShort(end)}`;
  }

  return `${formatDateWithOptionalYear(start, true)} - ${formatDateWithOptionalYear(end, true)}`;
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
  const borderStroke = hideBorder ? 'transparent' : '#238636';

  const currentRange = stats.currentStreak > 0
    ? formatRange(stats.currentStart, stats.currentEnd, { shortCurrentYearRange: true })
    : 'No active streak';

  const longestRange = stats.longestStreak > 0
    ? formatRange(stats.longestStart, stats.longestEnd)
    : '--';

  const totalRange = stats.firstContributionDate
    ? `${formatDate(stats.firstContributionDate)} - Present`
    : '--';

  return `
<svg width="500" height="180" viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub streak stats for ${username}">
  <rect width="500" height="180" rx="10" fill="#0d1117" stroke="${borderStroke}" stroke-width="2"/>

  <line x1="166.67" y1="20" x2="166.67" y2="160" stroke="#30363d" stroke-width="1"/>
  <line x1="333.33" y1="20" x2="333.33" y2="160" stroke="#30363d" stroke-width="1"/>

  <text x="83.33" y="82" fill="#9ae6b4" font-family="Segoe UI, Ubuntu, sans-serif" font-size="41" font-weight="700" text-anchor="middle">${stats.total.toLocaleString()}</text>
  <text x="83.33" y="116" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="500" text-anchor="middle">Total Contributions</text>
  <text x="83.33" y="144" fill="#9be9a8" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${totalRange}</text>

  <circle cx="250" cy="64" r="40" fill="none" stroke="#39d353" stroke-width="4"/>
  <path d="M250 16 C246.5 20.8 246.3 25.2 250.2 28.8 C254.5 25.7 255 20.8 251.4 16.3" fill="none" stroke="#39d353" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M250.2 20.5 C248.8 22.5 248.8 24.5 250.4 26" fill="none" stroke="#39d353" stroke-width="2" stroke-linecap="round"/>
  <text x="250" y="82" fill="#9ae6b4" font-family="Segoe UI, Ubuntu, sans-serif" font-size="41" font-weight="700" text-anchor="middle">${stats.currentStreak}</text>
  <text x="250" y="132" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="600" text-anchor="middle">Current Streak</text>
  <text x="250" y="156" fill="#9be9a8" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${currentRange}</text>

  <text x="416.67" y="82" fill="#9ae6b4" font-family="Segoe UI, Ubuntu, sans-serif" font-size="41" font-weight="700" text-anchor="middle">${stats.longestStreak.toLocaleString()}</text>
  <text x="416.67" y="116" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="500" text-anchor="middle">Longest Streak</text>
  <text x="416.67" y="144" fill="#9be9a8" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="500" text-anchor="middle">${longestRange}</text>
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
<svg width="500" height="180" viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg">
  <rect width="500" height="180" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  <text x="250" y="94" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="16" text-anchor="middle">Loading streak stats...</text>
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.status(200).send(fallback);
  }
};