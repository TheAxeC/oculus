// Layer 2, server. Starts a private Claude terminal focused on one project or the whole portfolio.
// The large portfolio context is an atomic state-folder file rather than a shell argument, and the
// terminal receives only its path, the catalogued instruction and the catalogued initial prompt.

import { rmSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { byKey } from '../../data/guards.ts';
import {
    loadConfig,
    loadLocalOrDefaults,
    textCatalog,
    type LocalConfig
} from '../../data/sources/config.ts';
import type { Project } from '../../data/model.ts';
import { defaultOverridesPath } from '../sessions/overrides.ts';
import { writeTextAtomic } from '../sessions/json.ts';
import { portfolioContext } from './context.ts';
import { listTerminals, newId, startTerminal, type StartOptions } from './sessions.ts';

type ChatProject = Pick<Project, 'title' | 'folder'>;

export type ChatOptions = StartOptions & {
    /** The engine directory the configuration and the machine's own file are read from. */
    engine: string;
    /** A project in the latest portfolio snapshot. Tests provide the snapshot source they own. */
    projectFor?: (id: string) => ChatProject | null;
    /** The merged engine config. Tests provide a fixture without changing the checked-in catalog. */
    configFor?: () => Record<string, unknown>;
    /** Machine-local paths carried by ServerContext. */
    localFor?: () => LocalConfig;
};

/** Quote one word for the shell command tmux starts. */
function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
}

/** Fill positional placeholders in one flattened catalog entry. */
export function words(
    catalog: Record<string, string>,
    key: string,
    ...args: (string | number)[]
): string {
    const template = byKey(catalog, key);
    if (template === undefined) throw new Error(`text key not in config: ${key}`);
    let filled = template;
    for (const [at, value] of args.entries()) {
        filled = filled.replaceAll(`{${at}}`, String(value));
    }
    return filled;
}

/** The configured chat model, or no model argument when the CLI should choose. */
function chatModel(config: Record<string, unknown>): string | null {
    const chat = config.chat;
    if (typeof chat !== 'object' || chat === null || Array.isArray(chat)) return null;
    const model = (chat as Record<string, unknown>).model;
    return typeof model === 'string' && model.trim() !== '' ? model.trim() : null;
}

/** The chat index path beside the configured sessions file, under its own retained folder. */
export function chatIndexPath(sessionsOverrides: string | undefined, id: string): string {
    const state = dirname(sessionsOverrides ?? defaultOverridesPath());
    return join(state, 'chat', `${id}.md`);
}

/** The next portfolio chat number among the terminals tmux currently lists. */
async function chatNumber(catalog: Record<string, string>, options: StartOptions): Promise<number> {
    const held = new Set((await listTerminals(options)).map((terminal) => terminal.name));
    let number = 1;
    while (held.has(words(catalog, 'server.chat.chat_name', number))) number += 1;
    return number;
}

/**
 * A project folder from the snapshot, resolved beneath the configured hub root. Every action that
 * starts a terminal in a project's own folder resolves it here, so the check that it did not leave
 * the hub exists once.
 */
export function projectDirectory(hub: string, folder: string): string {
    const cwd = resolve(hub, folder);
    const within = relative(hub, cwd);
    if (within.startsWith('..') || isAbsolute(within)) {
        throw new Error('the project folder is outside the configured hub');
    }
    return cwd;
}

/** The exact interactive Claude command tmux receives as one shell command. */
export function chatCommand(
    binary: string,
    system: string,
    model: string | null,
    seed: string
): string {
    const argv = [
        binary,
        '--append-system-prompt',
        system,
        // One comma-joined value: a space-separated list would swallow the positional prompt that
        // follows when no --model separates them.
        '--disallowedTools',
        'Bash,Edit,Write,WebFetch,WebSearch'
    ];
    if (model !== null) argv.push('--model', model);
    argv.push(seed);
    return argv.map(shellWord).join(' ');
}

/** Start one project-focused or portfolio-wide interactive chat terminal. */
export async function startChat(id: unknown, cols: unknown, rows: unknown, options: ChatOptions) {
    if (id !== null && id !== undefined && typeof id !== 'string') {
        throw new Error('id must be a project id or null');
    }
    const engine = options.engine;
    const local = options.localFor?.() ?? loadLocalOrDefaults(engine);
    const config = options.configFor?.() ?? loadConfig(engine).config;
    const catalog = textCatalog(config);
    const project = typeof id === 'string' ? (options.projectFor ?? (() => null))(id) : null;
    if (typeof id === 'string' && project === null) {
        throw new Error('id is not a project in the current portfolio');
    }

    const terminalId = newId('claude');
    const index = chatIndexPath(local.sessionsOverrides, terminalId);
    const portfolio = project === null;
    const cwd = portfolio ? local.hub : projectDirectory(local.hub, project.folder);

    const focus =
        typeof id === 'string' && project !== null
            ? words(catalog, 'server.chat.chat_focus_note', id, project.title, cwd)
            : '';
    const note = words(catalog, 'server.chat.chat_index_note', index);
    const system = [words(catalog, 'server.chat.chat_instruction', local.hub, cwd), focus, note]
        .filter((part) => part !== '')
        .join('\n\n');
    const name = portfolio
        ? words(catalog, 'server.chat.chat_name', await chatNumber(catalog, options))
        : words(catalog, 'server.chat.chat_name_focus', project.title);
    const seed = portfolio
        ? words(catalog, 'server.chat.seed_portfolio')
        : words(catalog, 'server.chat.seed_focus', project.title);
    writeTextAtomic(index, portfolioContext(local.hub, config, engine), 0o600);
    try {
        return await startTerminal(
            {
                id: terminalId,
                kind: 'claude',
                cwd,
                cols: cols as number,
                rows: rows as number,
                name: name.slice(0, 80)
            },
            { ...options, command: chatCommand(local.claudeBin, system, chatModel(config), seed) }
        );
    } catch (error) {
        rmSync(index, { force: true });
        throw error;
    }
}
