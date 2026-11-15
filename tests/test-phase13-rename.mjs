import './_guard.mjs';

const BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.cookies = new Map();
    this.csrfToken = '';
  }

  get cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  saveCookies(res, data) {
    if (res.headers.getSetCookie) {
      const setCookies = res.headers.getSetCookie();
      for (const str of setCookies) {
        const [cookiePart] = str.split(';');
        const [k, ...v] = cookiePart.split('=');
        if (k && v.length) {
          const key = k.trim();
          const val = v.join('=').trim();
          this.cookies.set(key, val);
          if (key === 'csrfToken') this.csrfToken = val;
        }
      }
    }
    if (data?.data?.csrfToken) {
      this.csrfToken = data.data.csrfToken;
    }
  }

  async getCsrf() {
    const headers = {};
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(`${BASE_URL}/auth/csrf`, { headers });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return this.csrfToken;
  }

  async post(path, body = {}, auth = true) {
    if (auth && !this.csrfToken) await this.getCsrf();
    const headers = { 'Content-Type': 'application/json' };
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }

  async put(path, body = {}) {
    if (!this.csrfToken) await this.getCsrf();
    const headers = { 'Content-Type': 'application/json' };
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }

  async get(path) {
    const headers = {};
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(`${BASE_URL}${path}`, { headers });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }

  async del(path, body = {}) {
    if (!this.csrfToken) await this.getCsrf();
    const headers = { 'Content-Type': 'application/json' };
    const cookie = this.cookieHeader;
    if (cookie) headers['Cookie'] = cookie;
    if (this.csrfToken) headers['X-CSRF-Token'] = this.csrfToken;

    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    this.saveCookies(res, data);
    return { status: res.status, data };
  }
}

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/health`).catch(() => fetch(`${BASE_URL}/auth/csrf`));
      if (res && res.status) return true;
    } catch {}
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Server did not become ready in time');
}

async function runTest() {
  console.log('Testing Subject Rename & Cascading Update...\n');
  await waitForServer();
  console.log('✔ Connected to server on port 5000');
  const client = new ApiClient();
  const testEmail = `rename-test-${Date.now()}@example.com`;
  const password = 'StrongPassword123!';

  // 1. Register test user
  const regRes = await client.post('/auth/register', {
    name: 'Rename Tester',
    email: testEmail,
    password,
    ageBand: '18_plus',
  }, false);

  if (regRes.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(regRes.data)}`);
  }
  console.log('✔ Registered test user');

  // 2. Add initial subject
  const addSubjRes = await client.put('/users/profile', {
    subjects: [{ name: 'Linear Algebra', color: '#2563EB' }],
  });
  if (addSubjRes.status !== 200) {
    throw new Error(`Add subject failed: ${JSON.stringify(addSubjRes.data)}`);
  }
  console.log('✔ Added subject "Linear Algebra"');

  // 3. Create Task with category "Linear Algebra"
  const taskRes = await client.post('/tasks', {
    title: 'Matrix decomposition notes',
    category: 'Linear Algebra',
    priority: 'High',
  });
  const taskId = taskRes.data?.data?.task?._id || taskRes.data?.task?._id;
  console.log('✔ Created task linked to "Linear Algebra"', taskId);

  // 4. Create StudySession with category "Linear Algebra"
  const sessionRes = await client.post('/study-sessions', {
    category: 'Linear Algebra',
    duration: 30,
    startTime: new Date(Date.now() - 1800000).toISOString(),
    endTime: new Date().toISOString(),
    efficiencyScore: 85,
  });
  console.log('✔ Created study session linked to "Linear Algebra"');

  // 5. Create TimetableSlot with subject "Linear Algebra"
  const slotRes = await client.post('/timetable', {
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:00',
    subject: 'Linear Algebra',
  });
  console.log('✔ Created timetable slot linked to "Linear Algebra"');

  // 6. Create Note with folder "Linear Algebra"
  const noteRes = await client.post('/notes', {
    title: 'Eigenvalues and Eigenvectors',
    folder: 'Linear Algebra',
    content: 'det(A - lambda*I) = 0',
  });
  console.log('✔ Created note linked to "Linear Algebra"');

  // 7. Perform Subject Rename: "Linear Algebra" -> "Advanced Linear Algebra"
  console.log('\nInvoking POST /api/users/subjects/rename ...');
  const renameRes = await client.post('/users/subjects/rename', {
    oldName: 'Linear Algebra',
    newName: 'Advanced Linear Algebra',
  });

  if (renameRes.status !== 200) {
    throw new Error(`Subject rename failed: ${JSON.stringify(renameRes.data)}`);
  }
  console.log('✔ Rename endpoint returned 200 OK');

  // 8. Verify cascade across all entities
  const meRes = await client.get('/auth/me');
  const updatedUser = meRes.data?.data?.user;
  const hasNewSubj = updatedUser.subjects.some(s => s.name === 'Advanced Linear Algebra');
  const hasOldSubj = updatedUser.subjects.some(s => s.name === 'Linear Algebra');
  console.log('✔ User subjects list updated:', { hasNewSubj, hasOldSubj });
  if (!hasNewSubj || hasOldSubj) throw new Error('User subjects array did not update correctly!');

  const tasksRes = await client.get('/tasks');
  const task = (tasksRes.data?.data?.tasks || tasksRes.data?.tasks || []).find(t => t._id === taskId);
  console.log('✔ Cascaded Task category:', task?.category);
  if (task?.category !== 'Advanced Linear Algebra') throw new Error('Task category did not cascade!');

  const slotsRes = await client.get('/timetable');
  const slots = slotsRes.data?.data?.slots || slotsRes.data?.slots || [];
  const slot = slots.find(s => s.subject === 'Advanced Linear Algebra');
  console.log('✔ Cascaded Timetable slot subject:', slot?.subject);
  if (!slot) throw new Error('Timetable slot subject did not cascade!');

  const notesRes = await client.get('/notes');
  const notes = notesRes.data?.data?.notes || notesRes.data?.notes || [];
  const note = notes.find(n => n.folder === 'Advanced Linear Algebra');
  console.log('✔ Cascaded Note folder:', note?.folder);
  if (!note) throw new Error('Note folder did not cascade!');

  // 9. Clean up test user
  await client.del('/users/account', { password });
  console.log('\n✔ Cleaned up test user');
  console.log('🎉 ALL SUBJECT RENAME & CASCADE ASSERTIONS PASSED!\n');
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
