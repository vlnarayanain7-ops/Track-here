import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const target = path.join(__dirname, '..', 'server', 'scripts', 'backfill-daily.mjs');

const child = spawn(process.execPath, [target], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code || 0));
