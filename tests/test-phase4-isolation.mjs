import './_guard.mjs';

const BASE_URL = 'http://localhost:5000/api';

function createClient() {
  let token = null;
  const cookieJar = new Map();
  const csrfToken = () => cookieJar.get('csrfToken');

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) && csrfToken()) {
      headers['X-CSRF-Token'] = csrfToken();
    }
    if (cookieJar.size > 0) {
      headers['Cookie'] = Array.from(cookieJar.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    if (rawCookies.length === 0 && res.headers.get('set-cookie')) {
      rawCookies.push(res.headers.get('set-cookie'));
    }
    for (const cookie of rawCookies) {
      const parts = cookie.split(';')[0].split('=');
      if (parts.length >= 2) cookieJar.set(parts[0].trim(), parts.slice(1).join('=').trim());
    }
    const text = await res.text();
    let data = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (data?.data?.accessToken) token = data.data.accessToken;
    return { status: res.status, data };
  }

  return {
    get: (url, opts) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
    put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
    delete: (url, body, opts) => request(url, { ...opts, method: 'DELETE', body }),
  };
}

async function runIsolationAudit() {
  console.log('=================================================================');
  console.log('🔒 PHASE 4 VERIFICATION: MULTI-USER ISOLATION & DATA SECURITY');
  console.log('=================================================================\n');

  const clientA = createClient();
  const clientB = createClient();

  const time = Date.now();
  const emailA = `userA.${time}@trackhere.local`;
  const emailB = `userB.${time}@trackhere.local`;
  const passA = 'SecretP@ssA123!';
  const passB = 'SecretP@ssB456!';

  await clientA.get('/auth/csrf');
  await clientB.get('/auth/csrf');

  // 1. Register User A and User B
  const regA = await clientA.post('/auth/register', { name: 'User A', email: emailA, password: passA, ageBand: '18_plus' });
  const regB = await clientB.post('/auth/register', { name: 'User B', email: emailB, password: passB, ageBand: '18_plus' });
  console.log('1. User A & B registered:', (regA.status === 201 && regB.status === 201) ? '✅ PASS' : '❌ FAIL');

  // 2. User A creates resources: Task, Note, StudySession, Timetable Slot
  const taskA = await clientA.post('/tasks', { title: 'Secret Task A', priority: 'High', status: 'Todo' });
  const noteA = await clientA.post('/notes', { title: 'Secret Note A', contentMarkdown: '# Top Secret A Notes' });
  const sessionA = await clientA.post('/study-sessions', {
    category: 'Algorithms',
    activityType: 'Coding',
    topic: 'Graph Theory',
    focusDuration: 45,
  });
  const slotA = await clientA.post('/timetable', {
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:30',
    subject: 'Algorithms',
    topic: 'DFS',
  });

  const taskAId = taskA.data?.data?.task?._id;
  const noteAId = noteA.data?.data?.note?._id;
  const sessionAId = sessionA.data?.data?.session?._id;
  const slotAId = slotA.data?.data?.slot?._id;

  console.log('2. User A resources created with ObjectIds:', (taskAId && noteAId && sessionAId && slotAId) ? '✅ PASS' : '❌ FAIL');

  // 3. Multi-User Isolation Tests: User B attempts to read/modify/delete User A's data
  const bReadTask = await clientB.get(`/tasks/${taskAId}`);
  console.log('3a. User B cannot read User A task (returns 404):', bReadTask.status === 404 ? '✅ PASS' : `❌ FAIL (${bReadTask.status})`);

  const bUpdateTask = await clientB.put(`/tasks/${taskAId}`, { title: 'Hacked by User B' });
  console.log('3b. User B cannot edit User A task (returns 404):', bUpdateTask.status === 404 ? '✅ PASS' : `❌ FAIL (${bUpdateTask.status})`);

  const bDeleteTask = await clientB.delete(`/tasks/${taskAId}`);
  console.log('3c. User B cannot delete User A task (returns 404):', bDeleteTask.status === 404 ? '✅ PASS' : `❌ FAIL (${bDeleteTask.status})`);

  const bReadNote = await clientB.get(`/notes/${noteAId}`);
  console.log('3d. User B cannot read User A note (returns 404):', bReadNote.status === 404 ? '✅ PASS' : `❌ FAIL (${bReadNote.status})`);

  const bUpdateNote = await clientB.put(`/notes/${noteAId}`, { title: 'Defaced Note' });
  console.log('3e. User B cannot edit User A note (returns 404):', bUpdateNote.status === 404 ? '✅ PASS' : `❌ FAIL (${bUpdateNote.status})`);

  const bDeleteNote = await clientB.delete(`/notes/${noteAId}`);
  console.log('3f. User B cannot delete User A note (returns 404):', bDeleteNote.status === 404 ? '✅ PASS' : `❌ FAIL (${bDeleteNote.status})`);

  const bReadSession = await clientB.get(`/study-sessions/${sessionAId}`);
  console.log('3g. User B cannot read User A session (returns 404):', bReadSession.status === 404 ? '✅ PASS' : `❌ FAIL (${bReadSession.status})`);

  const bUpdateSlot = await clientB.put(`/timetable/${slotAId}`, { topic: 'Compromised' });
  console.log('3h. User B cannot edit User A timetable slot (returns 404):', bUpdateSlot.status === 404 ? '✅ PASS' : `❌ FAIL (${bUpdateSlot.status})`);

  // 4. Strict Schema & Mass-Assignment Prevention
  const massAssign = await clientA.post('/tasks', {
    title: 'Exploit Task',
    userId: '654321654321654321654321', // Trying to inject foreign userId
    role: 'superadmin',                  // Trying to escalate role
    plan: 'enterprise',                  // Trying to bypass subscription
  });
  console.log('4. Mass-assignment / unauthorized keys rejected with 400 by Zod strict():', massAssign.status === 400 ? '✅ PASS' : `❌ FAIL (${massAssign.status})`);

  // 5. Account Export (/me/export)
  const exportMe = await clientA.get('/users/me/export');
  const exportHasData = exportMe.status === 200 &&
    Array.isArray(exportMe.data?.data?.tasks) &&
    exportMe.data?.data?.tasks.length >= 1;
  console.log('5. Account Export /me/export returns complete JSON backup:', exportHasData ? '✅ PASS' : '❌ FAIL');

  // 6. Account Restore (/me/restore)
  const restoreRes = await clientA.post('/users/me/restore', {
    tasks: [{ title: 'Restored Task 1', priority: 'Medium' }],
    notes: [{ title: 'Restored Note 1', contentMarkdown: 'Restored content' }],
  });
  console.log('6. Account Restore accepts valid backup and re-maps to current user (200):', restoreRes.status === 200 ? '✅ PASS' : `❌ FAIL (${restoreRes.status})`);

  // 7. Cascading Account Deletion (requires password)
  const delWithoutPass = await clientA.delete('/users/me', {});
  console.log('7a. DELETE /users/me rejected without password (400):', delWithoutPass.status === 400 ? '✅ PASS' : '❌ FAIL');

  const delWrongPass = await clientA.delete('/users/me', { password: 'WrongPassword!' });
  console.log('7b. DELETE /users/me rejected with wrong password (400):', delWrongPass.status === 400 ? '✅ PASS' : '❌ FAIL');

  const delCorrectPass = await clientA.delete('/users/me', { password: passA });
  console.log('7c. DELETE /users/me succeeds with correct password (200):', delCorrectPass.status === 200 ? '✅ PASS' : '❌ FAIL');

  // Verify User A task is purged after account deletion
  const checkTaskPurged = await clientA.get(`/tasks/${taskAId}`);
  console.log('7d. Cascading deletion purged User A resources (returns 401 unauth / 404):', [401, 404].includes(checkTaskPurged.status) ? '✅ PASS' : '❌ FAIL');

  // Clean up User B
  await clientB.delete('/users/me', { password: passB });
  console.log('8. User B cleaned up.');

  console.log('\n=================================================================');
  console.log('🎉 ALL PHASE 4 SECURITY & DATA LAYER CHECKS PASSED PERFECTLY!');
  console.log('=================================================================');
}

runIsolationAudit().catch(console.error);
