const fetch = require('node-fetch');

module.exports = async (req, res) => {
  const { username = 'rohtheroos-84', limit = 5 } = req.query;
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}/events/public?per_page=${limit}`);
    const events = await response.json();
    
    // Parse events into readable format
    const activities = events.slice(0, 5).map(event => {
      let icon = '📌';
      let action = '';
      let repo = event.repo?.name?.split('/')[1] || '';
      
      switch (event.type) {
        case 'PushEvent':
          icon = '⬆️';
          const commits = event.payload?.commits?.length || 0;
          action = `Pushed ${commits} commit${commits > 1 ? 's' : ''} to`;
          break;
        case 'CreateEvent':
          icon = '✨';
          action = `Created ${event.payload?.ref_type || 'repo'}`;
          if (event.payload?.ref) repo = event.payload.ref;
          break;
        case 'PullRequestEvent':
          icon = '🔀';
          action = `${event.payload?.action || 'Updated'} PR in`;
          break;
        case 'IssuesEvent':
          icon = '🔖';
          action = `${event.payload?.action || 'Updated'} issue in`;
          break;
        case 'WatchEvent':
          icon = '⭐';
          action = 'Starred';
          break;
        case 'ForkEvent':
          icon = '🍴';
          action = 'Forked';
          break;
        case 'IssueCommentEvent':
          icon = '💬';
          action = 'Commented on';
          break;
        default:
          action = event.type.replace('Event', '') + ' in';
      }
      
      return { icon, action, repo: repo.substring(0, 20) };
    });
    
    // Generate activity rows
    let rows = '';
    activities.forEach((act, i) => {
      const y = 45 + i * 28;
      rows += `
        <text x="20" y="${y}" font-size="12">${act.icon}</text>
        <text x="40" y="${y}" fill="#8b949e" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11">${act.action}</text>
        <text x="40" y="${y + 13}" fill="#238636" font-family="Segoe UI, Ubuntu, sans-serif" font-size="11" font-weight="bold">${act.repo}</text>
      `;
    });
    
    const height = 45 + activities.length * 28 + 15;
    
    const svg = `
<svg width="280" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="${height}" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  
  <!-- Title -->
  <text x="140" y="25" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">⚡ Recent Activity</text>
  
  <!-- Activity rows -->
  ${rows}
</svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate');
    res.status(200).send(svg);
  } catch (error) {
    const svg = `
<svg width="280" height="100" xmlns="http://www.w3.org/2000/svg">
  <rect width="280" height="100" rx="10" fill="#0d1117" stroke="#238636" stroke-width="2"/>
  <text x="140" y="55" fill="#c9d1d9" font-family="Segoe UI, Ubuntu, sans-serif" font-size="12" text-anchor="middle">Loading activity...</text>
</svg>`;
    res.setHeader('Content-Type', 'image/svg+xml');
    res.status(200).send(svg);
  }
};
