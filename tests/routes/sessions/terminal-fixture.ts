// Layer 2, server test fixture. The synthetic hub, state folder and engine directories the terminal
// route suites read, the tmux double that records every argv and runs nothing, and the helpers that
// build a request and the options bag handleTerminal is called with. Nothing here runs tmux,
// `claude` or `codex`; the only real path is the temporary directory the helper hands out.

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect } from 'vitest';
import { scratchDir } from '../../fixtures/scratch.ts';
import { type TerminalOptions } from '../../../src/lib/server/machine/pty/routes.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { SessionRecord } from '../../../src/lib/data/model.ts';
import { contextFixture } from '../../server/core/context-fixture.ts';

/** This file's own directory, for reading the route module beside the source it tests. */
export const HERE_FILE = fileURLToPath(import.meta.url);

export const HOST = '127.0.0.1:8791';

export const SERVER = contextFixture({ token: 'the-write-token-of-this-test' });

export const TOKEN = SERVER.token;

/** A session id of the shape both tools write. */
export const SESSION = '3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/** A directory that is there, which is what the cwd check asks of the record's own path. */
export const HERE = resolve(tmpdir());

expect(existsSync(HERE)).toBe(true);

expect(HERE.length).toBeGreaterThan(1);

/** A directory that is not, for the session whose folder has been moved away since it ran. */
export const GONE = join(HERE, 'oculus-no-such-directory-for-o19');

expect(GONE.startsWith(HERE + sep)).toBe(true);

expect(existsSync(GONE)).toBe(false);

export const TASK_CONFIG = scratchDir('oculus-task-route-');

expect(resolve(TASK_CONFIG).startsWith(HERE + sep)).toBe(true);

/**
 * An engine directory of this suite's own: a config folder holding the machine-local file the case
 * under test reads. The route is handed the directory, so nothing here reads the checkout's own.
 */
export function engineWith(name: string, local = ''): string {
    const dir = join(TASK_CONFIG, name);
    expect(resolve(dir).startsWith(TASK_CONFIG + sep)).toBe(true);
    mkdirSync(join(dir, 'config'), { recursive: true });
    if (local !== '') writeFileSync(join(dir, 'config', 'local.yml'), local);
    return dir;
}

/**
 * The engine a case that reads no machine-local value is given: a config folder and nothing in it.
 */
export const ENGINE = engineWith('engine');

export const TASK_ENGINE = engineWith(
    'task-engine',
    `hub: ${HERE}\nclaude_bin: /opt/Claude CLI/claude\n`
);

export const TASK_DEFAULT_ENGINE = engineWith('default-engine', `hub: ${HERE}\n`);

export const CHAT_HUB = join(TASK_CONFIG, 'hub');

export const CHAT_STATE = join(TASK_CONFIG, 'state');

export const CHAT_PROJECT = join(CHAT_HUB, 'projects', 'active', 'alpha');

mkdirSync(join(CHAT_STATE, 'chat'), { recursive: true });

mkdirSync(CHAT_PROJECT, { recursive: true });

mkdirSync(join(CHAT_HUB, 'registries'), { recursive: true });

writeFileSync(join(CHAT_PROJECT, 'project.yml'), 'id: alpha\ntitle: Alpha Study\n');

writeFileSync(join(CHAT_HUB, 'registries', 'venues.yml'), 'entries: []\n');

export const CHAT_ENGINE = engineWith(
    'chat-engine',
    `hub: ${CHAT_HUB}\nclaude_bin: /opt/Claude CLI/claude\nsessions_overrides: ${join(CHAT_STATE, 'sessions.json')}\n`
);

export const BASE_CHAT_CONFIG = loadConfig(engineDir()).config;

export const CHAT_CONFIG = { ...BASE_CHAT_CONFIG, chat: { model: 'claude-opus-4-1' } };

export const CHAT_CATALOG = textCatalog(CHAT_CONFIG);

/**
 * A tmux that runs nothing: it keeps every argv, remembers what set-option was told, and answers
 * list-sessions with the one line the session it was asked to create would have produced.
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
            if (args[0] === 'new-session') {
                name = args[3] ?? '';
                return Promise.resolve('');
            }
            if (args[0] === 'set-option') {
                options[args[3] ?? ''] = args[4] ?? '';
                return Promise.resolve('');
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

export function options(over: Partial<TerminalOptions> = {}): TerminalOptions {
    return { engine: ENGINE, run: tmux().run, recordFor: () => null, ...over };
}

/** A record source holding exactly the sessions the case is about. */
export function source(...records: SessionRecord[]): (id: string) => SessionRecord | null {
    return (id) => records.find((one) => one.id === id) ?? null;
}

export function request(body: unknown, token: string = TOKEN): Request {
    return new Request(`http://${HOST}/api/terminal`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'sec-fetch-site': 'same-origin',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

/** Quote an expected CLI argument independently of the server's command builder. */
export function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

export function command(argv: string[]): string {
    return argv.map(shellWord).join(' ');
}

/**
 * A chat catalog template with each placeholder replaced by the argument it numbers, built by
 * splitting the template rather than by replacing into it, so an argument holding braces or a `$`
 * pattern is expected exactly as written and independently of the server's fill.
 */
export function filled(key: string, args: string[]): string {
    const template = CHAT_CATALOG[key];
    const numbers = [...template.matchAll(/\{(\d+)\}/g)].map((match) => Number(match[1]));
    return template
        .split(/\{\d+\}/)
        .map((piece, at) => (at < numbers.length ? piece + args[numbers[at]] : piece))
        .join('');
}

export async function answer(response: Response): Promise<Record<string, unknown>> {
    return (await response.json()) as Record<string, unknown>;
}
