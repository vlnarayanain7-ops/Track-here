import './_guard.mjs';

const BASE_URL = 'http://localhost:5000/api';

function createClient() {
  let token = null;
  const cookieJar = new Map();

  const csrfToken = () => cookieJar.get('csrfToken');

  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes((options.method || 'GET').toUpperCase()) && csrfToken()) {
      headers['X-CSRF-Token'] = csrfToken();
    }

    if (cookieJar.size > 0) {
      const cookieStr = Array.from(cookieJar.entries())
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
      headers['Cookie'] = cookieStr;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    try {
      const res = await fetch(url, fetchOptions);
      
      // Save Set-Cookie
      const rawCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
      if (rawCookies.length === 0 && res.headers.get('set-cookie')) {
        rawCookies.push(res.headers.get('set-cookie'));
      }

      for (const cookie of rawCookies) {
        const parts = cookie.split(';')[0].split('=');
        if (parts.length >= 2) {
          const key = parts[0].trim();
          const val = parts.slice(1).join('=').trim();
          if (val === '') {
            cookieJar.delete(key);
          } else {
            cookieJar.set(key, val);
          }
        }
      }

      let data = null;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      // If token is returned in response data, store it
      if (data?.data?.accessToken) {
        token = data.data.accessToken;
      }

      return {
        status: res.status,
        data,
      };
    } catch (err) {
      return {
        status: 0,
        error: err.message,
      };
    }
  }

  return {
    get: (url, opts) => request(url, { ...opts, method: 'GET' }),
    post: (url, body, opts) => request(url, { ...opts, method: 'POST', body }),
    put: (url, body, opts) => request(url, { ...opts, method: 'PUT', body }),
    delete: (url, opts) => request(url, { ...opts, method: 'DELETE' }),
    clearAuth: () => {
      token = null;
      cookieJar.clear();
    },
    setToken: (t) => { token = t; },
    initializeCsrf: () => request('/auth/csrf'),
  };
}

const clientA = createClient();
const clientB = createClient();

const results = [];

function record(suite, testName, passed, details = '') {
  results.push({ suite, testName, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${suite}] ${testName} ${details ? '(' + details + ')' : ''}`);
}

async function runAudit() {
  console.log('========================================================');
  console.log('🚀 TRACK HERE — AUTOMATED FUNCTIONAL & SECURITY AUDIT');
  console.log('========================================================\n');

  const timestamp = Date.now();
  const userA_email = `usera_${timestamp}@trackhere.dev`;
  const userB_email = `userb_${timestamp}@trackhere.dev`;
  const password = 'Password123!';

  // ─── 1. Authentication: Signup & Login ───────────────────────────
  console.log('--- 1. Testing Signup, Login & Session Tokens/Cookies ---');
  
  // Register User A
  await clientA.initializeCsrf();
  await clientB.initializeCsrf();
  const regARes = await clientA.post('/auth/register', {
    name: 'Alice Learner',
    email: userA_email,
    password: password,
  });
  record('Auth', 'User A Register', regARes.status === 201 && regARes.data?.success, `Status: ${regARes.status}`);

  // Register User B
  const regBRes = await clientB.post('/auth/register', {
    name: 'Bob Coder',
    email: userB_email,
    password: password,
  });
  record('Auth', 'User B Register', regBRes.status === 201 && regBRes.data?.success, `Status: ${regBRes.status}`);

  // Login User A
  const loginARes = await clientA.post('/auth/login', {
    email: userA_email,
    password: password,
  });
  record('Auth', 'User A Login', loginARes.status === 200 && loginARes.data?.success, `User ID: ${loginARes.data?.data?.user?._id}`);

  // Login User B
  const loginBRes = await clientB.post('/auth/login', {
    email: userB_email,
    password: password,
  });
  record('Auth', 'User B Login', loginBRes.status === 200 && loginBRes.data?.success, `User ID: ${loginBRes.data?.data?.user?._id}`);

  // Verify /auth/me for both
  const meARes = await clientA.get('/auth/me');
  record('Auth', 'User A /auth/me Verification', meARes.status === 200 && meARes.data?.data?.user?.email === userA_email);

  const meBRes = await clientB.get('/auth/me');
  record('Auth', 'User B /auth/me Verification', meBRes.status === 200 && meBRes.data?.data?.user?.email === userB_email);

  // ─── 2. Data Creation by User A ─────────────────────────────────
  console.log('\n--- 2. Creating User A Resources (Session, Task, Note, Problem, Revision) ---');

  // Study Session (45 minutes genuine focused study)
  const sessionRes = await clientA.post('/study-sessions', {
    category: 'DSA',
    topic: 'Binary Search Trees',
    subtopic: 'Balanced BST and AVL',
    activityType: 'Problem Solving',
    focusDuration: 45,
    problemsAttempted: 3,
    problemsSolved: 3,
    problemsSolvedIndependently: 2,
    keyLearnings: 'Rotation algorithms maintain O(log n) height',
    date: new Date().toISOString(),
  });
  const sessionId = sessionRes.data?.data?.session?._id;
  record('StudySessions', 'Create Study Session (45 min)', sessionRes.status === 201 && !!sessionId, `ID: ${sessionId}`);

  // Task
  const taskRes = await clientA.post('/tasks', {
    title: 'Solve LeetCode #230 Kth Smallest in BST',
    description: 'Use in-order traversal with counter',
    priority: 'High',
    category: 'DSA',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    estimatedDuration: 30,
  });
  const taskId = taskRes.data?.data?.task?._id;
  record('Tasks', 'Create Task', taskRes.status === 201 && !!taskId, `ID: ${taskId}`);

  // Note
  const noteRes = await clientA.post('/notes', {
    title: 'AVL Trees vs Red-Black Trees',
    content: '<h1>AVL Trees</h1><p>AVL trees are rigidly balanced.</p>',
    contentMarkdown: '# AVL Trees\n\nAVL trees are rigidly balanced.',
    folder: 'DSA',
    tags: ['trees', 'algorithms', 'c++'],
  });
  const noteId = noteRes.data?.data?.note?._id;
  record('Notes', 'Create Note', noteRes.status === 201 && !!noteId, `ID: ${noteId}`);

  // Problem
  const problemRes = await clientA.post('/problems', {
    name: 'Binary Tree Maximum Path Sum',
    url: 'https://leetcode.com/problems/binary-tree-maximum-path-sum/',
    platform: 'LeetCode',
    topic: 'Trees',
    difficulty: 'Hard',
    tags: ['Tree', 'DFS', 'Dynamic Programming'],
  });
  const problemId = problemRes.data?.data?.problem?._id || problemRes.data?._id;
  record('Problems', 'Create Problem', problemRes.status === 201 && !!problemId, `ID: ${problemId}`);

  // Add attempt to Problem
  let attemptId = null;
  if (problemId) {
    const attemptRes = await clientA.post(`/problems/${problemId}/attempts`, {
      outcome: 'Solved independently',
      duration: 35,
      approach: 'Post-order traversal calculating max gain of left and right child',
      timeComplexity: 'O(N)',
      spaceComplexity: 'O(H)',
      learning: 'Only consider positive path sums from children',
    });
    attemptId = attemptRes.data?.attempt?._id || attemptRes.data?.data?.attempt?._id || attemptRes.data?._id;
    record('Problems', 'Add Problem Attempt', attemptRes.status === 201 && !!attemptId);
  }

  // Revision
  const revisionRes = await clientA.post('/revisions', {
    title: 'Segment Tree Range Query',
    type: 'topic',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    intervalDays: 1,
  });
  const revisionId = revisionRes.data?.data?.revision?._id || revisionRes.data?._id;
  record('Revisions', 'Create Revision Item', revisionRes.status === 201 && !!revisionId, `ID: ${revisionId}`);

  // Daily Plan (Morning Check-in)
  const planRes = await clientA.post('/daily-plans', {
    date: new Date().toISOString(),
    targetHours: 4.5,
    intentions: 'Master tree algorithms and solve 3 CP questions',
    studyTargets: {
      cpp: 'Templates and Concepts in C++20',
      dsa: 'Binary Tree Maximum Path Sum and BST validation',
      cp: 'Codeforces Div 2 Problem C',
    },
  });
  record('DailyPlans', 'Create Morning Daily Plan', planRes.status === 201 && !!planRes.data?._id);

  // Daily Review (Evening Check-in)
  const reviewRes = await clientA.post('/daily-reviews', {
    date: new Date().toISOString(),
    learned: 'Deepened understanding of recursion stack depth',
    mistakes: 'Forgot edge case with all negative node values',
    tomorrowPlan: 'Trie data structures',
  });
  record('DailyReviews', 'Create Evening Review', reviewRes.status === 201 && !!reviewRes.data?._id);

  // ─── 3. Multi-User Security & Isolation ─────────────────────────
  console.log('\n--- 3. Testing Multi-User Security & Data Isolation (User B accessing User A) ---');

  // User B tries to GET User A's session
  const bGetSession = await clientB.get(`/study-sessions/${sessionId}`);
  record('Security', 'User B cannot GET User A StudySession', bGetSession.status === 404, `Status: ${bGetSession.status}`);

  // User B tries to PUT User A's session
  const bPutSession = await clientB.put(`/study-sessions/${sessionId}`, { topic: 'Hacked by Bob' });
  record('Security', 'User B cannot PUT User A StudySession', bPutSession.status === 404, `Status: ${bPutSession.status}`);

  // User B tries to DELETE User A's session
  const bDelSession = await clientB.delete(`/study-sessions/${sessionId}`);
  record('Security', 'User B cannot DELETE User A StudySession', bDelSession.status === 404, `Status: ${bDelSession.status}`);

  // User B tries to GET User A's task
  const bGetTask = await clientB.get(`/tasks/${taskId}`);
  record('Security', 'User B cannot GET User A Task', bGetTask.status === 404, `Status: ${bGetTask.status}`);

  // User B tries to PUT User A's task
  const bPutTask = await clientB.put(`/tasks/${taskId}`, { title: 'Hacked Task' });
  record('Security', 'User B cannot PUT User A Task', bPutTask.status === 404, `Status: ${bPutTask.status}`);

  // User B tries to DELETE User A's task
  const bDelTask = await clientB.delete(`/tasks/${taskId}`);
  record('Security', 'User B cannot DELETE User A Task', bDelTask.status === 404, `Status: ${bDelTask.status}`);

  // User B tries to GET User A's note
  const bGetNote = await clientB.get(`/notes/${noteId}`);
  record('Security', 'User B cannot GET User A Note', bGetNote.status === 404, `Status: ${bGetNote.status}`);

  // User B tries to PUT User A's note
  const bPutNote = await clientB.put(`/notes/${noteId}`, { title: 'Hacked Note' });
  record('Security', 'User B cannot PUT User A Note', bPutNote.status === 404, `Status: ${bPutNote.status}`);

  // User B tries to DELETE User A's note
  const bDelNote = await clientB.delete(`/notes/${noteId}`);
  record('Security', 'User B cannot DELETE User A Note', bDelNote.status === 404, `Status: ${bDelNote.status}`);

  // User B tries to GET User A's problem
  const bGetProblem = await clientB.get(`/problems/${problemId}`);
  record('Security', 'User B cannot GET User A Problem', bGetProblem.status === 404, `Status: ${bGetProblem.status}`);

  // User B tries to GET User A's revision
  const bGetRev = await clientB.get(`/revisions/${revisionId}`);
  record('Security', 'User B cannot GET User A Revision', bGetRev.status === 404, `Status: ${bGetRev.status}`);

  // User B lists resources - must be empty
  const bListSessions = await clientB.get('/study-sessions');
  const bSessionsCount = bListSessions.data?.data?.sessions?.length ?? bListSessions.data?.data?.length ?? 0;
  record('Security', 'User B session list isolated (0 sessions)', bSessionsCount === 0, `Count: ${bSessionsCount}`);

  const bListTasks = await clientB.get('/tasks');
  const bTasksCount = bListTasks.data?.data?.tasks?.length ?? bListTasks.data?.data?.length ?? 0;
  record('Security', 'User B task list isolated (0 tasks)', bTasksCount === 0, `Count: ${bTasksCount}`);

  const bListNotes = await clientB.get('/notes');
  const bNotesCount = bListNotes.data?.data?.notes?.length ?? bListNotes.data?.data?.length ?? 0;
  record('Security', 'User B note list isolated (0 notes)', bNotesCount === 0, `Count: ${bNotesCount}`);

  // ─── 4. Focus Timer Functionality ───────────────────────────────
  console.log('\n--- 4. Testing Focus Timer Lifecycle & Recovery ---');

  // Start Timer
  const timerStart = await clientA.post('/study-sessions/timer/start', {
    topic: 'Graph Theory BFS/DFS',
    category: 'DSA',
    activityType: 'Coding',
  });
  const timerSessionId = timerStart.data?.data?.session?._id;
  record('Timer', 'Start Timer', timerStart.status === 201 && timerStart.data?.data?.session?.timerState?.status === 'running', `Timer Session ID: ${timerSessionId}`);

  // Check Active Timer (simulates refresh recovery)
  const timerActive = await clientA.get('/study-sessions/timer/active');
  record('Timer', 'Get Active Timer (Recovery)', timerActive.status === 200 && timerActive.data?.data?.session?.topic === 'Graph Theory BFS/DFS');

  // Pause Timer
  const timerPause = await clientA.post('/study-sessions/timer/pause');
  record('Timer', 'Pause Timer', timerPause.status === 200 && timerPause.data?.data?.session?.timerState?.status === 'paused');

  // Resume Timer
  const timerResume = await clientA.post('/study-sessions/timer/resume');
  record('Timer', 'Resume Timer', timerResume.status === 200 && timerResume.data?.data?.session?.timerState?.status === 'running');

  // Finish Timer
  const timerFinish = await clientA.post('/study-sessions/timer/finish', {
    keyLearnings: 'Practiced adjacency list traversal and connected components',
  });
  record('Timer', 'Finish Timer & Save Session', timerFinish.status === 200 && timerFinish.data?.success);

  // Verify Active Timer is now null
  const timerAfterFinish = await clientA.get('/study-sessions/timer/active');
  record('Timer', 'Active Timer Cleared After Finish', timerAfterFinish.status === 200 && timerAfterFinish.data?.data?.session === null);

  // ─── 5. Streak & Minimum 25-Minute Rule ──────────────────────────
  console.log('\n--- 5. Testing Streak Logic & Minimum 25-Minute Rule ---');

  // User A logged a 45-minute session above
  const streakAnalytics = await clientA.get('/analytics/streaks');
  const streakCount = streakAnalytics.data?.currentStreak;
  record('Streaks', 'User A Current Streak Qualified (>=25 min session)', streakCount >= 1, `Current Streak: ${streakCount}`);
  record('Streaks', 'Streak Analytics Endpoint', streakAnalytics.status === 200);

  // ─── 6. Analytics & Dashboard Data ──────────────────────────────
  console.log('\n--- 6. Testing Analytics & Dashboard Aggregations ---');

  const dashRes = await clientA.get('/analytics/dashboard');
  record('Analytics', 'Dashboard Overview API', dashRes.status === 200 && typeof dashRes.data?.today?.studyMinutes === 'number');

  const weeklyRes = await clientA.get('/analytics/weekly-summary');
  record('Analytics', 'Weekly Review Summary API', weeklyRes.status === 200 && typeof weeklyRes.data?.totalMinutes === 'number');

  const heatmapRes = await clientA.get('/analytics/heatmap');
  record('Analytics', 'Consistency Heatmap API', heatmapRes.status === 200 && Array.isArray(heatmapRes.data));

  // ─── 7. Revisions Progression ───────────────────────────────────
  console.log('\n--- 7. Testing Revision Management & Spaced Repetition ---');

  if (revisionId) {
    const revAction = await clientA.post(`/revisions/${revisionId}/complete`, {
      feedback: 'Easy',
    });
    record('Revisions', 'Submit Revision Feedback (Easy)', revAction.status === 200 && (revAction.data?.success || !!revAction.data?._id));
  }

  // ─── 8. Settings & Profile Update ───────────────────────────────
  console.log('\n--- 8. Testing Settings & User Preferences ---');

  const updateProfileRes = await clientA.put('/users/profile', {
    dailyStudyGoal: 300,
    timezone: 'Asia/Kolkata',
  });
  record('Settings', 'Update Study Goals & Timezone', updateProfileRes.status === 200 && updateProfileRes.data?.data?.user?.dailyStudyGoal === 300);

  const exportRes = await clientA.get('/users/me/export');
  record('Settings', 'Export User Data (JSON)', exportRes.status === 200 && !!exportRes.data?.data?.studySessions);

  // ─── 9. Notification Endpoints & VAPID Key ──────────────────────
  console.log('\n--- 9. Testing Notification Configuration & Logs ---');

  const vapidRes = await clientA.get('/notifications/vapid-key');
  record('Notifications', 'Get VAPID Public Key API', vapidRes.status === 200, `Has Key: ${!!vapidRes.data?.publicKey}`);

  const notifsList = await clientA.get('/notifications');
  record('Notifications', 'Get Notifications List', notifsList.status === 200 && Array.isArray(notifsList.data));

  const unreadRes = await clientA.get('/notifications/unread-count');
  record('Notifications', 'Get Unread Count API', unreadRes.status === 200 && typeof unreadRes.data?.count === 'number');

  // ─── 10. Data Persistence Verification (Relogin & Refresh) ──────
  console.log('\n--- 10. Testing Persistence Across Logout & Relogin ---');

  // Logout User A
  const logoutRes = await clientA.post('/auth/logout');
  record('Persistence', 'User A Logout', logoutRes.status === 200 && logoutRes.data?.success);

  // Clear auth in clientA
  clientA.clearAuth();

  // Verify requests fail after logout
  const meLoggedOut = await clientA.get('/auth/me');
  record('Persistence', 'Token Revoked / Required After Logout', meLoggedOut.status === 401, `Status: ${meLoggedOut.status}`);

  // Re-login User A with fresh client instance
  const clientA_fresh = createClient();
  await clientA_fresh.initializeCsrf();
  const reloginRes = await clientA_fresh.post('/auth/login', {
    email: userA_email,
    password: password,
  });
  record('Persistence', 'User A Relogin', reloginRes.status === 200 && reloginRes.data?.success);

  // Check that records created earlier still exist
  const checkSession = await clientA_fresh.get(`/study-sessions/${sessionId}`);
  record('Persistence', 'Study Session Persisted After Relogin', checkSession.status === 200 && checkSession.data?.data?.session?._id === sessionId);

  const checkTask = await clientA_fresh.get(`/tasks/${taskId}`);
  record('Persistence', 'Task Persisted After Relogin', checkTask.status === 200 && checkTask.data?.data?.task?._id === taskId);

  const checkNote = await clientA_fresh.get(`/notes/${noteId}`);
  record('Persistence', 'Note Persisted After Relogin', checkNote.status === 200 && checkNote.data?.data?.note?._id === noteId);

  // ─── Summary ────────────────────────────────────────────────────
  console.log('\n========================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`TOTAL AUDIT CHECKS: ${totalCount}`);
  console.log(`PASSED: ${passedCount}`);
  console.log(`FAILED: ${totalCount - passedCount}`);
  console.log('========================================================\n');

  if (passedCount === totalCount) {
    console.log('🎉 ALL BACKEND FUNCTIONAL, ISOLATION & PERSISTENCE CHECKS PASSED!');
    process.exit(0);
  } else {
    console.log('⚠️ SOME CHECKS FAILED. INVESTIGATION REQUIRED.');
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
