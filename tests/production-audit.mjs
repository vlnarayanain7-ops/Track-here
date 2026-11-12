const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';

function createClient() {
  const cookies = new Map();
  let lastRefreshToken = null;

  const cookieHeader = () => Array.from(cookies.entries()).map(([key, value]) => `${key}=${value}`).join('; ');

  async function request(path, { method = 'GET', body, csrf = true, headers = {} } = {}) {
    const requestHeaders = { ...headers };
    if (body !== undefined) requestHeaders['Content-Type'] = 'application/json';
    if (cookies.size) requestHeaders.Cookie = cookieHeader();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrf && cookies.get('csrfToken')) {
      requestHeaders['X-CSRF-Token'] = cookies.get('csrfToken');
    }

    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const setCookies = response.headers.getSetCookie?.() || (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : []);
    for (const rawCookie of setCookies) {
      const [nameValue] = rawCookie.split(';');
      const separator = nameValue.indexOf('=');
      const name = nameValue.slice(0, separator).trim();
      const value = nameValue.slice(separator + 1).trim();
      if (value) cookies.set(name, value);
      else cookies.delete(name);
    }
    if (cookies.get('refreshToken')) lastRefreshToken = cookies.get('refreshToken');
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data, headers: response.headers };
  }

  return {
    request,
    get: (path) => request(path),
    post: (path, body, options) => request(path, { method: 'POST', body, ...options }),
    put: (path, body, options) => request(path, { method: 'PUT', body, ...options }),
    delete: (path, options) => request(path, { method: 'DELETE', ...options }),
    csrf: () => request('/auth/csrf'),
    refreshToken: () => lastRefreshToken,
    setCookie: (name, value) => cookies.set(name, value),
    csrfToken: () => cookies.get('csrfToken'),
  };
}

const results = [];
function check(name, condition, detail = '') {
  results.push({ name, condition, detail });
  console.log(`${condition ? 'PASS' : 'FAIL'} ${name}${detail ? ` — ${detail}` : ''}`);
}

const stamp = Date.now();
const password = 'StrongPassword123!';
const validTimer = { category: 'DSA', activityType: 'Coding', topic: 'Concurrency audit' };

async function register(client, name, email) {
  const csrf = await client.csrf();
  check(`CSRF bootstrap for ${name}`, csrf.status === 200 && Boolean(csrf.data?.data?.csrfToken));
  const response = await client.post('/auth/register', { name, email, password });
  return response;
}

async function run() {
  const a = createClient();
  const b = createClient();
  const emailA = `prod_a_${stamp}@trackhere.test`;
  const emailB = `prod_b_${stamp}@trackhere.test`;

  const noCsrf = await a.post('/auth/register', { name: 'No CSRF', email: `no_csrf_${stamp}@trackhere.test`, password }, { csrf: false });
  check('Rejects state change without CSRF token', noCsrf.status === 403, `status ${noCsrf.status}`);

  const registeredA = await register(a, 'Production A', emailA);
  check('Registration succeeds with CSRF token', registeredA.status === 201, `status ${registeredA.status}`);
  check('Access token is not exposed in registration JSON', !registeredA.data?.data?.accessToken);
  check('Auth cookies are HTTP-only', (registeredA.headers.get('set-cookie') || '').includes('HttpOnly'));
  const registeredB = await register(b, 'Production B', emailB);
  check('Second user registration succeeds', registeredB.status === 201, `status ${registeredB.status}`);

  const malformedTask = await a.post('/tasks', { title: '', priority: 'Urgent' });
  check('Invalid task payload is rejected', malformedTask.status === 400, `status ${malformedTask.status}`);

  const task = await a.post('/tasks', { title: 'private task', priority: 'High' });
  const taskId = task.data?.data?.task?._id;
  check('Creates user-scoped task', task.status === 201 && Boolean(taskId));
  const foreignTaskRead = await b.get(`/tasks/${taskId}`);
  const foreignTaskUpdate = await b.put(`/tasks/${taskId}`, { title: 'stolen' });
  const foreignTaskDelete = await b.delete(`/tasks/${taskId}`);
  check('Foreign user cannot read a task', foreignTaskRead.status === 404, `status ${foreignTaskRead.status}`);
  check('Foreign user cannot update a task', foreignTaskUpdate.status === 404, `status ${foreignTaskUpdate.status}`);
  check('Foreign user cannot delete a task', foreignTaskDelete.status === 404, `status ${foreignTaskDelete.status}`);
  check('Owner task remains after foreign delete', (await a.get(`/tasks/${taskId}`)).status === 200);

  const oldRefresh = a.refreshToken();
  const rotated = await a.post('/auth/refresh', {});
  const freshRefresh = a.refreshToken();
  check('Refresh token rotates successfully', rotated.status === 200 && oldRefresh !== freshRefresh, `status ${rotated.status}`);
  a.setCookie('refreshToken', oldRefresh);
  const replay = await a.post('/auth/refresh', {});
  check('Refresh-token replay is rejected', replay.status === 401, `status ${replay.status}`);
  a.setCookie('refreshToken', freshRefresh);
  const afterReplay = await a.post('/auth/refresh', {});
  check('Replay revokes the token family', afterReplay.status === 401, `status ${afterReplay.status}`);

  // Login again after replay revocation, then exercise timer concurrency.
  await a.csrf();
  const relogin = await a.post('/auth/login', { email: emailA, password });
  check('Login succeeds after replay revocation', relogin.status === 200, `status ${relogin.status}`);
  const [startOne, startTwo] = await Promise.all([a.post('/study-sessions/timer/start', validTimer), a.post('/study-sessions/timer/start', validTimer)]);
  const starts = [startOne, startTwo];
  const started = starts.find((item) => item.status === 201);
  const timerId = started?.data?.data?.session?._id;
  check('Only one simultaneous timer start succeeds', starts.filter((item) => item.status === 201).length === 1 && starts.filter((item) => item.status === 409).length === 1, starts.map((item) => item.status).join(', '));
  const active = await a.get('/study-sessions/timer/active');
  check('Active timer survives API re-query (browser refresh recovery)', active.status === 200 && active.data?.data?.session?._id === timerId);

  const [pauseOne, pauseTwo] = await Promise.all([a.post(`/study-sessions/timer/${timerId}/pause`), a.post(`/study-sessions/timer/${timerId}/pause`)]);
  check('Only one simultaneous pause transition succeeds', [pauseOne, pauseTwo].filter((item) => item.status === 200).length === 1, `${pauseOne.status}, ${pauseTwo.status}`);
  const pausedRefresh = await a.get('/study-sessions/timer/active');
  check('Paused timer survives API re-query', pausedRefresh.data?.data?.session?.timerState?.status === 'paused');
  const wrongOrder = await a.post(`/study-sessions/timer/${timerId}/pause`);
  check('Unexpected duplicate pause is rejected', wrongOrder.status === 400, `status ${wrongOrder.status}`);
  const resumed = await a.post(`/study-sessions/timer/${timerId}/resume`);
  check('Paused timer resumes', resumed.status === 200 && resumed.data?.data?.session?.timerState?.status === 'running');
  const [finishOne, finishTwo] = await Promise.all([a.post(`/study-sessions/timer/${timerId}/finish`, {}), a.post(`/study-sessions/timer/${timerId}/finish`, {})]);
  check('Only one duplicate finish request succeeds', [finishOne, finishTwo].filter((item) => item.status === 200).length === 1, `${finishOne.status}, ${finishTwo.status}`);
  const completed = await a.get(`/study-sessions/${timerId}`);
  check('Finished timer is stored exactly once with non-negative duration', completed.status === 200 && completed.data?.data?.session?.focusDuration >= 0);
  check('No active timer remains after finish', (await a.get('/study-sessions/timer/active')).data?.data?.session === null);

  const note = await a.post('/notes', { title: 'owned note', contentMarkdown: '[bad](javascript:alert(1))' });
  const noteId = note.data?.data?.note?._id;
  check('Creates note for ownership test', note.status === 201 && Boolean(noteId));
  check('Foreign user cannot read note', (await b.get(`/notes/${noteId}`)).status === 404);

  console.log(`\n${results.filter((item) => item.condition).length}/${results.length} production HTTP checks passed.`);
  process.exit(results.every((item) => item.condition) ? 0 : 1);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});