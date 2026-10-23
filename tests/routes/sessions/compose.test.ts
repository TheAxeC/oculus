// Layer 2, route tests. POST /api/terminal's composer actions: compose starts the session the
// composer asked for, steer types a message into a running one and sends it, interrupt stops its
// turn, and fork starts a new session carrying an old one's conversation.
//
// Nothing here runs tmux, `claude` or `codex`: handleTerminal is called with the tmux double of
// terminal-fixture.ts, which records every argv. The engine is a scratch folder holding a copy of
// the shipped config/catalogs/agents.yml, and every account is a scratch folder.

import { copyFileSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import {
    handleTerminal,
    type TerminalOptions
} from '../../../src/lib/server/machine/pty/routes.ts';
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
    lineOf,
    tmux,
    worldOf
} from './terminal-fixture.ts';

test.afterAll(() => {
    SERVER.close();
});

const BIN = '/opt/Claude CLI/claude';

/** An engine whose config folder holds the shipped agents catalog and nothing else. */
let ENGINE = '';

/** The second Claude account's folder. */
let SECOND = '';

/** The machine-local values with the Claude command and the three accounts. */
function localOf(second: string) {
    return {
        ...localDefaults(),
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
    LOCAL = localOf(SECOND);
});

/** The route with the recording tmux, this suite's engine and its accounts. */
async function post(
    body: Record<string, unknown>,
    recordFor = source(),
    over: Partial<TerminalOptions> = {}
) {
    const driver = tmux();
    const response = await handleTerminal(request({ cols: 80, rows: 24, ...body }), TOKEN, {
        ...worldOf(),
        engine: ENGINE,
        run: driver.run,
        localFor: () => LOCAL,
        configFor: () => BASE_CHAT_CONFIG,
        recordFor,
        ...over
    });
    const started = driver.calls.find((args) => args[0] === 'new-session') ?? [];
    return {
        response,
        calls: driver.calls,
        started,
        argv: lineOf(started)
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
});

describe('POST /api/terminal, a start in a mode the catalog marks confirm: true', () => {
    const CASES: [string, string, number, Record<string, string>][] = [
        ['claude', 'Bypass permissions', 400, { mode: 'bypassPermissions' }],
        ['claude', 'Accept edits', 400, { mode: 'acceptEdits' }],
        ['claude', 'Auto', 400, { mode: 'auto' }],
        ['codex', 'Full access', 400, { sandbox: 'danger-full-access' }],
        ['codex', 'Never', 400, { approval: 'never' }],
        ['claude', 'Plan', 200, { mode: 'plan' }],
        ['codex', 'Workspace write', 200, { sandbox: 'workspace-write' }]
    ];

    it.each(CASES)(
        'a %s start with %s and no confirm flag answers %s',
        async (agent, label, status, picks) => {
            const asked = await post({ action: 'compose', agent, cwd: HERE, picks, prompt: 'hi' });
            expect(asked.response.status).toBe(status);
            if (status === 400) {
                expect(await answer(asked.response)).toEqual({
                    error: 'needs-confirm',
                    names: [label]
                });
                expect(asked.calls).toEqual([]);
                const confirmed = await post({
                    action: 'compose',
                    agent,
                    cwd: HERE,
                    picks,
                    prompt: 'hi',
                    confirm: true
                });
                expect(confirmed.response.status).toBe(200);
                expect(confirmed.started.length).toBeGreaterThan(0);
            } else {
                expect(asked.started.length).toBeGreaterThan(0);
            }
        }
    );
});

describe('POST /api/terminal, a start with a task', () => {
    let hub = '';
    let approvals = '';
    const REF = { id: 'hub:Submission', collection: 'tasks' };

    /** The tasks file with one entry whose note is `note`. */
    function plant(note: string): void {
        writeFileSync(
            join(hub, '.oculus', 'data', 'academic', 'tasks.yml'),
            `title: Tasks\nschema:\n  - { field: title, type: text }\nentries:\n  - title: Submission\n    status: todo\n    note: "${note}"\n`
        );
    }

    /** The route over the task hub and this case's approvals file. */
    function postTask(body: Record<string, unknown>) {
        return post(body, source(), {
            openFor: worldOf(hub).openFor,
            approvalsFor: () => approvals
        });
    }

    /** The seed the page is shown for the task, as the `seed` action answers it. */
    async function seedOf(): Promise<{ seed: string; cwd: string }> {
        const shown = await postTask({ action: 'seed', task: REF });
        return (await answer(shown.response)) as { seed: string; cwd: string };
    }

    test.beforeAll(() => {
        hub = scratchDir('oculus-task-hub-');
        mkdirSync(join(hub, '.oculus', 'data', 'academic'), { recursive: true });
    });

    test.beforeEach(() => {
        approvals = join(scratchDir('oculus-task-approvals-'), 'approvals.json');
        plant('first note');
    });

    const start = (shown: { seed: string; cwd: string }, over: Record<string, unknown> = {}) => ({
        action: 'compose',
        agent: 'claude',
        cwd: shown.cwd,
        task: REF,
        seed: shown.seed,
        prompt: '',
        ...over
    });

    it('asks for the approval of an unapproved seed and starts nothing', async () => {
        const shown = await seedOf();
        const asked = await postTask(start(shown));
        expect(asked.response.status).toBe(200);
        expect(await answer(asked.response)).toEqual({
            approve: { seed: shown.seed, cwd: realpathSync(shown.cwd), agent: 'claude' }
        });
        expect(asked.started).toEqual([]);
    });

    it('starts the seed once its exact seed, folder and agent are approved', async () => {
        const shown = await seedOf();
        const approved = await postTask({
            action: 'approve-seed',
            task: REF,
            cwd: shown.cwd,
            agent: 'claude',
            seed: shown.seed
        });
        expect(await answer(approved.response)).toEqual({ ok: true });
        const started = await postTask(start(shown));
        expect(started.response.status).toBe(200);
        expect(started.argv.at(-1)).toBe(shown.seed);
    });

    /** Approve the seed shown now for Claude in its own folder. */
    async function approveShown(shown: { seed: string; cwd: string }): Promise<void> {
        await postTask({
            action: 'approve-seed',
            task: REF,
            cwd: shown.cwd,
            agent: 'claude',
            seed: shown.seed
        });
    }

    it('asks again when the seed changed', async () => {
        const shown = await seedOf();
        await approveShown(shown);
        plant('second note');
        const changed = await seedOf();
        expect(changed.seed).not.toBe(shown.seed);
        const again = await postTask(start(changed));
        expect(Object.keys(await answer(again.response))).toEqual(['approve']);
        expect(again.started).toEqual([]);
    });

    it('asks again when the agent is another', async () => {
        const shown = await seedOf();
        await approveShown(shown);
        const codex = await postTask(start(shown, { agent: 'codex' }));
        expect(Object.keys(await answer(codex.response))).toEqual(['approve']);
        expect(codex.started).toEqual([]);
    });

    it('asks again when the folder is another', async () => {
        const shown = await seedOf();
        await approveShown(shown);
        const elsewhere = await postTask(start(shown, { cwd: HERE }));
        expect(Object.keys(await answer(elsewhere.response))).toEqual(['approve']);
        expect(elsewhere.started).toEqual([]);
    });
});
