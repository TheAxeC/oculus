// Layer 2, server. Starts a private Claude terminal focused on one project or the whole portfolio.
// The large portfolio context is an atomic state-folder file rather than a shell argument, and the
// terminal receives only its path, the catalogued instruction and the catalogued initial prompt.

import { rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { chatModel } from '../../../../data/accounts/chat.ts';
import { loadLocal, textCatalog, type LocalConfig } from '../../../../data/sources/config.ts';
import type { Project } from '../../../../data/model/index.ts';
import { defaultOverridesPath } from '../../../sessions/overrides.ts';
import { writeTextAtomic } from '../../../core/json.ts';
import { words } from '../../../core/words.ts';
import { projectDirectory } from '../../../files/files.ts';
import { hubTargets } from '../../../files/roots.ts';
import { portfolioContext } from './context.ts';
import { listTerminals, newId, startTerminal, type StartOptions } from '../sessions.ts';
import { shellWord } from '../shell-word.ts';

type ChatProject = Pick<Project, 'title' | 'folder' | 'root' | 'repository'> &
    Partial<Pick<Project, 'tier'>>;

export type ChatOptions = StartOptions & {
    /** The engine directory the configuration and the machine's own file are read from. */
    engine: string;
    /** A project in the latest portfolio snapshot. Tests provide the snapshot source they own. */
    projectFor?: (id: string) => ChatProject | null;
    /**
     * The name of the person marked `self: true` in the hub's people file, or null when none is
     * marked or the file does not read. The instruction names the hub's owner by it.
     */
    ownerFor?: () => string | null;
    /**
     * The merged engine config as the request read it. Tests provide a fixture without changing the
     * checked-in catalog.
     */
    configFor: () => Record<string, unknown>;
    /** Machine-local paths carried by ServerContext. */
    localFor?: () => LocalConfig;
};

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
    const local = options.localFor?.() ?? loadLocal(engine);
    const config = options.configFor();
    const catalog = textCatalog(config);
    const project = typeof id === 'string' ? (options.projectFor ?? (() => null))(id) : null;
    if (typeof id === 'string' && project === null) {
        throw new Error('id is not a project in the current portfolio');
    }

    const terminalId = newId('claude');
    const index = chatIndexPath(local.sessionsOverrides, terminalId);
    const portfolio = project === null;
    // A project of a hub other than the first lies under its own hub's folder, and a project of a
    // repository in the repository's own folder.
    const home = portfolio
        ? local.hub
        : (hubTargets({ config, engine, local }).find((one) => one.key === project.root)?.hub ??
          local.hub);
    const cwd = portfolio ? local.hub : projectDirectory(home, project);

    const focus =
        typeof id === 'string' && project !== null
            ? words(catalog, 'server.chat.chat_focus_note', id, project.title, cwd)
            : '';
    const note = words(catalog, 'server.chat.chat_index_note', index);
    const owner = options.ownerFor?.() ?? words(catalog, 'server.chat.chat_owner_fallback');
    const instruction = words(catalog, 'server.chat.chat_instruction', local.hub, cwd, owner);
    const system = [instruction, focus, note].filter((part) => part !== '').join('\n\n');
    const name = portfolio
        ? words(catalog, 'server.chat.chat_name', await chatNumber(catalog, options))
        : words(catalog, 'server.chat.chat_name_focus', project.title);
    const seed = portfolio
        ? words(catalog, 'server.chat.seed_portfolio')
        : words(catalog, 'server.chat.seed_focus', project.title);
    writeTextAtomic(index, portfolioContext(local.hub, config), 0o600);
    try {
        return await startTerminal(
            {
                id: terminalId,
                kind: 'claude',
                cwd,
                cols,
                rows,
                name: name.slice(0, 80)
            },
            { ...options, command: chatCommand(local.claudeBin, system, chatModel(config), seed) }
        );
    } catch (error) {
        rmSync(index, { force: true });
        throw error;
    }
}
