// Layer 4, test tool. npm run test:landing: the commands the orchestrator runs on main at each
// landing, as many at the same time as can be, every one run to its end so that one red does not
// hide another.
//
// The build writes SvelteKit's generated types under .svelte-kit (`sync.all`, in SvelteKit's
// `config` hook) with truncating writes, and the unit suite, the tree checks, the slow tests, the
// type check and the lint read them, so a reader started beside that write can find a file empty.
// The build is therefore started first, with the variable TYPES_WRITTEN naming a file that
// vite.config.ts writes once every `config` hook has run, and the readers start when that file
// appears. Nothing writes the types after it (vite.config.ts, `typesLocked` and `kitOptionsOnly`):
// the build's later writes go under .svelte-kit/output, .svelte-kit/generated/client-optimized,
// .svelte-kit/adapter-node and build/, which no reader reads, and the SvelteKit type sync of a
// vitest start is skipped while the types exist. The type check is npm run check without its
// `svelte-kit sync`, since the build has just written the types it would write. A build that ends
// before it writes the file is followed by one `svelte-kit sync`, so the readers still find the
// types and the build's own red line names its failure. The format check and the ASCII gate read
// neither, and start at once.
//
// The slow tests start the app, whose build writes .svelte-kit-app/ and build-app/, folders
// neither the type check nor the build writes, and the start test's server row reads build-app/.
// The lint keeps its cache in node_modules/.cache/eslint/, the one npm run test:quick keeps.
//
// The vitest runs (npm test, npm run test:checks and npm run test:slow) run together over one
// node_modules/.vite. vite.config.ts turns off the optimized dependencies of Vitest's own
// environment, the one folder in node_modules/.vite that two runs rename into. The files the runs
// share, results.json and _svelte_metadata.json under node_modules/.vite/vitest/, are hints that a
// reader survives torn: Vitest reads results.json inside a try and the Svelte plugin reads its
// metadata inside a try.
//
// The list is the unit suite, the tree checks (every file under tests/checks, the ones tagged slow
// included), the build, the type check, the slow tests outside tests/checks, the format check,
// the lint over the whole tree and the ASCII gate. The type check and the ASCII gate are in it
// because npm run test:quick holds them and nothing else in this list does.
//
// Each command prints its line when it ends, and its whole output when it failed. The last line
// names the commands that failed, and the exit code is 1 when there is one.

import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TYPES_WRITTEN } from '../../vite.config.ts';
import { ASCII_GATE, BIN, ROOT, judgeAscii, runTask, seconds, show } from './run.mjs';

const NPM = 'npm';

/** The commands that read neither the generated types nor the build's output. */
const ASIDE = [
    ['npm run format:check', NPM, ['run', 'format:check']],
    ['ASCII gate', 'sh', ['-c', ASCII_GATE], judgeAscii]
];

/** The build, which writes the generated types. */
const BUILD = ['npm run build', NPM, ['run', 'build']];

/** The commands that read the generated types, started once the build has written them. */
const READERS = [
    ['npm test', NPM, ['test']],
    ['npm run test:checks', NPM, ['run', 'test:checks']],
    ['npm run test:slow', NPM, ['run', 'test:slow']],
    [
        'npm run check, without its type sync',
        join(BIN, 'svelte-check'),
        ['--tsconfig', './tsconfig.json']
    ],
    [
        'npm run lint',
        NPM,
        ['run', 'lint', '--', '--cache', '--cache-location', 'node_modules/.cache/eslint/']
    ]
];

/** The sync that writes the types when the build ended before it wrote them. */
const SYNC = ['svelte-kit sync', join(BIN, 'svelte-kit'), ['sync']];

const COUNT = ASIDE.length + 1 + READERS.length;

const red = [];

/** Run one command of the list, print its line and answer when it has ended. */
async function run([name, command, args, judge = (one) => one], extra = {}) {
    const result = judge(await runTask(name, command, args, 0, extra));
    show(result);
    if (!result.ok) red.push(name);
}

/**
 * Answer, once the file `file` exists or the promise `ended` has settled, whether the file exists.
 * The file is looked for every 100 ms.
 */
function appeared(file, ended) {
    return new Promise((done) => {
        let over = false;
        ended.then(() => (over = true));
        const look = () => {
            if (existsSync(file) || over) done(existsSync(file));
            else setTimeout(look, 100);
        };
        look();
    });
}

const started = Date.now();
console.log(`test:landing: ${COUNT} commands, from ${ROOT}`);
const signal = mkdtempSync(join(tmpdir(), 'oculus-landing-'));
const written = join(signal, 'types-written');
const aside = ASIDE.map((one) => run(one));
const built = run(BUILD, { [TYPES_WRITTEN]: written });
if (!(await appeared(written, built))) await run(SYNC);
const readers = READERS.map((one) => run(one));
await Promise.all([...aside, built, ...readers]);
rmSync(signal, { recursive: true, force: true });
const verdict = red.length === 0 ? 'every command passed' : `failed: ${red.join(', ')}`;
console.log(`test:landing: ${seconds(Date.now() - started)} s; ${verdict}`);
process.exitCode = red.length === 0 ? 0 : 1;
