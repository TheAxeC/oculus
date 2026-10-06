// Layer 4, test tool. npm run test:landing: the commands the orchestrator runs on main at each
// landing, all at the same time, every one run to its end so that one red does not hide another.
// The type check and the build run one after the other in one lane, since each writes under
// .svelte-kit. The slow tests follow in the same lane: they start the app, whose build writes
// .svelte-kit-app/ and build-app/, folders neither the type check nor the build writes, and the
// start test's server row reads build-app/. The lint keeps its cache in
// node_modules/.cache/eslint/, the one npm run test:quick keeps.
//
// The list is the unit suite, the tree checks, the type check, the build and the slow tests (one
// lane, in that order), the format check, the lint over the whole tree and the ASCII gate. The type
// check and the ASCII gate are in it because npm run test:quick holds them and nothing else in this
// list does.
//
// Each command prints its line when it ends, and its whole output when it failed. The last line
// names the commands that failed, and the exit code is 1 when there is one.

import { ASCII_GATE, ROOT, judgeAscii, runTask, seconds, show } from './run.mjs';

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
