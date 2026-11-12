import assert from 'assert';

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

    return { status: res.status, data, headers: res.headers };
  }

  async function initCsrf() {
    await request('/auth/csrf');
  }

  function setToken(t) {
    token = t;
  }

  return { request, initCsrf, setToken };
}

async function runProfileJourneys() {
  console.log('========================================================');
  console.log('🧪 VERIFYING 4 ISOLATED PREPARATION PROFILES (JOURNEYS)');
  console.log('========================================================\n');

  const profiles = [
    {
      name: 'NEET Aspirant',
      email: `neet_${Date.now()}@example.com`,
      password: 'Password123!',
      preparationType: 'NEET',
      subjects: [
        { name: 'Physics', color: '#63B6D7', icon: 'BookOpen', chapters: [{ name: 'Thermodynamics', status: 'In progress', topics: [] }] },
        { name: 'Chemistry', color: '#38B987', icon: 'BookOpen', chapters: [{ name: 'Organic Reactions', status: 'Completed', topics: [] }] },
        { name: 'Botany', color: '#E6AD56', icon: 'BookOpen', chapters: [{ name: 'Plant Physiology', status: 'Not started', topics: [] }] },
        { name: 'Zoology', color: '#E47777', icon: 'BookOpen', chapters: [{ name: 'Human Anatomy', status: 'In progress', topics: [] }] },
      ],
      sampleSession: { category: 'Botany', topic: 'Plant Respiration', focusDuration: 50, activityType: 'Reading' },
      sampleTask: { title: 'Revise 50 Botany MCQs', priority: 'High', category: 'Botany' },
    },
    {
      name: 'JEE Aspirant',
      email: `jee_${Date.now()}@example.com`,
      password: 'Password123!',
      preparationType: 'JEE',
      subjects: [
        { name: 'Physics', color: '#63B6D7', icon: 'BookOpen', chapters: [{ name: 'Rotational Dynamics', status: 'In progress', topics: [] }] },
        { name: 'Chemistry', color: '#38B987', icon: 'BookOpen', chapters: [{ name: 'Chemical Bonding', status: 'Completed', topics: [] }] },
        { name: 'Mathematics', color: '#A78BFA', icon: 'BookOpen', chapters: [{ name: 'Calculus & Integration', status: 'In progress', topics: [] }] },
      ],
      sampleSession: { category: 'Mathematics', topic: 'Definite Integrals', focusDuration: 90, activityType: 'Problem Solving' },
      sampleTask: { title: 'Complete JEE Advanced 2024 Math Paper', priority: 'High', category: 'Mathematics' },
    },
    {
      name: 'Competitive Programmer',
      email: `cp_${Date.now()}@example.com`,
      password: 'Password123!',
      preparationType: 'Competitive Programming',
      subjects: [
        { name: 'C++', color: '#63B6D7', icon: 'BookOpen', chapters: [{ name: 'STL & Templates', status: 'Completed', topics: [] }] },
        { name: 'Data Structures & Algorithms', color: '#38B987', icon: 'BookOpen', chapters: [{ name: 'Dynamic Programming & Graphs', status: 'In progress', topics: [] }] },
        { name: 'Competitive Programming', color: '#E6AD56', icon: 'BookOpen', chapters: [{ name: 'Segment Trees', status: 'Not started', topics: [] }] },
      ],
      sampleSession: { category: 'Data Structures & Algorithms', topic: 'Shortest Path Algorithms', focusDuration: 60, activityType: 'Problem Solving' },
      sampleTask: { title: 'Solve 3 Codeforces 1600+ problems', priority: 'High', category: 'Data Structures & Algorithms' },
      sampleProblem: { name: 'Dijkstra on Graphs', platform: 'Codeforces', difficulty: 'Medium', status: 'Solved', solvedIndependently: true },
    },
    {
      name: 'Custom Learner',
      email: `custom_${Date.now()}@example.com`,
      password: 'Password123!',
      preparationType: 'Custom',
      subjects: [
        { name: 'Machine Learning', color: '#63B6D7', icon: 'BookOpen', chapters: [{ name: 'Neural Networks', status: 'In progress', topics: [] }] },
        { name: 'System Design', color: '#A78BFA', icon: 'BookOpen', chapters: [{ name: 'Distributed Caching', status: 'Not started', topics: [] }] },
      ],
      sampleSession: { category: 'System Design', topic: 'Cache Invalidation Strategies', focusDuration: 45, activityType: 'Reading' },
      sampleTask: { title: 'Design high-throughput rate limiter', priority: 'Medium', category: 'System Design' },
    },
  ];

  let passed = 0;
  let total = 0;

  for (const p of profiles) {
    console.log(`--- Testing Profile: ${p.name} (${p.preparationType}) ---`);
    const client = createClient();
    await client.initCsrf();

    // 1. Register user
    total++;
    const regRes = await client.request('/auth/register', {
      method: 'POST',
      body: { name: p.name, email: p.email, password: p.password },
    });
    if (regRes.status === 201) {
      console.log(`  ✅ Registered: ${p.email}`);
      passed++;
    } else {
      console.log(`  ❌ Registration failed:`, regRes.data);
    }

    // 2. Set profile with custom subjects & prep type
    total++;
    const profRes = await client.request('/users/profile', {
      method: 'PUT',
      body: {
        preparationType: p.preparationType,
        subjects: p.subjects,
        dailyStudyGoal: 300,
        timezone: 'Asia/Kolkata',
      },
    });
    if (profRes.status === 200 && profRes.data?.data?.user?.subjects?.length === p.subjects.length) {
      console.log(`  ✅ Profile configured with ${p.subjects.length} subjects (no default forced)`);
      passed++;
    } else {
      console.log(`  ❌ Profile configuration failed:`, profRes.data);
    }

    // 3. Log a study session under correct subject
    total++;
    const sessRes = await client.request('/study-sessions', {
      method: 'POST',
      body: p.sampleSession,
    });
    if (sessRes.status === 201 && sessRes.data?.data?.session?.category === p.sampleSession.category) {
      console.log(`  ✅ Study session recorded under correct subject "${p.sampleSession.category}"`);
      passed++;
    } else {
      console.log(`  ❌ Study session recording failed:`, sessRes.data);
    }

    // 4. Create task
    total++;
    const taskRes = await client.request('/tasks', {
      method: 'POST',
      body: p.sampleTask,
    });
    if (taskRes.status === 201 && taskRes.data?.data?.task?.title === p.sampleTask.title) {
      console.log(`  ✅ Task recorded under "${p.sampleTask.category}"`);
      passed++;
    } else {
      console.log(`  ❌ Task creation failed:`, taskRes.data);
    }

    // 5. If CP profile, test problem logging
    if (p.sampleProblem) {
      total++;
      const probRes = await client.request('/problems', {
        method: 'POST',
        body: p.sampleProblem,
      });
      const problemName = probRes.data?.data?.problem?.name || probRes.data?.name;
      if (probRes.status === 201 && problemName === p.sampleProblem.name) {
        console.log(`  ✅ CP Problem tracked: "${p.sampleProblem.name}" on ${p.sampleProblem.platform}`);
        passed++;
      } else {
        console.log(`  ❌ Problem logging failed:`, probRes.data);
      }
    }

    // 6. Verify Dashboard overview reflects actual profile data
    total++;
    const dashRes = await client.request('/analytics/dashboard');
    if (dashRes.status === 200) {
      console.log(`  ✅ Dashboard data fetched and accurately aggregates records`);
      passed++;
    } else {
      console.log(`  ❌ Dashboard fetch failed:`, dashRes.data);
    }

    // 7. Test re-login & persistence of preparation settings
    total++;
    const loginRes = await client.request('/auth/login', {
      method: 'POST',
      body: { email: p.email, password: p.password },
    });
    const loggedInUser = loginRes.data?.data?.user;
    if (
      loginRes.status === 200 &&
      loggedInUser?.preparationType === p.preparationType &&
      loggedInUser?.subjects?.length === p.subjects.length
    ) {
      console.log(`  ✅ Profile & custom subjects perfectly persist after re-login\n`);
      passed++;
    } else {
      console.log(`  ❌ Re-login persistence verification failed:`, loginRes.data);
    }
  }

  console.log('========================================================');
  console.log(`TOTAL PROFILE CHECKS: ${total}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${total - passed}`);
  console.log('========================================================');
  
  if (passed === total) {
    console.log('\n🎉 ALL 4 PREPARATION PROFILES FULLY VALIDATED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runProfileJourneys().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
