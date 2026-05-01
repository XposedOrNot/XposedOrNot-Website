(function () {
  if (!('modelContext' in navigator) || typeof navigator.modelContext.provideContext !== 'function') {
    return;
  }

  const API = 'https://api.xposedornot.com/v1';

  async function jsonGet(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
    catch { return { ok: res.ok, status: res.status, data: text }; }
  }

  navigator.modelContext.provideContext({
    tools: [
      {
        name: 'check_email_breaches',
        description: 'Check if an email address appears in any known data breaches indexed by XposedOrNot.',
        inputSchema: {
          type: 'object',
          properties: { email: { type: 'string', description: 'Email address to check.' } },
          required: ['email']
        },
        execute: async ({ email }) => jsonGet(`${API}/check-email/${encodeURIComponent(email)}`)
      },
      {
        name: 'get_breach_analytics',
        description: 'Detailed breach analytics for an email: risk score, timeline, password security, exposure categories.',
        inputSchema: {
          type: 'object',
          properties: { email: { type: 'string', description: 'Email address to analyze.' } },
          required: ['email']
        },
        execute: async ({ email }) => jsonGet(`${API}/breach-analytics?email=${encodeURIComponent(email)}`)
      },
      {
        name: 'list_breaches',
        description: 'List known data breaches indexed by XposedOrNot, optionally filtered by domain.',
        inputSchema: {
          type: 'object',
          properties: { domain: { type: 'string', description: 'Optional domain filter.' } }
        },
        execute: async ({ domain } = {}) => {
          const url = domain ? `${API}/breaches?domain=${encodeURIComponent(domain)}` : `${API}/breaches`;
          return jsonGet(url);
        }
      }
    ]
  });
})();
