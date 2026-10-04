// Layer 2, route tests. POST /api/terminal's composer actions: compose starts the session the
// composer asked for, steer types a message into a running one and sends it, interrupt stops its
// turn, and fork starts a new session carrying an old one's conversation.
//
// Nothing here runs tmux, `claude` or `codex`: handleTerminal is called with the tmux double of
// terminal-fixture.ts, which records every argv. The engine is a scratch folder holding a copy of
// the shipped config/catalogs/agents.yml, and every account is a scratch folder.

import { copyFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { handleTerminal } from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir, localDefaults } from '../../../src/lib/data/sources/config.ts';
import { record } from '../../fixtures/sessions-fixture.ts';
import {
    BASE_CHAT_CONFIG,
    HERE,
    SERVER,
    SESSION,
    TOKEN,
    answer,
    engineWith,
    makeTaskConfig,
    request,
    source,
    tmux
} from './terminal-fixture.ts';

test.afterAll(() => {
    SERVER.close();
});

const BIN = '/opt/Claude CLI/claude';

/** An engine whose config folder holds the shipped agents catalog and nothing else. */
let ENGINE = '';

/** The second Claude account's folder. */
let SECOND = '';

/** The machine-local values of the engine, with the three accounts. */
function localOf(engine: string, second: string) {
    return {
        ...localDefaults(engine),
        hub: HERE,
        claudeBin: BIN,
        accounts: [
            { tool: 'claude' as const, label: 'Home', dir: join(homedir(), '.claude') },
            { tool: 'claude' as const, label: 'University', dir: second },
            { tool: 'codex' as const, label: 'Work', dir: join(homedir(), '.codex') }
        ]
    };
}

let LOCAL: ReturnType<typeof localOf>;

// The engine and the account are made before the file's first case, so a run that skips every case
// makes none.
test.beforeAll(() => {
    ENGINE = engineWith(makeTaskConfig().root, 'compose-engine');
    mkdirSync(join(ENGINE, 'config', 'catalogs'), { recursive: true });
    copyFileSync(
        join(engineDir(), 'config', 'catalogs', 'agents.yml'),
        join(ENGINE, 'config', 'catalogs', 'agents.yml')
    );
    SECOND = scratchDir('oculus-second-account-');
    LOCAL = localOf(ENGINE, SECOND);
});

/** The route with the recording tmux, this suite's engine and its accounts. */
async function post(body: Record<string, unknown>, recordFor = source()) {
    const driver = tmux();
    const response = await handleTerminal(request({ cols: 80, rows: 24, ...body }), TOKEN, {
        engine: ENGINE,
        run: driver.run,
        localFor: () => LOCAL,
        configFor: () => BASE_CHAT_CONFIG,
        recordFor
    });
    const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
    return {
        response,
        calls: driver.calls,
        started,
        argv: started.slice(started.indexOf('--') + 1)
    };
}

/** The hex words `send-keys -H` types a text's UTF-8 bytes as. */
function bytes(text: string): string[] {
    return Array.from(Buffer.from(text, 'utf8'), (byte) => byte.toString(16).padStart(2, '0'));
}

describe('POST /api/terminal, the compose action', () => {
    it('starts the agent with its picks and the prompt as one argument, in the workspace', async () => {
        const prompt = `$(touch x); echo "q' ; rm -rf ~"`;
        const { response, started, argv } = await post({
            action: 'compose',
            agent: 'claude',
            cwd: HERE,
            picks: { model: 'opus', effort: 'high' },
            prompt
        });
        expect(response.status).toBe(200);
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        expect(argv).toEqual([
            'env',
            '-u',
            'CLAUDE_CONFIG_DIR',
            BIN,
            '--model',
            'opus',
            '--effort',
            'high',
            '--permission-mode',
            'manual',
            '--',
            prompt
        ]);
        const terminal = (await answer(response)).terminal as { id: string };
        expect(terminal.id.endsWith('-claude')).toBe(true);
    });

    it("passes a second account's folder with tmux's -e, and not the tool's own", async () => {
        const { started, argv } = await post({
            action: 'compose',
            agent: 'claude',
            cwd: HERE,
            account: 'University',
            prompt: 'hi'
        });
        expect(started.slice(started.indexOf('-e'), started.indexOf('-e') + 2)).toEqual([
            '-e',
            `CLAUDE_CONFIG_DIR=${SECOND}`
        ]);
        expect(argv[0]).toBe(BIN);
    });

    it('starts a shell with no argument vector and types its prompt into it as keys, then Enter', async () => {
        const { response, calls, argv } = await post({
            action: 'compose',
            agent: 'shell',
            cwd: HERE,
            prompt: 'ls -la; echo "$HOME"'
        });
        expect(response.status).toBe(200);
        expect(argv).toHaveLength(1);
        const keys = calls.filter((args) => args[0] === 'send-keys');
        expect(keys.map((args) => args.slice(3))).toEqual([
            ['-H', ...bytes('ls -la; echo "$HOME"')],
            ['--', 'Enter']
        ]);
        const quiet = await post({ action: 'compose', agent: 'shell', cwd: HERE, prompt: ' ' });
        // a blank prompt is no first command, so the shell is left at its own prompt
        expect(quiet.calls.filter((args) => args[0] === 'send-keys')).toEqual([]);
    });

    it('refuses a pick the catalog does not offer, an account it does not hold and a cwd that is not a folder, before tmux runs', async () => {
        for (const body of [
            { picks: { model: 'gpt' } },
            { account: 'Nobody' },
            { cwd: join(HERE, 'oculus-no-such-folder-for-s2') },
            { prompt: 'a\u001bb' }
        ]) {
            const { response, started } = await post({
                action: 'compose',
                agent: 'claude',
                cwd: HERE,
                prompt: 'p',
                ...body
            });
            expect(response.status).toBe(400);
            expect(started).toEqual([]);
        }
    });
});

describe('POST /api/terminal, the steer and interrupt actions', () => {
    const ID = 'a1b2c3-claude';

    it('types the message as its UTF-8 bytes in hex, then Enter', async () => {
        const text = '-n two\nlines "$HOME"';
        const { response, calls } = await post({ action: 'steer', id: ID, text });
        expect(response.status).toBe(200);
        expect(calls).toEqual([
            ['send-keys', '-t', `oculus-${ID}`, '-H', ...bytes(text)],
            ['send-keys', '-t', `oculus-${ID}`, '--', 'Enter']
        ]);
    });

    it('refuses a message holding a key of its own, an empty one and a session oculus did not start', async () => {
        for (const body of [
            { id: ID, text: 'stop\u001b' },
            { id: ID, text: '\u0003' },
            { id: ID, text: '   ' },
            { id: ID, text: 'x'.repeat(100_001) },
            { id: 'scratch', text: 'hello' },
            { id: '', text: 'hello' }
        ]) {
            const { response, calls } = await post({ action: 'steer', ...body });
            expect(response.status).toBe(400);
            expect(calls).toEqual([]);
        }
    });

    it('interrupts with Escape, and refuses a session oculus did not start', async () => {
        const { response, calls } = await post({ action: 'interrupt', id: ID });
        expect(response.status).toBe(200);
        expect(calls).toEqual([['send-keys', '-t', `oculus-${ID}`, '--', 'Escape']]);
        const foreign = await post({ action: 'interrupt', id: 'scratch' });
        expect(foreign.response.status).toBe(400);
        expect(foreign.calls).toEqual([]);
    });
});

describe('POST /api/terminal, the fork action', () => {
    const live = record(SESSION, { live: true, state: 'working', cwd: HERE, title: 'A run' });

    it('forks a Claude session, live or not, with --fork-session in its own folder', async () => {
        const { response, argv, started } = await post(
            { action: 'fork', tool: 'claude', id: SESSION },
            source(live)
        );
        expect(response.status).toBe(200);
        expect(argv).toEqual([
            'env',
            '-u',
            'CLAUDE_CONFIG_DIR',
            'claude',
            '--resume',
            SESSION,
            '--fork-session'
        ]);
        expect(started[started.indexOf('-c') + 1]).toBe(HERE);
        const terminal = (await answer(response)).terminal as { name: string };
        expect(terminal.name).toBe('fork of A run');
    });

    it('forks a Codex session with codex fork', async () => {
        const codex = record(SESSION, { tool: 'codex', live: false, cwd: HERE });
        const { argv } = await post({ action: 'fork', tool: 'codex', id: SESSION }, source(codex));
        expect(argv).toEqual(['env', '-u', 'CODEX_HOME', 'codex', 'fork', SESSION]);
    });

    it('starts a fork under the account whose folder holds the transcript', async () => {
        const second = record(SESSION, {
            live: false,
            cwd: HERE,
            path: join(SECOND, 'projects', 'x', `${SESSION}.jsonl`)
        });
        const { started, argv } = await post(
            { action: 'fork', tool: 'claude', id: SESSION },
            source(second)
        );
        expect(started).toContain(`CLAUDE_CONFIG_DIR=${SECOND}`);
        expect(argv[0]).toBe('claude');
    });

    it('refuses a session it does not hold, one of the other tool, and an id of the wrong shape', async () => {
        const codex = record(SESSION, { tool: 'codex', cwd: HERE });
        for (const [body, held] of [
            [{ tool: 'claude', id: SESSION }, source()],
            [{ tool: 'claude', id: SESSION }, source(codex)],
            [{ tool: 'claude', id: 'not-a-session' }, source(live)],
            [{ tool: 'shell', id: SESSION }, source(live)]
        ] as const) {
            const { response, started } = await post({ action: 'fork', ...body }, held);
            expect(response.status).toBe(400);
            expect(started).toEqual([]);
        }
    });
});
