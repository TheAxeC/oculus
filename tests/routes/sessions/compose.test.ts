// Layer 2, server tests. POST /api/terminal's composer actions: compose starts the session the
// composer asked for, steer types a message into a running one and sends it, interrupt stops its
// turn, and fork starts a new session carrying an old one's conversation.
//
// Nothing here runs tmux, `claude` or `codex`: handleTerminal is called with the tmux double of
// terminal-fixture.ts, which records every argv. The engine is a scratch folder holding a copy of
// the shipped config/catalogs/agents.yml, and every account is a scratch folder.

import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';
import { handleTerminal } from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir, localDefaults } from '../../../src/lib/data/sources/config.ts';
import { record } from '../../fixtures/sessions-fixture.ts';
import {
    BASE_CHAT_CONFIG,
    HERE,
    SERVER,
    SESSION,
    TASK_CONFIG,
    TOKEN,
    answer,
    engineWith,
    request,
    source,
    tmux
} from './terminal-fixture.ts';

afterAll(sweepScratch);

afterAll(() => {
    SERVER.close();
    rmSync(TASK_CONFIG, { recursive: true, force: true });
});

/** An engine whose config folder holds the shipped agents catalog and nothing else. */
const ENGINE = engineWith('compose-engine');
mkdirSync(join(ENGINE, 'config', 'catalogs'), { recursive: true });
copyFileSync(
    join(engineDir(), 'config', 'catalogs', 'agents.yml'),
    join(ENGINE, 'config', 'catalogs', 'agents.yml')
);

const BIN = '/opt/Claude CLI/claude';
const SECOND = scratchDir('oculus-second-account-');

const LOCAL = {
    ...localDefaults(ENGINE),
    hub: HERE,
    claudeBin: BIN,
    accounts: [
        { tool: 'claude' as const, label: 'Home', dir: join(homedir(), '.claude') },
        { tool: 'claude' as const, label: 'University', dir: SECOND },
        { tool: 'codex' as const, label: 'Work', dir: join(homedir(), '.codex') }
    ]
};

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

describe('POST /api/terminal, the compose action', () => {
    // revert: src/lib/server/machine/pty/routes.ts:225 => options
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

    // revert: src/lib/server/machine/pty/routes.ts:223 => env: {}
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

    // revert: src/lib/server/machine/pty/routes.ts:227 => if (composed.keys.trim() === 'never') await steerTerminal(id, composed.keys, options);
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
            ['-l', '--', 'ls -la; echo "$HOME"'],
            ['--', 'Enter']
        ]);
        const quiet = await post({ action: 'compose', agent: 'shell', cwd: HERE, prompt: ' ' });
        // a blank prompt is no first command, so the shell is left at its own prompt
        expect(quiet.calls.filter((args) => args[0] === 'send-keys')).toEqual([]);
    });

    // revert: src/lib/server/machine/pty/compose.ts:105 => if (found === undefined) return own[0] ?? null;
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

    // revert: src/lib/server/machine/pty/sessions.ts:429 => return [sendKeysArgs(id, { key: text }), sendKeysArgs(id, { key: 'Enter' })];
    it('types the message as literal keys after `--`, then Enter', async () => {
        const text = '-n two\nlines "$HOME"';
        const { response, calls } = await post({ action: 'steer', id: ID, text });
        expect(response.status).toBe(200);
        expect(calls).toEqual([
            ['send-keys', '-t', `oculus-${ID}`, '-l', '--', text],
            ['send-keys', '-t', `oculus-${ID}`, '--', 'Enter']
        ]);
    });

    // revert: src/lib/server/machine/pty/sessions.ts:443 => if (/[\u0000-\u0008]/.test(text)) {
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

    // revert: src/lib/server/machine/pty/sessions.ts:455 => await (options.run ?? run)(sendKeysArgs(id, { key: 'C-c' }), options);
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

    // revert: src/lib/server/machine/pty/routes.ts:167 => if (resume.tool === 'claude') return args;
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

    // revert: src/lib/server/machine/pty/routes.ts:168 => return ['codex', 'resume', resume.id];
    it('forks a Codex session with codex fork', async () => {
        const codex = record(SESSION, { tool: 'codex', live: false, cwd: HERE });
        const { argv } = await post({ action: 'fork', tool: 'codex', id: SESSION }, source(codex));
        expect(argv).toEqual(['env', '-u', 'CODEX_HOME', 'codex', 'fork', SESSION]);
    });

    // revert: src/lib/server/machine/pty/compose.ts:142 => return null;
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

    // revert: src/lib/server/machine/pty/routes.ts:178 => if (record === null) return json(400, { error: UNKNOWN });
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
