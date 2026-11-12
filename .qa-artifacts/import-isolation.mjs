const BASE_URL = 'http://127.0.0.1:5000/api';
const stamp = Date.now();
const password = 'ImportIsolation123!';

function client() {
  const cookies = new Map();
  const request = async (path, method = 'GET', body) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (cookies.size) headers.Cookie = [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && cookies.get('csrfToken')) headers['X-CSRF-Token'] = cookies.get('csrfToken');
    const response = await fetch(`${BASE_URL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const raw of response.headers.getSetCookie?.() || (response.headers.get('set-cookie') ? [response.headers.get('set-cookie')] : [])) {
      const [pair] = raw.split(';'); const at = pair.indexOf('='); const key = pair.slice(0, at).trim(); const value = pair.slice(at + 1).trim();
      if (value) cookies.set(key, value); else cookies.delete(key);
    }
    const text = await response.text(); let data; try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, data };
  };
  return { get: (path) => request(path), post: (path, body) => request(path, 'POST', body) };
}

async function register(c, name, email) {
  if ((await c.get('/auth/csrf')).status !== 200) throw new Error('CSRF bootstrap failed');
  const response = await c.post('/auth/register', { name, email, password });
  if (response.status !== 201) throw new Error(`Registration failed: ${response.status}`);
}

const source = client();
const importer = client();
await register(source, 'Import Source', `import_source_${stamp}@trackhere.test`);
await register(importer, 'Import Target', `import_target_${stamp}@trackhere.test`);
const sourceTask = await source.post('/tasks', { title: `source task ${stamp}`, category: 'Physics', priority: 'High' });
const sourceNote = await source.post('/notes', { title: `source note ${stamp}`, contentMarkdown: 'owned by source' });
if (sourceTask.status !== 201 || sourceNote.status !== 201) throw new Error('Source fixture creation failed');
const exported = await source.get('/users/export');
if (exported.status !== 200) throw new Error('Export failed');
const imported = await importer.post('/users/import', exported.data.data);
const importedTaskCount = imported.data?.data?.counts?.tasks || 0;
const importedNoteCount = imported.data?.data?.counts?.notes || 0;
const importerTasks = await importer.get('/tasks');
const importerNotes = await importer.get('/notes');
const sourceCanReadImporterTask = importerTasks.data?.data?.tasks?.[0]?._id
  ? await source.get(`/tasks/${importerTasks.data.data.tasks[0]._id}`)
  : { status: 0 };

const pass = imported.status === 200
  && importedTaskCount >= 1
  && importedNoteCount >= 1
  && (importerTasks.data?.data?.tasks || []).some((task) => task.title === `source task ${stamp}`)
  && (importerNotes.data?.data?.notes || []).some((note) => note.title === `source note ${stamp}`)
  && sourceCanReadImporterTask.status === 404;
console.log(`${pass ? 'PASS' : 'FAIL'} import isolation: copied data is remapped to importer and inaccessible to source`);
process.exit(pass ? 0 : 1);