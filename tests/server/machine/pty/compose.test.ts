// Layer 2, server test. What a composer start runs (server/machine/pty/compose.ts): the argument
// vector out of config/catalogs/agents.yml and the picks, the account as the agent's environment,
// the prompt as the vector's one last word, and GET /api/agents answering the same catalog.
//
// The last case starts a real tmux on a private socket in a scratch directory, with a stub in place
// of Claude that writes the arguments it was given, and hands it a prompt that a shell would run:
// the file the prompt would touch must not exist and the prompt must arrive byte for byte. The
// stub's pane is also given HOME as the scratch directory, so that were a shell ever to read the
// prompt, its `~` would be the scratch directory and not the reader's home. Nothing under
// ~/.claude, ~/.codex or ~/.oculus is read: every account here is a scratch folder.

import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it, vi } from 'vitest';
import {
    accountChoices,
    accountEnv,
    accountFor,
    compose,
    composeRequest,
    handleAgents,
    IMAGES_MAX,
    PROMPT_MAX,
    readAgentsFile
} from '../../../../src/lib/server/machine/pty/compose.ts';
import { startTerminal, stopTerminal } from '../../../../src/lib/server/machine/pty/sessions.ts';
import { run, type TmuxOptions } from '../../../../src/lib/server/machine/pty/tmux.ts';
import { engineDir, localDefaults } from '../../../../src/lib/data/sources/config.ts';
import type {
    AgentAccount,
    AgentsAnswer,
    ComposeStart
} from '../../../../src/lib/data/model/index.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

vi.setConfig({ testTimeout: 30000 });

const ENGINE = engineDir();
const CHOICES = readAgentsFile(ENGINE).agents;
const BIN = '/opt/Claude Code/claude';
const WORK = scratchDir('oculus-compose-');
const SECOND = scratchDir('oculus-account-');

/** Two Claude accounts, the tool's own folder first, and one Codex account of a scratch folder. */
const ACCOUNTS: AgentAccount[] = [
    { tool: 'claude', label: 'Home', dir: join(homedir(), '.claude') },
    { tool: 'claude', label: 'University', dir: SECOND },
    { tool: 'codex', label: 'Work', dir: SECOND }
];

function start(over: Partial<ComposeStart>): ComposeStart {
    return {
        agent: 'claude',
        cwd: WORK,
        account: '',
        picks: {},
        prompt: 'hello',
        images: [],
        ...over
    };
}

describe('a composed start', () => {
    it('runs the agent with its picks, `--` and the prompt as one last word', () => {
        const composed = compose(
            start({ picks: { model: 'opus', mode: 'plan' }, prompt: '-p a "quoted" $HOME' }),
            CHOICES,
            ACCOUNTS,
            BIN
        );
        expect(composed).toEqual({
            argv: [
                'env',
                '-u',
                'CLAUDE_CONFIG_DIR',
                BIN,
                '--model',
                'opus',
                '--permission-mode',
                'plan',
                '--',
                '-p a "quoted" $HOME'
            ],
            env: {},
            keys: ''
        });
    });

    it("passes a second account's folder through the environment, and takes the default's away", () => {
        const second = compose(start({ account: 'University' }), CHOICES, ACCOUNTS, BIN);
        expect(second.env).toEqual({ CLAUDE_CONFIG_DIR: SECOND });
        expect(second.argv?.slice(0, 1)).toEqual([BIN]);
        const home = compose(start({ account: 'Home' }), CHOICES, ACCOUNTS, BIN);
        expect(home.env).toEqual({});
        expect(home.argv?.slice(0, 3)).toEqual(['env', '-u', 'CLAUDE_CONFIG_DIR']);
        expect(accountEnv('codex', null)).toEqual({ prefix: ['env', '-u', 'CODEX_HOME'], env: {} });
    });

    it('takes the first account of the agent for an empty label, and refuses one it does not hold', () => {
        expect(accountFor('claude', '', ACCOUNTS)?.label).toBe('Home');
        expect(accountFor('codex', '', ACCOUNTS)?.label).toBe('Work');
        expect(() => accountFor('claude', 'Work', ACCOUNTS)).toThrow(
            'account is not a claude account: Work'
        );
        expect(accountFor('claude', '', [])).toBe(null);
    });

    it('attaches a Codex image with -i before the prompt, and only one inside the workspace', () => {
        const image = join(WORK, 'shot.png');
        const codex = compose(
            start({ agent: 'codex', account: 'Work', images: [image], prompt: 'look' }),
            CHOICES,
            ACCOUNTS,
            BIN
        );
        expect(codex.argv).toEqual(['codex', '-s', 'workspace-write', '-i', image, '--', 'look']);
        expect(codex.env).toEqual({ CODEX_HOME: SECOND });
        expect(() =>
            compose(start({ agent: 'codex', images: ['/etc/hosts'] }), CHOICES, ACCOUNTS, BIN)
        ).toThrow('image must be a file inside the workspace: /etc/hosts');
        expect(() =>
            compose(start({ agent: 'codex', images: ['shot.png'] }), CHOICES, ACCOUNTS, BIN)
        ).toThrow('image must be a file inside the workspace');
        expect(() =>
            compose(start({ agent: 'codex', images: [WORK] }), CHOICES, ACCOUNTS, BIN)
        ).toThrow('image must be a file inside the workspace');
        expect(() => compose(start({ images: [image] }), CHOICES, ACCOUNTS, BIN)).toThrow(
            'images are attached for codex'
        );
        const many = Array.from({ length: IMAGES_MAX + 1 }, (_, at) => join(WORK, `${at}.png`));
        expect(() =>
            compose(start({ agent: 'codex', images: many }), CHOICES, ACCOUNTS, BIN)
        ).toThrow(`at most ${IMAGES_MAX} images`);
    });

    it('refuses a prompt holding a control character, keeps a line break and a tab, and caps its size', () => {
        expect(() => compose(start({ prompt: 'a\u001bb' }), CHOICES, ACCOUNTS, BIN)).toThrow(
            'prompt must not hold control characters'
        );
        const kept = compose(start({ prompt: 'one\n\ttwo' }), CHOICES, ACCOUNTS, BIN);
        expect(kept.argv?.at(-1)).toBe('one\n\ttwo');
        expect(() =>
            compose(start({ prompt: 'x'.repeat(PROMPT_MAX + 1) }), CHOICES, ACCOUNTS, BIN)
        ).toThrow(`prompt must be at most ${PROMPT_MAX} chars`);
        expect(
            compose(start({ prompt: 'x'.repeat(PROMPT_MAX) }), CHOICES, ACCOUNTS, BIN).argv?.at(-1)
        ).toHaveLength(PROMPT_MAX);
    });

    it('starts an agent with no prompt as the agent alone, with no `--`', () => {
        const bare = compose(start({ prompt: '   ' }), CHOICES, ACCOUNTS, BIN);
        expect(bare.argv).toEqual([
            'env',
            '-u',
            'CLAUDE_CONFIG_DIR',
            BIN,
            '--permission-mode',
            'manual'
        ]);
    });

    it('starts a shell with no argument vector, its prompt the keys typed into it', () => {
        expect(
            compose(start({ agent: 'shell', prompt: 'ls -la' }), CHOICES, ACCOUNTS, BIN)
        ).toEqual({ argv: null, env: {}, keys: 'ls -la' });
    });

    it('refuses an agent the catalog does not offer, and a pick its picker does not hold', () => {
        expect(() => compose(start({}), [], ACCOUNTS, BIN)).toThrow('agents.yml offers no claude');
        expect(() => compose(start({ picks: { model: 'gpt' } }), CHOICES, ACCOUNTS, BIN)).toThrow(
            'model has no choice gpt'
        );
    });

    it('reads a request body with every field of the wrong type as missing', () => {
        expect(
            composeRequest({
                agent: 'rm',
                cwd: 7,
                account: null,
                picks: { model: 'opus', effort: 3 },
                prompt: ['a'],
                images: ['/a.png', 4]
            })
        ).toEqual({
            agent: 'shell',
            cwd: '',
            account: '',
            picks: { model: 'opus' },
            prompt: '',
            images: ['/a.png']
        });
        expect(composeRequest({ agent: 'codex', picks: [1] }).picks).toEqual({});
    });
});

describe("a Codex account's models", () => {
    it('come from the account folder models_cache.json, and the catalog list stands without one', () => {
        const folder = scratchDir('oculus-codex-');
        writeFileSync(
            join(folder, 'models_cache.json'),
            JSON.stringify({ models: [{ slug: 'gpt-7', display_name: 'GPT 7' }] })
        );
        const codex = CHOICES[1];
        const read = accountChoices(codex, { tool: 'codex', label: 'W', dir: folder });
        expect(read.lists[0].values.map((value) => value.id)).toEqual(['cli', 'gpt-7']);
        const none = accountChoices(codex, { tool: 'codex', label: 'W', dir: WORK });
        expect(none).toEqual(codex);
        expect(accountChoices(codex, null)).toBe(codex);
    });
});

describe('GET /api/agents', () => {
    function asked(query = ''): Request {
        return new Request(`http://127.0.0.1:8792/api/agents${query}`, {
            headers: { host: '127.0.0.1:8792', origin: 'http://127.0.0.1:8792' }
        });
    }

    const local = { ...localDefaults(ENGINE), accounts: ACCOUNTS };

    it('answers the catalog, the accounts and the findings', async () => {
        const response = handleAgents(asked(), ENGINE, local);
        expect(response.status).toBe(200);
        const answer = (await response.json()) as AgentsAnswer;
        expect(answer.agents.map((agent) => agent.agent)).toEqual(['claude', 'codex']);
        expect(answer.accounts).toEqual(ACCOUNTS);
        expect(answer.findings).toEqual([]);
    });

    it("reads the model list of the Codex account it names, and the first account's for a name it does not hold", async () => {
        const folder = scratchDir('oculus-codex-');
        writeFileSync(join(folder, 'models_cache.json'), JSON.stringify([{ slug: 'gpt-8' }]));
        const withCache = {
            ...local,
            accounts: [...ACCOUNTS, { tool: 'codex' as const, label: 'Cached', dir: folder }]
        };
        const models = async (query: string) => {
            const answer = (await handleAgents(
                asked(query),
                ENGINE,
                withCache
            ).json()) as AgentsAnswer;
            return answer.agents[1].lists[0].values.map((value) => value.id);
        };
        expect(await models('?account=Cached')).toEqual(['cli', 'gpt-8']);
        expect(await models('?account=Nobody')).toEqual(['cli', 'gpt-5.6-sol']);
        expect(await models('')).toEqual(['cli', 'gpt-5.6-sol']);
    });
});

/** Whether tmux answers at all; without it the real start is skipped with the reason printed. */
const TMUX = spawnSync('tmux', ['-V'], { encoding: 'utf8' }).status === 0;
if (!TMUX)
    console.error('tests/server/machine/pty/compose.test.ts: skipped, tmux is not on the PATH');

describe('a composed start in a real tmux', () => {
    const dir = scratchDir('oculus-inject-');
    const socket = join(dir, 's');
    const stub = join(dir, 'claude');
    const argvFile = join(dir, 'argv.out');
    const envFile = join(dir, 'env.out');
    // The stub writes the variable first and its arguments second, NUL-separated, then waits.
    writeFileSync(
        stub,
        [
            '#!/bin/sh',
            `printf '%s' "\${CLAUDE_CONFIG_DIR-unset}" > '${envFile}'`,
            `for a in "$@"; do printf '%s\\0' "$a"; done > '${argvFile}.tmp'`,
            `mv '${argvFile}.tmp' '${argvFile}'`,
            'sleep 30'
        ].join('\n')
    );
    chmodSync(stub, 0o755);

    afterAll(() => {
        spawnSync('tmux', ['-S', socket, 'kill-server'], { encoding: 'utf8' });
    });

    /** Every new-session call the real tmux was given, as it was given. */
    const started: string[][] = [];

    /** The real tmux, with the pane's HOME pointed at the scratch directory. */
    const options = {
        socket,
        run: (args: string[], held?: TmuxOptions) => {
            if (args[0] === 'new-session') started.push(args);
            return run(
                args[0] === 'new-session'
                    ? ['new-session', '-e', `HOME=${dir}`, ...args.slice(1)]
                    : args,
                held
            );
        }
    };

    async function until(has: () => boolean): Promise<void> {
        const deadline = Date.now() + 10000;
        while (!has()) {
            if (Date.now() > deadline) throw new Error('timed out waiting for the stub');
            await new Promise((resolve) => setTimeout(resolve, 50));
        }
    }

    it.skipIf(!TMUX)(
        'hands the prompt to the agent as one argument that no shell reads',
        async () => {
            const marker = join(dir, 'x');
            const prompt = `$(touch ${marker}); echo "q' ; rm -rf ~"`;
            const composed = compose(start({ cwd: dir, prompt }), CHOICES, ACCOUNTS, stub);
            const terminal = await startTerminal(
                { kind: 'claude', cwd: dir, cols: 80, rows: 24, env: composed.env },
                { ...options, argv: composed.argv ?? [] }
            );
            try {
                await until(() => existsSync(argvFile));
                const words = readFileSync(argvFile, 'utf8').split('\0').slice(0, -1);
                expect(words).toEqual(['--permission-mode', 'manual', '--', prompt]);
                expect(existsSync(marker)).toBe(false);
                expect(readFileSync(envFile, 'utf8')).toBe('unset');
            } finally {
                await stopTerminal(terminal.id, options);
            }
        }
    );

    it.skipIf(!TMUX)(
        'runs an agent of one word through `env`, so no shell reads the binary it names',
        async () => {
            rmSync(argvFile, { force: true });
            rmSync(envFile, { force: true });
            const bare = [{ agent: 'claude' as const, label: 'Claude', lists: [] }];
            const composed = compose(
                start({ cwd: dir, prompt: '', account: 'University' }),
                bare,
                ACCOUNTS,
                stub
            );
            expect(composed.argv).toEqual([stub]);
            const terminal = await startTerminal(
                { kind: 'claude', cwd: dir, cols: 80, rows: 24, env: composed.env },
                { ...options, argv: composed.argv ?? [] }
            );
            try {
                const args = started.at(-1) ?? [];
                expect(args.slice(args.indexOf('--') + 1)).toEqual(['env', stub]);
                await until(() => existsSync(argvFile));
                expect(readFileSync(argvFile, 'utf8')).toBe('');
                expect(readFileSync(envFile, 'utf8')).toBe(SECOND);
            } finally {
                await stopTerminal(terminal.id, options);
            }
        }
    );
});
