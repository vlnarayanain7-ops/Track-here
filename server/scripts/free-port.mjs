import { execSync } from 'child_process';

const port = process.env.PORT || 5000;

export function freePort(targetPort = port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${targetPort}`, {
        stdio: ['ignore', 'pipe', 'ignore'],
        encoding: 'utf8',
      });
      const lines = output.split(/\r?\n/).filter(Boolean);
      const killedPids = new Set();

      for (const line of lines) {
        if (!line.includes(`:${targetPort}`)) continue;
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== `${process.pid}` && pid !== '0' && pid !== '4' && !killedPids.has(pid)) {
          killedPids.add(pid);
          try {
            console.log(`[free-port] Releasing port ${targetPort} from PID ${pid}...`);
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch {}
        }
      }
    } else {
      try {
        execSync(`fuser -k ${targetPort}/tcp`, { stdio: 'ignore' });
      } catch {}
    }
  } catch {
    // Port not in use - nothing to kill
  }
}

// When executed directly via node scripts/free-port.mjs
if (process.argv[1]?.endsWith('free-port.mjs')) {
  freePort();
}
