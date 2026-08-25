/**
 * ORGVNUM bootstrap loader.
 *
 * Some PaaS/Pterodactyl hosts (e.g. Wispbyte) run `npm install` with install
 * scripts DISABLED, which means `better-sqlite3`'s native binary
 * (`better_sqlite3.node`) is never downloaded or compiled. The bot then
 * crashes with "Could not locate the bindings file."
 *
 * This bootstrap:
 *   1. Verifies better-sqlite3 can be loaded.
 *   2. If not, runs `npm rebuild better-sqlite3 --build-from-source`.
 *   3. Then starts the real bot via index.js.
 *
 * Usage on Wispbyte:
 *   Set the "JS File" startup variable to `bootstrap.js` (instead of index.js).
 *
 * The rebuild only runs when the binary is actually missing, so normal
 * restarts stay fast.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BETTER_SQLITE3_DIR = join(__dirname, 'node_modules', 'better-sqlite3');

async function tryLoadBetterSqlite3() {
  try {
    const mod = await import('better-sqlite3');
    const Database = mod.default;
    // Open an in-memory DB just to confirm the native binding loads.
    const db = new Database(':memory:');
    db.prepare('SELECT 1 AS x').get();
    db.close();
    return true;
  } catch {
    return false;
  }
}

function binaryExists() {
  if (!existsSync(BETTER_SQLITE3_DIR)) return false;
  const candidates = [
    'build/Release/better_sqlite3.node',
    'build/Debug/better_sqlite3.node',
    'build/default/better_sqlite3.node',
    'prebuilds/linux-x64/better_sqlite3.node',
    'prebuilds/linux-arm64/better_sqlite3.node',
  ];
  return candidates.some((p) => existsSync(join(BETTER_SQLITE3_DIR, p)));
}

async function rebuild() {
  console.log('[bootstrap] better-sqlite3 native binary missing. Running npm rebuild...');
  // First try a normal rebuild (uses prebuilt binary if available for this Node ABI).
  let res = spawnSync('npm', ['rebuild', 'better-sqlite3'], {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
  });
  if (res.status !== 0 || !(await tryLoadBetterSqlite3())) {
    console.log('[bootstrap] Normal rebuild did not produce a working binary. Building from source...');
    res = spawnSync('npm', ['rebuild', 'better-sqlite3', '--build-from-source'], {
      stdio: 'inherit',
      cwd: __dirname,
      shell: true,
    });
  }
  return res.status === 0;
}

async function main() {
  console.log('[bootstrap] ORGVNUM starting — Node', process.version);

  if (!(await tryLoadBetterSqlite3())) {
    if (!binaryExists()) {
      const ok = await rebuild();
      if (!ok || !(await tryLoadBetterSqlite3())) {
        console.error('');
        console.error('===========================================================');
        console.error('[bootstrap] FAILED to build better-sqlite3.');
        console.error('');
        console.error('This host does not have a prebuilt binary for Node', process.version, 'and');
        console.error('could not compile from source (missing C++ toolchain).');
        console.error('');
        console.error('FIX: Change the Node.js version in your host panel to');
        console.error('     Node 20 (or 22). better-sqlite3 ships prebuilt');
        console.error('     binaries for Node 18 / 20 / 22 / 24 — but NOT for');
        console.error('     Node 19 (which is what this host is running).');
        console.error('');
        console.error('     On Wispbyte: Startup tab → "Node Version" → 20.');
        console.error('===========================================================');
        console.error('');
        process.exit(1);
      }
    } else {
      console.error('[bootstrap] better-sqlite3 binary exists but failed to load. Node ABI mismatch.');
      console.error('[bootstrap] Try changing the Node version to 20 in your host panel.');
      process.exit(1);
    }
  }

  console.log('[bootstrap] better-sqlite3 OK. Launching bot...');
  // Dynamically import the real entry point.
  await import('./index.js');
}

main().catch((err) => {
  console.error('[bootstrap] Fatal:', err);
  process.exit(1);
});
