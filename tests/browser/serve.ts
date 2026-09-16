// The web server Playwright starts: one copy of demo/ in a temporary directory, and the built
// oculus server over it. Nothing here is imported by a spec; `playwright.config.ts` runs it as a
// process and waits for the port.
//
// The copy is what makes the specs safe to write: they add entries, delete them, reorder files and
// scaffold projects, and every one of those writes lands under the system temporary directory. The
// copy's path is asserted to be inside that directory before anything is written into it.
//
// The run reaches nothing of the machine's own, and every one of the four ways is a setting the
// server already reads. OCULUS_LOCAL names this run's own local.yml, written into the config copy,
// which is loadLocal()'s override in src/lib/data/sources/config.ts. OCULUS_CONFIG names that copy
// of the engine's own config/, which is configDir()'s override there, so a spec that presses Save in
// the Slides view writes the copy's present.yml and never the checkout's. HOME names a home
// directory this run made, so the session stores, the session registry and the byte-offset cache are
// the fixture's rather than the owner's.
// PATH puts this run's own `ssh` and `tmux` in front: the Live HPC poller's ssh answers from
// demo/hpc/ instead of opening a connection, and tmux fails, so no terminal and no usage refresh
// starts a process on the machine.
//
// The server refuses to start over a stale build, since src/server.ts imports build/handler.js and a
// spec would otherwise press yesterday's page. What the run made is removed when it exits.

import { spawn, spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildState, copyConfig, removeLeftovers, removeOnExit, takeLock } from './layer.ts';
import { LOCAL_NAME } from '../../src/lib/data/sources/config.ts';

/** The port the browser layer serves on. 8787 is the cockpit's and 8790 the machine's own oculus. */
const PORT = 8792;

/** The name every run's directory starts with, which is how a run finds what an earlier one left. */
const PREFIX = 'oculus-browser-';

/** The one file that says which run owns those directories. */
const LOCK = 'oculus-browser.lock';

/** The ssh alias the Live HPC poller is given, which this run's own ssh answers for. */
const CLUSTER = 'demo-cluster';

/** What the fixture transcript carries in place of the moment it was written and the folder it ran in. */
const WHEN = 'OCULUS_FIXTURE_WHEN';
const CWD = 'OCULUS_FIXTURE_CWD';

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

const built = buildState(engine);
if (!built.current) {
    console.error(`browser layer: ${built.reason}`);
    process.exit(1);
}

// The lock first, and the sweep only behind it. A run that is serving owns its copy, and a second
// run that swept would take that copy away and then fail on the port; with the lock it says so and
// starts nothing. A lock whose run is gone is taken over.
const lock = takeLock(tmpdir(), LOCK, process.pid);
if (!lock.taken) {
    console.error(`browser layer: ${lock.reason}`);
    process.exit(1);
}

// Anything under the run name is now an earlier run's and goes: Playwright signals the layer, but a
// run killed outright removes nothing, however carefully the handlers below are written.
removeLeftovers(tmpdir(), PREFIX);

const temp = mkdtempSync(join(tmpdir(), PREFIX));
const hub = inside(join(temp, 'demo'), tmpdir());
const engineConfig = inside(join(temp, 'config'), tmpdir());
const home = inside(join(temp, 'home'), tmpdir());
const bin = inside(join(temp, 'bin'), tmpdir());
const local = inside(join(engineConfig, LOCAL_NAME), tmpdir());
const marker = inside(join(here, '.hub'), engine);

cpSync(join(engine, 'demo'), hub, { recursive: true });
// The copy is made a git repository of its own, so the Repositories view has something to draw and
// a spec can make a worktree in it. It is committed here, before the run rewrites the dated lead of
// the copy, so the served hub always holds one changed file for the diff pane to open. Every command
// names the copy, which is inside the temporary directory the run owns, and the identity is given on
// the command line so the owner's git configuration is neither read nor written.
function inHub(...args: string[]): void {
    const done = spawnSync(
        'git',
        [
            '-c',
            'user.email=nobody@example.invalid',
            '-c',
            'user.name=Oculus Browser Layer',
            '-c',
            'commit.gpgsign=false',
            '-C',
            inside(hub, tmpdir()),
            ...args
        ],
        { encoding: 'utf8', timeout: 60000 }
    );
    if (done.status !== 0) {
        console.error(`browser layer: git ${args[0]} failed: ${done.stderr}`);
        process.exit(1);
    }
}

writeFileSync(inside(join(hub, '.gitignore'), tmpdir()), '/.agents/worktrees/\n');
inHub('init', '--quiet', '--initial-branch=main');
inHub('add', '--all');
inHub('commit', '--quiet', '-m', 'The demo hub as it is shipped');

// The engine's own YAML, copied so that a write from the page lands here. The Slides view's Save
// rewrites present.yml, and the watcher watching this directory is what pushes the deck back. The
// machine's own local.yml is a file of that folder and is left out of the copy, since this run
// writes its own there and the owner's hub and port are no part of it.
copyConfig(join(engine, 'config'), engineConfig);
// The Focus board draws a position lead only inside `leads_horizon_days` of today, so the demo's
// dated lead is moved to a week from now in the copy: the spec that clicks its line holds on any day.
const leads = inside(join(hub, 'feeds', 'position-leads.yml'), tmpdir());
const soon = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
writeFileSync(
    leads,
    readFileSync(leads, 'utf8').replace('deadline: "2026-09-15"', `deadline: "${soon}"`)
);

// The sessions the page shows: the fixture transcripts, in the store layout ~/.claude/projects that
// server/sessions/transcripts.ts reads, under this run's HOME. A transcript older than the scan's
// window is not read at all, so the copy is stamped with the moment it was made.
const store = inside(join(home, '.claude', 'projects'), tmpdir());
mkdirSync(dirname(store), { recursive: true });
cpSync(join(hub, 'sessions', 'claude', 'projects'), store, { recursive: true });
const now = new Date().toISOString();
for (const folder of readdirSync(store, { withFileTypes: true })) {
    if (!folder.isDirectory()) continue;
    for (const entry of readdirSync(join(store, folder.name))) {
        const file = inside(join(store, folder.name, entry), tmpdir());
        writeFileSync(file, readFileSync(file, 'utf8').split(WHEN).join(now).split(CWD).join(hub));
    }
}

// This run's own commands, in front of the machine's on PATH. The cluster is two fixture files, and
// tmux is nothing at all: a browser run starts no terminal and refreshes no usage account.
mkdirSync(bin, { recursive: true });
const cluster = join(hub, 'hpc');
writeFileSync(
    inside(join(bin, 'ssh'), tmpdir()),
    [
        '#!/bin/sh',
        "# The Live HPC poller's cluster: its two commands answered from demo/hpc/.",
        'for remote; do :; done',
        'case "$remote" in',
        `    *squeue*) cat ${JSON.stringify(join(cluster, 'batch.txt'))} ;;`,
        `    *quota*) cat ${JSON.stringify(join(cluster, 'quota.txt'))} ;;`,
        '    *) echo "browser layer: no fixture for this command" >&2; exit 1 ;;',
        'esac',
        ''
    ].join('\n'),
    { mode: 0o755 }
);
writeFileSync(
    inside(join(bin, 'tmux'), tmpdir()),
    ['#!/bin/sh', 'echo "browser layer: this run has no tmux" >&2', 'exit 1', ''].join('\n'),
    { mode: 0o755 }
);

writeFileSync(local, `hub: ${hub}\nport: ${PORT}\nhpc_host: ${CLUSTER}\n`);
// The specs read the hub's path from here, since a Playwright spec runs in its own process and
// cannot be handed anything by this one. The file is gitignored.
writeFileSync(marker, `${hub}\n`);

const server = spawn(process.execPath, [join(engine, 'src', 'server.ts')], {
    cwd: engine,
    env: {
        ...process.env,
        OCULUS_LOCAL: local,
        OCULUS_CONFIG: engineConfig,
        HOME: home,
        PATH: `${bin}:${process.env.PATH ?? ''}`
    },
    stdio: 'inherit'
});

removeOnExit([temp, marker, lock.path], process, () => server.kill());

server.on('exit', (code, signal) => {
    process.exit(signal === null ? (code ?? 0) : 1);
});
