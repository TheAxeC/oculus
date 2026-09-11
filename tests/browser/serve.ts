// The web server Playwright starts: one copy of demo/ in a temporary directory, and the built
// oculus server over it. Nothing here is imported by a spec; `playwright.config.ts` runs it as a
// process and waits for the port.
//
// The copy is what makes the specs safe to write: they add entries, delete them, reorder files and
// scaffold projects, and every one of those writes lands under the system temporary directory. The
// copy's path is asserted to be inside that directory before anything is written into it.
//
// The server is pointed at the copy through OCULUS_LOCAL rather than through tools/oculus/local.yml,
// so a run leaves the checkout exactly as it found it; that override is loadLocal()'s in
// src/lib/data/sources/config.ts.

import { spawn } from 'node:child_process';
import { cpSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The port the browser layer serves on. 8787 is the cockpit's and 8790 the machine's own oculus. */
const PORT = 8792;

const here = dirname(fileURLToPath(import.meta.url));
const engine = resolve(here, '..', '..');

/** A path is written to only after this says it is inside the directory the run owns. */
function inside(path: string, root: string): string {
    const full = resolve(path);
    if (!full.startsWith(resolve(root) + sep)) {
        throw new Error(`${full} is not inside ${root}`);
    }
    return full;
}

const temp = mkdtempSync(join(tmpdir(), 'oculus-browser-'));
const hub = inside(join(temp, 'demo'), tmpdir());
const local = inside(join(temp, 'local.yml'), tmpdir());

cpSync(join(engine, 'demo'), hub, { recursive: true });
writeFileSync(local, `hub: ${hub}\nport: ${PORT}\n`);
// The specs read the hub's path from here, since a Playwright spec runs in its own process and
// cannot be handed anything by this one. The file is gitignored.
writeFileSync(inside(join(here, '.hub'), engine), `${hub}\n`);

const server = spawn(process.execPath, [join(engine, 'src', 'server.ts')], {
    cwd: engine,
    env: { ...process.env, OCULUS_LOCAL: local },
    stdio: 'inherit'
});

server.on('exit', (code, signal) => {
    process.exit(signal === null ? (code ?? 0) : 1);
});
