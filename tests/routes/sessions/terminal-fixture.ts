// Layer 4, test helper. The synthetic hub, state folder and engine directories the terminal route
// suites read, the tmux double that records every argv and runs nothing, and the helpers that build
// a request and the options bag handleTerminal is called with. Nothing here runs tmux, `claude` or
// `codex`; the only real path is the temporary directory the helper hands out.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { expect } from 'vitest';
import { scratchDir } from '../../fixtures/scratch.ts';
import { type TerminalOptions } from '../../../src/lib/server/machine/pty/routes.ts';
import {
    engineDir,
    loadConfig,
    loadMachine,
    localDefaults,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import type { SessionRecord } from '../../../src/lib/data/model/index.ts';
import { Turns } from '../../../src/lib/server/machine/pty/latex/turns.ts';
import { contextFixture } from '../../server/root/context-fixture.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { plantHub, workspaceWith } from '../../fixtures/hubs/workspace.ts';

export const HOST = '127.0.0.1:8791';

export const SERVER = contextFixture({ token: 'the-write-token-of-this-test' });

export const TOKEN = SERVER.token;

/** A session id of the shape both tools write. */
export const SESSION = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/** A directory that is there, which is what the cwd check asks of the record's own path. */
export const HERE = resolve(tmpdir());

expect(existsSync(HERE)).toBe(true);

expect(HERE.length).toBeGreaterThan(1);

/** One file's scratch folder, and the engines and the hubs planted in it. */
export type TaskConfig = {
    /** The folder every directory below is made in. */
    root: string;
    /** The engine a case that reads no machine-local value is given: a config folder, empty. */
    engine: string;
    taskEngine: string;
    /** A hub whose `.oculus/local.yml` names a Claude command with a space in its path. */
    taskHub: string;
    chatHub: string;
    chatState: string;
    chatProject: string;
    chatEngine: string;
};

/**
 * An engine directory of this suite's own inside `root`: an empty config folder. The route is
 * handed the directory, so nothing here reads the checkout's own.
 */
export function engineWith(root: string, name: string): string {
    const dir = join(root, name);
    expect(resolve(dir).startsWith(root + sep)).toBe(true);
    mkdirSync(join(dir, 'config'), { recursive: true });
    return dir;
}

/** A hub folder inside `root` whose `.oculus/local.yml` holds `local`. */
function hubWith(root: string, name: string, local: string): string {
    const dir = join(root, name);
    expect(resolve(dir).startsWith(root + sep)).toBe(true);
    mkdirSync(join(dir, '.oculus', 'config'), { recursive: true });
    writeFileSync(join(dir, '.oculus', 'local.yml'), local);
    return dir;
}

/**
 * Make one file's scratch folder and plant the engines and the chat hub in it. Each file that
 * imports this calls it from the fixture's test.beforeAll and keeps what it answers, so a file
 * whose cases are all skipped makes nothing.
 */
export function makeTaskConfig(): TaskConfig {
    const root = scratchDir('oculus-task-route-');
    expect(resolve(root).startsWith(HERE + sep)).toBe(true);
    const chatState = join(root, 'state');
    const chatHub = hubWith(
        root,
        'hub',
        `claude_bin: /opt/Claude CLI/claude\nsessions_overrides: ${join(chatState, 'sessions.json')}\n`
    );
    const chatProject = join(chatHub, 'projects', 'active', 'alpha');
    mkdirSync(join(chatState, 'chat'), { recursive: true });
    mkdirSync(chatProject, { recursive: true });
    mkdirSync(join(chatHub, 'registries'), { recursive: true });
    writeFileSync(join(chatProject, 'project.yml'), 'id: alpha\ntitle: Alpha Study\n');
    writeFileSync(join(chatHub, 'registries', 'venues.yml'), 'entries: []\n');
    return {
        root,
        engine: engineWith(root, 'engine'),
        taskEngine: engineWith(root, 'task-engine'),
        taskHub: hubWith(root, 'task-hub', 'claude_bin: /opt/Claude CLI/claude\n'),
        chatHub,
        chatState,
        chatProject,
        chatEngine: engineWith(root, 'chat-engine')
    };
}

export const BASE_CHAT_CONFIG = loadConfig(engineDir()).config;

export const CHAT_CONFIG = { ...BASE_CHAT_CONFIG, chat: { model: 'claude-opus-4-1' } };

export const CHAT_CATALOG = textCatalog(CHAT_CONFIG);

/**
 * The commands of one tmux invocation, each as its words: tmux runs the words after a lone `;`
 * argument as the next command of the same invocation.
 */
export function joinedCommands(call: string[]): string[][] {
    const commands: string[][] = [];
    let part: string[] = [];
    for (const word of [...call, ';']) {
        if (word === ';') {
            commands.push(part);
            part = [];
        } else {
            part.push(word);
        }
    }
    return commands;
}

/** The words a `new-session` runs: those after `--` up to the first command joined to it. */
export function lineOf(start: string[]): string[] {
    return (joinedCommands(start)[0] ?? []).slice(start.indexOf('--') + 1);
}

/**
 * A tmux that runs nothing: it keeps every argv, remembers what set-option was told, in an
 * invocation of its own and joined to a `new-session`, and answers list-sessions with the one line
 * the session it was asked to create would have produced.
 */
export function tmux(existingNames: string[] = []): {
    run: NonNullable<TerminalOptions['run']>;
    calls: string[][];
} {
    const calls: string[][] = [];
    let name = '';
    const options: Record<string, string> = {};
    return {
        calls,
        run: (args: string[]): Promise<string> => {
            calls.push([...args]);
            for (const words of joinedCommands(args)) {
                if (words[0] === 'new-session') name = words[3] ?? '';
                if (words[0] === 'set-option') options[words[3] ?? ''] = words[4] ?? '';
            }
            if (args[0] === 'list-sessions') {
                const fields = [
                    name,
                    '1757500000',
                    '0',
                    'claude',
                    '4242',
                    HERE,
                    options['@oculus_name'] ?? '',
                    options['@oculus_resumes'] ?? ''
                ];
                const existing = existingNames.map((label) =>
                    [
                        'oculus-aabbcc-claude',
                        '1757500000',
                        '0',
                        'claude',
                        '4241',
                        HERE,
                        label,
                        ''
                    ].join('\t')
                );
                return Promise.resolve([...existing, fields.join('\t')].join('\n') + '\n');
            }
            return Promise.resolve('');
        }
    };
}

/** The configuration of one engine directory, read at the call as a request reads it. */
export function configOf(engine: string): () => Record<string, unknown> {
    return () => loadConfig(engine).config;
}

/**
 * The open workspace and the machine values a request is given: the folder `hub` as the primary hub
 * of a workspace when one is named (it is made a hub) with the values of its `.oculus/local.yml`,
 * else a workspace with no folder and the defaults of local.yml.
 */
export function worldOf(hub?: string): Pick<TerminalOptions, 'openFor' | 'localFor'> {
    const workspace = workspaceWith(
        hub === undefined ? [] : [{ name: 'hub', dir: plantHub(hub) }],
        hub === undefined ? undefined : 'hub'
    );
    return {
        openFor: () => workspace.open(),
        localFor: () =>
            hub === undefined ? localDefaults() : loadMachine([{ name: 'hub', dir: hub }], 'hub')
    };
}

export function options(engine: string, over: Partial<TerminalOptions> = {}): TerminalOptions {
    return {
        ...worldOf(),
        engine,
        run: tmux().run,
        recordFor: () => null,
        configFor: configOf(engine),
        ...over
    };
}

/** A record source holding exactly the sessions the case is about. */
export function source(...records: SessionRecord[]): (id: string) => SessionRecord | null {
    return (id) => records.find((one) => one.id === id) ?? null;
}

export function request(body: unknown, token: string = TOKEN): Request {
    return pagePost(`http://${HOST}/api/terminal`, body, token);
}

/** Quote an expected CLI argument independently of the server's command builder. */
function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function command(argv: string[]): string {
    return argv.map(shellWord).join(' ');
}

export async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}

/** The project of the synthetic chat hub whose manuscript the latex route tests build in. */
export const LATEX_PROJECT = 'projects/active/alpha';

/** The home a latex request looks for latexmkrc files in, apart from the reader's `~`. */
export const latexHome = (task: TaskConfig): string => join(task.root, 'latex-home');

/** The approvals file a latex request reads and writes, apart from the reader's own. */
export const approvalsFile = (task: TaskConfig): string => join(task.root, 'latex-approvals.json');

/** The options of a latex request over the synthetic project, with `extra` laid over them. */
export function latexRouteOptions(
    task: TaskConfig,
    turns: Turns,
    run: TerminalOptions['run'],
    extra: Partial<TerminalOptions> = {}
): TerminalOptions {
    return {
        turns,
        approvalsFor: () => approvalsFile(task),
        latexHomesFor: () => ({ home: latexHome(task), xdg: undefined }),
        ...worldOf(task.chatHub),
        engine: engineDir(),
        run,
        configFor: () => BASE_CHAT_CONFIG,
        projectFor: (id) =>
            id === 'alpha' ? { title: 'Alpha Study', folder: LATEX_PROJECT } : null,
        programFound: () => true,
        ...extra
    };
}
