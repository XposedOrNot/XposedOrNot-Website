(function () {
  if (!('modelContext' in navigator) || typeof navigator.modelContext.provideContext !== 'function') {
    return;
  }

  const API = 'https://api.xposedornot.com/v1';
  const MONTHS = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };

  async function jsonGet(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: text }; }
  }

  function clampLimit(value, fallback, max) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) { return fallback; }
    return Math.max(1, Math.min(parsed, max));
  }

  function feedTime(row) {
    const parts = String((row && row.date) || '').split('-');
    if (parts.length !== 3 || !(parts[1] in MONTHS)) { return 0; }
    const time = Date.UTC(parseInt(parts[0], 10), MONTHS[parts[1]], parseInt(parts[2], 10));
    return Number.isNaN(time) ? 0 : time;
  }

  navigator.modelContext.provideContext({
    tools: [
      {
        name: 'check_email_breaches',
        description: 'Check whether an email address appears in the XposedOrNot index of known public data breaches. Returns the list of breach names only. Never returns passwords.',
        inputSchema: {
          type: 'object',
          properties: { email: { type: 'string', format: 'email', description: 'Email address to check for breaches' } },
          required: ['email']
        },
        execute: async ({ email }) => jsonGet(`${API}/check-email/${encodeURIComponent(email)}`)
      },
      {
        name: 'get_breach_analytics',
        description: 'Get a detailed breach history for one email address: the breaches it appeared in with dates and descriptions, exposure broken down by industry and by year, risk scoring, and any paste exposure. Never returns passwords.',
        inputSchema: {
          type: 'object',
          properties: { email: { type: 'string', format: 'email', description: 'Email address to get analytics for' } },
          required: ['email']
        },
        execute: async ({ email }) => jsonGet(`${API}/breach-analytics?email=${encodeURIComponent(email)}`)
      },
      {
        name: 'list_breaches',
        description: 'List breaches in the XposedOrNot catalog, optionally filtered by the breached company domain or by a specific breach ID. Returns breach name, date, industry, record count, categories of data exposed and a reference URL.',
        inputSchema: {
          type: 'object',
          properties: {
            domain: { type: 'string', description: 'Optional domain of the breached company, for example adobe.com' },
            breach_id: { type: 'string', description: 'Optional specific breach identifier, for example Adobe' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 25, description: 'Maximum breaches to return, default 25' }
          },
          required: []
        },
        execute: async ({ domain, breach_id, limit } = {}) => {
          const max = clampLimit(limit, 25, 100);
          const params = new URLSearchParams();
          if (domain) { params.set('domain', domain); }
          if (breach_id) { params.set('breach_id', breach_id); }
          const query = params.toString();
          const result = await jsonGet(query ? `${API}/breaches?${query}` : `${API}/breaches`);
          const rows = result.data && result.data.exposedBreaches;
          if (!Array.isArray(rows)) { return result; }
          const total = rows.length;
          let trimmed = rows.slice(0, max);
          if (!breach_id) {
            trimmed = trimmed.map((row) => {
              const compact = Object.assign({}, row);
              delete compact.exposureDescription;
              return compact;
            });
          }
          result.data.exposedBreaches = trimmed;
          if (total > max) {
            result.data.message = `Showing ${max} of ${total} breaches. Filter by domain or breach_id, or raise limit (max 100), to narrow results.`;
          }
          return result;
        }
      },
      {
        name: 'domain_breach_summary',
        description: 'Get an aggregate breach summary for a domain, including the number of breaches, affected email accounts, pastes, and the most recent breach date. Returns only counts, not individual email addresses.',
        inputSchema: {
          type: 'object',
          properties: { domain: { type: 'string', description: 'Domain to summarize breaches for' } },
          required: ['domain']
        },
        execute: async ({ domain }) => jsonGet(`${API}/domain-breach-summary?d=${encodeURIComponent(domain)}`)
      },
      {
        name: 'get_breach_metrics',
        description: 'Get system-wide breach statistics: total breaches and records indexed, breaches per year and industry, the largest and most recent breaches, and when the latest breach was added.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        execute: async () => jsonGet(`${API}/metrics/detailed`)
      },
      {
        name: 'get_recent_breaches',
        description: 'Get the breaches most recently added to XposedOrNot, newest first. Returns title, date, a short summary and a URL for each.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Maximum breaches to return, default 10' }
          },
          required: []
        },
        execute: async ({ limit } = {}) => {
          const max = clampLimit(limit, 10, 50);
          const result = await jsonGet(`${API}/analytics/pulse`);
          const rows = result.data && result.data.data;
          if (!Array.isArray(rows)) { return result; }
          const sorted = rows.slice().sort((a, b) => feedTime(b) - feedTime(a));
          const total = sorted.length;
          result.data.data = sorted.slice(0, max);
          if (total > max) {
            result.data.message = `Showing the ${max} most recent of ${total} breaches. Raise limit (max 50) to see more.`;
          }
          return result;
        }
      }
    ]
  });
})();
