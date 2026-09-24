// Local UI QA only. Synthetic data, no real tokens or production database access.
const http = require('node:http');
const id = '11111111-1111-4111-8111-111111111111';
const profile = { user_id: id, username: 'qa-developer', display_name: 'Camille Martin', headline: 'Développeuse full stack · Open source', bio: 'Je transforme mes contributions en preuves vérifiables.\nNext.js, TypeScript et sécurité.', public_links: ['https://github.com/qa-developer', 'https://example.com/portfolio'], is_public: true, avatar_url: null, github_user_id: 123, created_at: '2026-09-24T10:00:00Z', updated_at: '2026-09-24T10:00:00Z' };
const quest = { id: 'docker:qa-developer/project', user_id: id, repository_full_name: 'qa-developer/project', kind: 'docker', xp_reward: 900, started_at: '2026-09-24T10:00:00Z', completed_at: '2026-09-24T12:00:00Z', verified_at: '2026-09-24T12:00:00Z', verified_commit_sha: 'a'.repeat(40), verification_method: 'github_commit_after_start', verification_metadata: { githubLogin: 'qa-developer', newlyCompletedObjectiveIds: ['dockerfile', 'compose'], baselineCompletedObjectiveIds: [], relevantFiles: ['Dockerfile', 'compose.yml'] } };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/qa/sign-in') {
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const access_token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: id, aud: 'authenticated', role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.synthetic`;
    const session = { access_token, token_type: 'bearer', refresh_token: 'synthetic', expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id } };
    res.setHeader('Set-Cookie', `sb-127-auth-token=base64-${encode(session)}; Path=/; HttpOnly; SameSite=Lax`);
    res.writeHead(302, { Location: 'http://localhost:3000/settings/profile' });
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  if (req.method === 'OPTIONS') return res.end();
  if (url.pathname === '/auth/v1/user') return res.end(JSON.stringify({ id, aud: 'authenticated', role: 'authenticated', user_metadata: { user_name: 'qa-developer', provider_id: '123' } }));
  const single = String(req.headers.accept).includes('object');
  let rows = [];
  if (url.pathname.endsWith('/profiles')) {
    if (req.method === 'PATCH') {
      let body = ''; for await (const chunk of req) body += chunk;
      Object.assign(profile, JSON.parse(body));
    }
    const username = url.searchParams.get('username');
    rows = (!username || username === 'eq.qa-developer') && (url.searchParams.get('is_public') !== 'eq.true' || profile.is_public) ? [profile] : [];
  } else if (url.pathname.endsWith('/quest_history')) rows = [quest];
  else if (url.pathname.endsWith('/player_progress')) rows = [{ total_xp: 900 }];
  res.end(JSON.stringify(single ? rows[0] ?? null : rows));
});
server.listen(54329, '127.0.0.1', () => console.log('Synthetic Supabase fixture listening on 54329'));
