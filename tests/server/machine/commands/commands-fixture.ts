// Layer 4, test helper. A scratch home and scratch repositories for the project-command suites:
// the home is what `HOME` names for the duration of a case, so the machine's own `~/.oculus` is
// never read or written, and a repository is a folder holding a `.git` marker and the files a case
// plants.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect, vi } from 'vitest';
import { plantScratch, scratchDir } from '../../../fixtures/scratch.ts';

/** A scratch home, set as `HOME` until `leaveHome` is called. Returns its real path. */
export function enterHome(): string {
    const home = realpathSync(scratchDir('oculus-home-'));
    vi.stubEnv('HOME', home);
    return home;
}

/** Restore the environment `enterHome` changed. */
export function leaveHome(): void {
    vi.unstubAllEnvs();
}

/** A repository under the temporary directory holding the given files; its real path. */
export function plantRepo(files: Record<string, string> = {}, folders: string[] = []): string {
    const dir = plantScratch('oculus-repo-', files, ['.git', ...folders]);
    return realpathSync(dir);
}

/** Write one file under `base`, refusing a path that climbs out of it. */
export function plant(base: string, rel: string, body: string): void {
    const full = join(base, rel);
    expect(resolve(full).startsWith(resolve(base) + sep)).toBe(true);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
}

/** The text of `.oculus/commands.yml` for a list of entries written as YAML lines. */
export function commandsYml(entries: string): string {
    return `commands:\n${entries}`;
}

/** The pane a task terminal double holds. */
export type TaskPane = {
    cwd: string;
    /** The one shell word the session was started with. */
    line: string;
    /** What `#{pane_current_command}` answers. */
    command: string;
    remain: boolean;
    exit: number | null;
    options: Record<string, string>;
    /** What `capture-pane` answers: all the text the pane holds. */
    output: string;
};

/**
 * A tmux that runs nothing and keeps every argument vector. It reads a `new-session` and the
 * commands joined to it with a `;` argument, the `set-option` and `respawn-pane` calls, and
 * answers `list-sessions` in the format the server asks for and `capture-pane` with the text a
 * case gave the pane, so a case reads what tmux was told and what the list then says. `end` marks
 * a session's line as ended, as a pane under `remain-on-exit` shows it.
 */
export function taskTmux(here: string) {
    const calls: string[][] = [];
    const panes = new Map<string, TaskPane>();

    function apply(args: string[]): void {
        const [verb, ...rest] = args;
        if (verb === 'new-session') {
            let session = '';
            let cwd = here;
            let at = 0;
            for (; at < rest.length && rest[at] !== '--'; at += 1) {
                if (rest[at] === '-s') session = rest[(at += 1)];
                else if (rest[at] === '-c') cwd = rest[(at += 1)];
                else if (rest[at] === '-x' || rest[at] === '-y' || rest[at] === '-e') at += 1;
            }
            const line = rest.slice(at + 1).join(' ');
            panes.set(session, {
                cwd,
                line,
                command: 'sh',
                remain: false,
                exit: null,
                options: {},
                output: ''
            });
            return;
        }
        if (verb === 'set-option') {
            const words = rest.filter((word) => !word.startsWith('-') || word.startsWith('@'));
            const unset = rest.includes('-u');
            const target = rest[rest.indexOf('-t') + 1];
            const pane = panes.get(target);
            if (pane === undefined) return;
            const [, key, value] = words;
            if (key === 'remain-on-exit') pane.remain = value === 'on';
            else if (unset) {
                pane.options = Object.fromEntries(
                    Object.entries(pane.options).filter(([name]) => name !== key)
                );
            } else pane.options[key] = value;
            return;
        }
        if (verb === 'respawn-pane') {
            const pane = panes.get(rest[rest.indexOf('-t') + 1]);
            if (pane !== undefined) pane.exit = null;
        }
    }

    const run = (args: string[]): Promise<string> => {
        calls.push([...args]);
        if (args[0] === 'capture-pane') {
            return Promise.resolve(panes.get(args[args.indexOf('-t') + 1])?.output ?? '');
        }
        if (args[0] === 'list-sessions') {
            const rows = [...panes.entries()].map(([session, pane]) =>
                [
                    session,
                    '1757500000',
                    '0',
                    pane.command,
                    '4242',
                    pane.cwd,
                    pane.options['@oculus_name'] ?? '',
                    '',
                    pane.options['@oculus_title'] ?? '',
                    pane.options['@oculus_icon'] ?? '',
                    pane.options['@oculus_color'] ?? '',
                    pane.options['@oculus_task'] ?? '',
                    pane.exit === null ? '0' : '1',
                    pane.exit === null ? '' : String(pane.exit),
                    '4242'
                ].join('\t')
            );
            return Promise.resolve(rows.length === 0 ? '' : `${rows.join('\n')}\n`);
        }
        let part: string[] = [];
        for (const word of [...args, ';']) {
            if (word === ';') {
                apply(part);
                part = [];
            } else part.push(word);
        }
        return Promise.resolve('');
    };

    return {
        run,
        calls,
        panes,
        /** Mark the line of a session as ended with this status. */
        end(session: string, status: number): void {
            const pane = panes.get(session);
            if (pane === undefined) throw new Error(`no session ${session}`);
            pane.exit = status;
        },
        /** The calls that started a session. */
        starts: () => calls.filter((args) => args[0] === 'new-session'),
        /** The calls that respawned a pane. */
        respawns: () => calls.filter((args) => args.includes('respawn-pane'))
    };
}
