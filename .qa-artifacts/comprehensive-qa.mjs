// Comprehensive end-to-end QA verification test for Track Here
const BASE_URL = 'http://127.0.0.1:5000/api';
const stamp = Date.now();
const password = 'TestSecurePass123!';

function makeClient() {
  const cookies = new Map();
  const cookieHeader = () =>
    Array.from(cookies.entries())
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');

  async function request(path, { method = 'GET', body } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookies.size) headers.Cookie = cookieHeader();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && cookies.get('csrfToken')) {
      headers['X-CSRF-Token'] = cookies.get('csrfToken');
    }
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const raw of response.headers.getSetCookie?.() ||
      (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])) {
      const [pair] = raw.split(';');
      const sep = pair.indexOf('=');
      const name = pair.slice(0, sep).trim();
      const val = pair.slice(sep + 1).trim();
      if (val) cookies.set(name, val);
      else cookies.delete(name);
    }
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data };
  }

  return {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body }),
    put: (path, body) => request(path, { method: 'PUT', body }),
    delete: (path) => request(path, { method: 'DELETE' }),
  };
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, debugData) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
    if (debugData) {
      console.error(`         Debug:`, JSON.stringify(debugData).slice(0, 300));
    }
  }
}

async function runQA() {
  console.log('\n======================================================');
  console.log('TRACK HERE — FULL PRODUCTION QA VERIFICATION SUITE');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. NEET Profile & Syllabus Management
  // -----------------------------------------------------------------
  console.log('--- 1. Testing NEET Profile & Syllabus Management ---');
  const neet = makeClient();
  await neet.get('/auth/csrf');
  const neetReg = await neet.post('/auth/register', {
    name: 'NEET Aspirant Dr. Aisha',
    email: `neet_${stamp}@trackhere.test`,
    password,
  });
  assert(neetReg.status === 201, 'NEET registration successful (201)');

  const neetSubjects = [
    {
      name: 'Physics',
      color: '#63B6D7',
      icon: 'Atom',
      chapters: [
        {
          name: 'Electrostatics',
          status: 'In progress',
          topics: [
            { name: "Coulomb's Law", status: 'Completed' },
            { name: 'Electric Field & Potential', status: 'In progress' },
            { name: 'Capacitance', status: 'Not started' },
          ],
        },
        {
          name: 'Current Electricity',
          status: 'Not started',
          topics: [
            { name: "Ohm's Law", status: 'Not started' },
            { name: "Kirchhoff's Laws", status: 'Not started' },
          ],
        },
      ],
    },
    {
      name: 'Chemistry',
      color: '#38B987',
      icon: 'Beaker',
      chapters: [
        {
          name: 'Chemical Bonding',
          status: 'Completed',
          topics: [
            { name: 'VSEPR Theory', status: 'Completed' },
            { name: 'Hybridization', status: 'Completed' },
          ],
        },
      ],
    },
    { name: 'Botany', color: '#A78BFA', icon: 'Microscope', chapters: [] },
    { name: 'Zoology', color: '#E6AD56', icon: 'Brain', chapters: [] },
  ];

  const neetUpdate = await neet.put('/users/profile', {
    preparationType: 'NEET',
    subjects: neetSubjects,
    examName: 'NEET UG 2027',
    examDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString(),
    dailyStudyGoal: 360,
    onboardingCompleted: true,
  });
  assert(neetUpdate.status === 200, 'NEET profile & nested syllabus saved (200)', neetUpdate);
  assert(
    neetUpdate.data?.data?.user?.subjects?.length === 4,
    'All 4 NEET subjects persisted accurately',
    neetUpdate
  );
  assert(
    neetUpdate.data?.data?.user?.subjects[0].chapters[0].topics.length === 3,
    'Syllabus chapters & subtopics preserved',
    neetUpdate
  );

  // -----------------------------------------------------------------
  // 2. Timetable Management (7-day schedule grid)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Testing Timetable Weekly Planner ---');
  const slotRes = await neet.post('/timetable', {
    dayOfWeek: 1, // 1 for Monday (0=Sun, 1=Mon, ..., 6=Sat)
    startTime: '06:00',
    endTime: '08:30',
    subject: 'Physics',
    topic: 'Electrostatics Capacitance',
    activityType: 'Practice',
    priority: 'High',
  });
  assert(slotRes.status === 201, 'Timetable slot created for Monday (201)', slotRes);
  const slotId = slotRes.data?.data?.slot?._id;

  const getSlots = await neet.get('/timetable');
  assert(getSlots.status === 200, 'Retrieved weekly timetable slots (200)', getSlots);
  assert(
    getSlots.data?.data?.slots?.some((s) => s.subject === 'Physics'),
    'Physics slot found in weekly timetable',
    getSlots
  );

  // -----------------------------------------------------------------
  // 3. Mock Test Scorecard & Analytics
  // -----------------------------------------------------------------
  console.log('\n--- 3. Testing Mock Tests & Scorecards ---');
  const mockRes = await neet.post('/mock-tests', {
    title: 'Allen NEET Full Test 05',
    examType: 'NEET',
    totalMarks: 720,
    obtainedMarks: 645,
    totalQuestions: 180,
    correctCount: 165,
    incorrectCount: 10,
    unattemptedCount: 5,
    durationMinutes: 200,
    subjectScores: [
      { subject: 'Physics', totalMarks: 180, obtainedMarks: 160 },
      { subject: 'Chemistry', totalMarks: 180, obtainedMarks: 165 },
      { subject: 'Botany', totalMarks: 180, obtainedMarks: 160 },
      { subject: 'Zoology', totalMarks: 180, obtainedMarks: 160 },
    ],
    weakTopics: ['Rotational Motion', 'Aldehydes'],
    mistakes: 'Calculation mistake in Question 42; misread option in Question 89',
    notes: 'Good pacing, finished with 20 minutes left for review',
  });
  assert(mockRes.status === 201, 'Mock test scorecard logged (201)', mockRes);
  const testId = mockRes.data?.data?.test?._id;
  assert(Boolean(testId), 'Mock test ID assigned', mockRes);
  assert(mockRes.data?.data?.test?.accuracy > 90, 'Accuracy pre-save calculation verified', mockRes);

  const testStats = await neet.get('/mock-tests/stats');
  assert(testStats.status === 200, 'Mock test stats retrieved (200)', testStats);
  assert(testStats.data?.data?.totalTests === 1, 'Total mock tests count matches 1', testStats);
  assert(testStats.data?.data?.highestPercentage > 0, 'Highest percentage recorded accurately', testStats);

  // -----------------------------------------------------------------
  // 4. Custom Subject Task Creation (Fix verification)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Testing Task Creation with Custom Category ---');
  const taskRes = await neet.post('/tasks', {
    title: 'Solve 50 HC Verma problems on Electrostatics',
    category: 'Physics',
    priority: 'High',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
  });
  assert(
    taskRes.status === 201 && taskRes.data?.data?.task?.category === 'Physics',
    'Task created under custom subject "Physics" without enum validation error (201)'
  );

  // -----------------------------------------------------------------
  // 5. Study Session & Focus Timer
  // -----------------------------------------------------------------
  console.log('\n--- 5. Testing Study Session & Focus Timer ---');
  const studySession = await neet.post('/study-sessions', {
    category: 'Physics',
    topic: 'Capacitance Dielectrics',
    activityType: 'Problem Solving',
    focusDuration: 90,
    productivityRating: 5,
    notes: 'Solved all 20 advanced level problems',
  });
  assert(studySession.status === 201, 'Manual study session created (201)', studySession);

  const timerStart = await neet.post('/study-sessions/timer/start', {
    category: 'Chemistry',
    topic: 'Coordination Compounds',
    activityType: 'Revision',
  });
  assert(timerStart.status === 201, 'Timer started on Chemistry session (201)', timerStart);
  const timerSessionId = timerStart.data?.data?.session?._id;

  const timerFinish = await neet.post(`/study-sessions/timer/${timerSessionId}/finish`, {
    productivityRating: 4,
    notes: 'Completed nomenclature rules',
  });
  assert(timerFinish.status === 200, 'Timer completed and logged to database (200)', timerFinish);

  // -----------------------------------------------------------------
  // 6. User Isolation Check (JEE Aspirant)
  // -----------------------------------------------------------------
  console.log('\n--- 6. Testing Multi-User Data Isolation ---');
  const jee = makeClient();
  await jee.get('/auth/csrf');
  const jeeReg = await jee.post('/auth/register', {
    name: 'JEE Aspirant Rohan',
    email: `jee_${stamp}@trackhere.test`,
    password,
  });
  assert(jeeReg.status === 201, 'Second user (JEE) registered (201)', jeeReg);

  const jeeTests = await jee.get('/mock-tests');
  assert(
    jeeTests.status === 200 && (jeeTests.data?.data?.mockTests || []).length === 0,
    'JEE user cannot see NEET user mock tests (data isolation verified)',
    jeeTests
  );

  const jeeTimetable = await jee.get('/timetable');
  assert(
    jeeTimetable.status === 200 && (jeeTimetable.data?.data?.slots || []).length === 0,
    'JEE user cannot see NEET user timetable slots (data isolation verified)',
    jeeTimetable
  );

  // -----------------------------------------------------------------
  // 7. Competitive Programming Profile & Problem Journal
  // -----------------------------------------------------------------
  console.log('\n--- 7. Testing Competitive Programming Profile ---');
  const cp = makeClient();
  await cp.get('/auth/csrf');
  await cp.post('/auth/register', {
    name: 'CP Specialist Alex',
    email: `cp_${stamp}@trackhere.test`,
    password,
  });

  const cpProfile = await cp.put('/users/profile', {
    preparationType: 'Competitive Programming',
    subjects: [
      { name: 'C++', color: '#63B6D7', icon: 'Code', chapters: [] },
      { name: 'DSA', color: '#38B987', icon: 'Brain', chapters: [] },
      { name: 'Competitive Programming', color: '#A78BFA', icon: 'Code', chapters: [] },
    ],
    onboardingCompleted: true,
  });
  assert(cpProfile.status === 200, 'CP profile configured successfully', cpProfile);

  const probRes = await cp.post('/problems', {
    name: 'Trapping Rain Water',
    platform: 'LeetCode',
    url: 'https://leetcode.com/problems/trapping-rain-water/',
    difficulty: 'Hard',
    tags: ['Two Pointers', 'Dynamic Programming', 'Monotonic Stack'],
  });
  assert(probRes.status === 201, 'Algorithmic problem tracked (201)', probRes);
  const probId = probRes.data?._id || probRes.data?.data?.problem?._id;

  const attemptRes = await cp.post(`/problems/${probId}/attempts`, {
    outcome: 'Solved independently',
    duration: 35,
    approach: 'Two pointers keeping track of maxLeft and maxRight',
    timeComplexity: 'O(N)',
    spaceComplexity: 'O(1)',
    learning: 'Always check if water level is bounded by min(left, right)',
  });
  assert(attemptRes.status === 201, 'Problem attempt & complexity analysis recorded (201)', attemptRes);

  // -----------------------------------------------------------------
  // SUMMARY
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${totalTests}`);
  console.log(`PASSED:      ${passedTests}`);
  console.log(`FAILED:      ${failedTests}`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runQA().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
