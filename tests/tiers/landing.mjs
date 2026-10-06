// Layer 4, test tool. npm run test:landing: the commands the orchestrator runs on main at each
// landing, all at the same time, every one run to its end so that one red does not hide another.
// The type check and the build run one after the other in one lane, since each writes under
// .svelte-kit. The slow tests follow in the same lane: they start the app, whose build writes
// .svelte-kit-app/ and build-app/, folders neither the type check nor the build writes, and the
// start test's server row reads build-app/. The lint keeps its cache in
// node_modules/.cache/eslint/, the one npm run test:quick keeps.
//
// The vitest runs (npm test, npm run test:checks and, in the third lane, npm run test:slow) start
// together over one node_modules/.vite and one .svelte-kit. vite.config.ts turns off the optimized
// dependencies of Vitest's own environment, the one folder in node_modules/.vite that two runs
// rename into, and keeps a vitest start from running SvelteKit's type sync while .svelte-kit holds
// the types, so no vitest run writes .svelte-kit/types; the third lane's `svelte-kit sync` and
// build write them, one after the other. A checkout with no types yet gets them from one
// `svelte-kit sync` run before the commands start. The files the runs share, results.json and
// _svelte_metadata.json under node_modules/.vite/vitest/, are hints that a reader survives torn:
// Vitest reads results.json inside a try and the Svelte plugin reads its metadata inside a try.
// Nothing here staggers or retries the starts.
//
// The list is the unit suite, the tree checks (every file under tests/checks, the ones tagged slow
// included), the type check, the build and the slow tests outside tests/checks (one lane, in that
// order), the format check, the lint over the whole tree and the ASCII gate. The type check and the
// ASCII gate are in it because npm run test:quick holds them and nothing else in this list does.
//
// Each command prints its line when it ends, and its whole output when it failed. The last line
// names the commands that failed, and the exit code is 1 when there is one.

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { ASCII_GATE, BIN, ROOT, judgeAscii, runTask, seconds, show } from './run.mjs';

const NPM = 'npm';

const LIST = [
    ['npm test', NPM, ['test']],
    ['npm run test:checks', NPM, ['run', 'test:checks']],
    [
        'npm run check, then npm run build, then npm run test:slow',
        'sh',
        [
            '-c',
            'npm run check; c=$?; npm run build; b=$?; npm run test:slow; s=$?; ' +
                '[ $c -eq 0 ] && [ $b -eq 0 ] && [ $s -eq 0 ]'
        ]
    ],
    ['npm run format:check', NPM, ['run', 'format:check']],
    [
        'npm run lint',
        NPM,
        ['run', 'lint', '--', '--cache', '--cache-location', 'node_modules/.cache/eslint/']
    ],
    ['ASCII gate', 'sh', ['-c', ASCII_GATE], judgeAscii]
];

const started = Date.now();
const red = [];
console.log(`test:landing: ${LIST.length} commands, from ${ROOT}`);
if (!existsSync(join(ROOT, '.svelte-kit', 'non-ambient.d.ts'))) {
    const synced = await runTask('svelte-kit sync', join(BIN, 'svelte-kit'), ['sync']);
    show(synced);
    if (!synced.ok) red.push(synced.name);
}
await Promise.all(
    LIST.map(async ([name, command, args, judge = (one) => one]) => {
        const result = judge(await runTask(name, command, args));
        show(result);
        if (!result.ok) red.push(name);
    })
);
const verdict = red.length === 0 ? 'every command passed' : `failed: ${red.join(', ')}`;
console.log(`test:landing: ${seconds(Date.now() - started)} s; ${verdict}`);
process.exitCode = red.length === 0 ? 0 : 1;
