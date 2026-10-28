// Layer 2, route tests. The git credentials the server context owns reach every git a route starts
// and every terminal a request opens (G135). Each case builds a whole server context with
// `createServerContext` over a planted workspace: a hub whose `.oculus/config.yml` holds the git
// host row of `sign_in` for GitHub, or holds none, a clone of a local bare repository, and a home
// folder whose `~/.oculus/connect/` holds a token saved for `https://github.com`. The git route,
// the clone route and the deposit route are their own `+server.ts` handlers, called with the
// locals hooks.server.ts puts on a request; the terminal is the terminal route's handler given
// that context's options and a tmux that runs nothing. Which gits started, and with which
// arguments, is read from git's own trace (`GIT_TRACE2_EVENT`), one file per request.
//
// What this does NOT cover: the helper's answer to git, which tests/server/core/credentials.test.ts
// runs, and a remote that asks for a credential, since every remote here is a local path.
// @module-tag slow: every case builds a whole server context and starts git.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, vi } from 'vitest';
import { engineDir } from '../../../src/lib/data/sources/config.ts';
import { helperPath } from '../../../src/lib/server/core/git/credentials.ts';
import { writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { handleTerminal } from '../../../src/lib/server/machine/pty/routes.ts';
import { createServerContext, type ServerContext } from '../../../src/lib/server/root/context.ts';
import { POST as clonePost } from '../../../src/routes/api/(git)/clone/+server.ts';
import { POST as depositPost } from '../../../src/routes/api/(git)/deposit/+server.ts';
import { POST as gitPost } from '../../../src/routes/api/(git)/git/+server.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { gitIn, isolateDepositGit, writeInside } from '../../fixtures/hubs/deposit-world.ts';
import { plantHub } from '../../fixtures/hubs/workspace.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import {
    inertDependencies,
    scratchEngine,
    scratchReadMachine
} from '../../server/root/inert-context.ts';
import { tmux } from '../sessions/terminal-fixture.ts';

isolateDepositGit();

const HOST = 'http://127.0.0.1:8791';
const ADDRESS = 'https://github.com';

/** The helper git is told to ask for the signed-in host, as the server names it. */
const COMMAND = `!ELECTRON_RUN_AS_NODE=1 '${process.execPath}' '${helperPath(engineDir())}' 'github' '${ADDRESS}'`;

/** The `-c` arguments every git is given for the signed-in host, ahead of its own. */
const PAIRS = [
    '-c',
    `credential.${ADDRESS}.helper=`,
    '-c',
    `credential.${ADDRESS}.helper=${COMMAND}`
];

/** The same pairs as the variables a terminal's session is started with. */
const ENV = [
    'GIT_CONFIG_COUNT=2',
    `GIT_CONFIG_KEY_0=credential.${ADDRESS}.helper`,
    'GIT_CONFIG_VALUE_0=',
    `GIT_CONFIG_KEY_1=credential.${ADDRESS}.helper`,
    `GIT_CONFIG_VALUE_1=${COMMAND}`
];

/** The git host row of `sign_in` for GitHub, naming the address the saved token was granted for. */
const SIGN_IN = [
    'sign_in:',
    '  - key: github',
    '    name: GitHub',
    '    device_code: https://github.com/login/device/code',
    '    token: https://github.com/login/oauth/access_token',
    '    user: https://api.github.com/user',
    '    git_scope: repo',
    `    credential_address: ${ADDRESS}`
];

/** The two states of the hub's settings a case runs in. */
const STATES = [
    { state: 'a signed-in host whose sign_in row names the address', signedIn: true },
    { state: 'the sign_in row removed', signedIn: false }
];

let live: ServerContext | undefined;

afterEach(() => {
    live?.close();
    live = undefined;
    vi.unstubAllEnvs();
});

/** One case's workspace, the context built over it, and the folders a request names. */
type World = { context: ServerContext; dir: string; repo: string; bare: string };

/**
 * A home folder holding the saved GitHub token, a bare repository with one commit, its clone, and a
 * hub whose settings hold the GitHub row of `sign_in` when `signedIn`, with the project `alpha`
 * whose deposit lives at the bare repository; a workspace of the hub and the clone, opened; and
 * the server context over it with every watcher inert.
 */
function world(signedIn: boolean): World {
    const dir = scratchDir('oculus-route-credentials-');
    const home = join(dir, 'home');
    writeInside(
        dir,
        home,
        join('.oculus', 'connect', 'git-github.json'),
        JSON.stringify({
            client_id: 'Iv1.abc',
            token: 'gho_the_token_of_this_case',
            login: 'reader',
            credential_address: ADDRESS
        })
    );
    vi.stubEnv('HOME', home);

    const bare = join(dir, 'remote', 'code.git');
    mkdirSync(join(dir, 'remote'));
    execFileSync('git', ['init', '--bare', '-q', '-b', 'main', bare]);
    const seed = join(dir, 'seed');
    writeInside(dir, seed, 'README.md', '# code\n');
    gitIn(seed, 'init', '-q', '-b', 'main');
    gitIn(seed, 'add', 'README.md');
    gitIn(seed, 'commit', '-q', '-m', 'Add the readme');
    gitIn(seed, 'remote', 'add', 'origin', bare);
    gitIn(seed, 'push', '-q', '-u', 'origin', 'main');
    gitIn(dir, 'clone', '-q', bare, 'repo');
    const repo = join(dir, 'repo');

    const hub = plantHub(
        join(dir, 'hub'),
        [...(signedIn ? SIGN_IN : []), 'scan:', '  - { dir: projects/manuscripts }', ''].join('\n')
    );
    const alpha = join('projects', 'manuscripts', 'alpha');
    writeInside(
        dir,
        hub,
        join(alpha, 'project.yml'),
        [
            'id: alpha',
            'tier: research',
            'stage: exploring',
            'title: "Alpha"',
            'code_availability:',
            '  status: deposited',
            `  url: "${bare}"`,
            ''
        ].join('\n')
    );
    writeInside(dir, hub, join(alpha, 'code', 'run.py'), 'print(1)\n');
    const file = join(hub, '.oculus', 'workspaces', 'main.yml');
    writeInside(
        dir,
        hub,
        join('.oculus', 'workspaces', 'main.yml'),
        `folders:\n  - { name: hub, path: ${hub} }\n  - { name: repo, path: ${repo} }\nprimary: hub\n`
    );
    const state = join(dir, 'state');
    mkdirSync(state);
    writeState(state, { open: file, recent: [file], unsaved: { folders: [] } });

    const engine = scratchEngine('oculus-route-credentials-engine-');
    const context = createServerContext(engine, {
        ...inertDependencies(),
        stateFolder: () => state,
        readMachine: scratchReadMachine(engine)
    });
    live = context;
    return { context, dir, repo, bare };
}

/** The event a route handler is called with: the request and the locals hooks.server.ts sets. */
function event(context: ServerContext, path: string, body: unknown): never {
    const locals = {
        server: context,
        token: context.token,
        config: () => context.configCache.read()
    };
    return { request: pagePost(`${HOST}${path}`, body, context.token), locals } as never;
}

/**
 * The argument vectors, the program's name left out, of every git `act` started itself (a git
 * that git started for it is left out), read from git's trace of the requests in `act` alone.
 */
async function started(act: () => Promise<Response>): Promise<string[][]> {
    const file = join(scratchDir('oculus-route-credentials-trace-'), 'events.json');
    process.env.GIT_TRACE2_EVENT = file;
    let answer: Response;
    try {
        answer = await act();
    } finally {
        Reflect.deleteProperty(process.env, 'GIT_TRACE2_EVENT');
    }
    expect(answer.status, await answer.clone().text()).toBe(200);
    if (!existsSync(file)) return [];
    return readFileSync(file, 'utf8')
        .split('\n')
        .filter((line) => line !== '')
        .map((line) => JSON.parse(line) as { event: string; sid: string; argv?: string[] })
        .filter((one) => one.event === 'start' && !one.sid.includes('/'))
        .map((one) => (one.argv ?? []).slice(1));
}

/**
 * That a git of the subcommand `word` started, and that every git started carries the pairs ahead
 * of its own arguments when the host is signed in, and no credential setting at all when not.
 */
function expectCarried(starts: string[][], word: string, signedIn: boolean): void {
    expect(starts.some((argv) => argv.includes(word))).toBe(true);
    for (const argv of starts) {
        if (signedIn) expect(argv.slice(0, PAIRS.length)).toEqual(PAIRS);
        else expect(argv.join(' ')).not.toContain('credential.');
    }
}

describe('the gits the git route starts', () => {
    it.each(STATES)(
        'carry the pairs for Fetch, Pull, Push and Sync with $state (G135)',
        async ({ signedIn }) => {
            const { context, repo } = world(signedIn);
            const send = (action: string) => () =>
                Promise.resolve(
                    gitPost(event(context, '/api/git', { action, root: repo, confirm: true }))
                );
            expectCarried(await started(send('fetch')), 'fetch', signedIn);
            expectCarried(await started(send('pull')), 'pull', signedIn);
            gitIn(repo, 'commit', '-q', '--allow-empty', '-m', 'Add an empty commit');
            expectCarried(await started(send('push')), 'push', signedIn);
            const synced = await started(send('sync'));
            expectCarried(synced, 'pull', signedIn);
            expectCarried(synced, 'push', signedIn);
        }
    );
});

describe('the gits the clone route starts', () => {
    it.each(STATES)(
        'carry the pairs for a clone of a repository with $state (G135)',
        async ({ signedIn }) => {
            const { context, dir, bare } = world(signedIn);
            const parent = join(dir, 'clones');
            mkdirSync(parent);
            const body = { action: 'github-clone', repo: { name: 'code', url: bare }, parent };
            const starts = await started(() =>
                Promise.resolve(clonePost(event(context, '/api/clone', body)))
            );
            expectCarried(starts, 'clone', signedIn);
            expect(existsSync(join(parent, 'code', 'README.md'))).toBe(true);
        }
    );
});

describe('the gits the deposit route starts', () => {
    it.each(STATES)(
        'carry the pairs for an adopt and a plan with $state (G135)',
        async ({ signedIn }) => {
            const { context } = world(signedIn);
            const send = (action: string) => () =>
                Promise.resolve(
                    depositPost(event(context, '/api/deposit', { action, id: 'hub:alpha' }))
                );
            expectCarried(await started(send('adopt')), 'clone', signedIn);
            expectCarried(await started(send('plan')), 'status', signedIn);
        }
    );
});

describe('a terminal a request opens', () => {
    it.each(STATES)('carries the GIT_CONFIG pairs with $state (G135)', async ({ signedIn }) => {
        const { context, repo } = world(signedIn);
        const driver = tmux();
        const body = { action: 'start', kind: 'shell', cwd: repo, cols: 80, rows: 24 };
        const response = await handleTerminal(
            pagePost(`${HOST}/api/terminal`, body, context.token),
            context.token,
            {
                engine: context.engine,
                hubSettings: context.configCache.hub,
                recordFor: () => null,
                openFor: () => context.workspace.open(),
                configFor: () => context.configCache.read().config,
                localFor: () => context.machine(),
                run: driver.run,
                credentials: context.credentials
            }
        );
        expect(response.status).toBe(200);
        const start = driver.calls.find((call) => call[0] === 'new-session') ?? [];
        const variables = start
            .slice(0, start.indexOf('--'))
            .filter((word, at, words) => words[at - 1] === '-e' && word.startsWith('GIT_CONFIG'));
        expect(variables).toEqual(signedIn ? ENV : []);
    });
});
