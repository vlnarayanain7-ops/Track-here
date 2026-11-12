const BASE_URL = 'http://127.0.0.1:5000/api';
const stamp = Date.now();
const password = 'ProfileMatrix123!';

function makeClient() {
  const cookies = new Map();
  const cookieHeader = () => Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ');

  async function request(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookies.size) headers.Cookie = cookieHeader();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && cookies.get('csrfToken')) headers['X-CSRF-Token'] = cookies.get('csrfToken');
    const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const raw of response.headers.getSetCookie?.() || (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])) {
      const [pair] = raw.split(';');
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (value) cookies.set(name, value); else cookies.delete(name);
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
  };
}

const profiles = [
  { type: 'NEET', subjects: ['Physics', 'Chemistry', 'Botany', 'Zoology'], category: 'Botany' },
  { type: 'JEE', subjects: ['Physics', 'Chemistry', 'Mathematics'], category: 'Mathematics' },
  { type: 'Competitive Programming', subjects: ['C++', 'DSA', 'Competitive Programming'], category: 'DSA' },
  { type: 'Custom', subjects: ['Spanish', 'Music Theory'], category: 'Music Theory' },
];

let failures = 0;
for (const [index, profile] of profiles.entries()) {
  const client = makeClient();
  const email = `qa_${profile.type.toLowerCase().replace(/[^a-z]+/g, '_')}_${stamp}_${index}@trackhere.test`;
  const assert = (condition, message) => {
    console.log(`${condition ? 'PASS' : 'FAIL'} [${profile.type}] ${message}`);
    if (!condition) failures += 1;
  };

  assert((await client.get('/auth/csrf')).status === 200, 'CSRF bootstrap');
  assert((await client.post('/auth/register', { name: `${profile.type} QA`, email, password })).status === 201, 'registration');
  const subjects = profile.subjects.map((name) => ({ name, color: '#63B6D7', icon: 'BookOpen', chapters: [] }));
  const saved = await client.put('/users/profile', { preparationType: profile.type, subjects, timezone: 'America/Los_Angeles', dailyStudyGoal: 150, onboardingCompleted: true });
  assert(saved.status === 200 && saved.data?.data?.user?.subjects?.map((item) => item.name).join('|') === profile.subjects.join('|'), 'profile-specific subjects persist');
  const session = await client.post('/study-sessions', { category: profile.category, activityType: 'Practice', topic: `${profile.category} fixture`, date: new Date().toISOString(), focusDuration: 30 });
  assert(session.status === 201 && session.data?.data?.session?.category === profile.category, 'manual session accepts configured subject');
  const timer = await client.post('/study-sessions/timer/start', { category: profile.category, activityType: 'Practice', topic: `${profile.category} timer fixture` });
  const timerId = timer.data?.data?.session?._id;
  assert(timer.status === 201 && Boolean(timerId), 'timer accepts configured subject');
  if (timerId) assert((await client.post(`/study-sessions/timer/${timerId}/finish`, {})).status === 200, 'timer finishes');
  const listed = await client.get(`/study-sessions?category=${encodeURIComponent(profile.category)}`);
  assert(listed.status === 200 && (listed.data?.data?.sessions || []).every((item) => item.category === profile.category), 'subject filter returns only subject records');
}

console.log(`${failures === 0 ? 'PROFILE MATRIX PASSED' : `PROFILE MATRIX FAILED: ${failures} checks`}`);
process.exit(failures ? 1 : 0);