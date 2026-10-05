// Layer 2, server. What a reader does to a listed terminal without touching its process: give it a
// title, an icon and a colour (tmux user options beside the name, so tmux stays the only store),
// clear its history, and ask which of several are running a program before a close ends them.
//
// Every action first checks the id is one oculus minted and that the terminal is listed, so an
// ended terminal (`terminal-ended`) or a session oculus did not start (`not-ours`) is refused with
// that word of TERMINAL_REFUSALS and no command is run for it.

import { basename } from 'node:path';
import { TERMINAL_COLORS, type TerminalRefusal } from '../../../data/model/index.ts';
import { TerminalRefused } from './refusal.ts';
import { run } from './tmux.ts';
import {
    COLOR_OPTION,
    ICON_OPTION,
    TITLE_OPTION,
    isTerminalId,
    listTerminals,
    sessionName,
    tmuxValue,
    type RunOptions
} from './sessions.ts';

/** The longest title a terminal may carry, the same as the longest name. */
export const TITLE_MAX = 80;

/** The most terminals one busy read names. */
export const BUSY_MAX = 64;

/** The refusal for an id that is not a terminal id of oculus's. */
export const NOT_OURS: TerminalRefusal = 'not-ours';

/** The refusal for a terminal the server does not list, an ended one included. */
export const NOT_LISTED: TerminalRefusal = 'terminal-ended';

/** What a busy read answers for one terminal. */
export type Busy = { id: string; busy: boolean; command: string };

/** Refuse an id that is not oculus's, or a terminal that is not listed. Throws the refusal. */
async function listedTerminal(id: unknown, options: RunOptions): Promise<string> {
    if (!isTerminalId(id)) throw new TerminalRefused(NOT_OURS);
    const terminals = await listTerminals(options);
    if (!terminals.some((terminal) => terminal.id === id)) throw new TerminalRefused(NOT_LISTED);
    return id;
}

/** The command that sets a user option, or unsets it when the value is empty. */
function optionArgs(id: string, option: string, value: string): string[] {
    if (value === '') return ['set-option', '-u', '-t', sessionName(id), option];
    return ['set-option', '-t', sessionName(id), option, tmuxValue(value)];
}

/** Set the title, or clear it for a value of only spaces. */
export async function renameTerminal(
    id: unknown,
    title: unknown,
    options: RunOptions = {}
): Promise<void> {
    if (typeof title !== 'string') throw new Error('title must be a string');
    const trimmed = title.trim();
    // eslint-disable-next-line no-control-regex
    if (/[\u0000-\u001f\u007f]/.test(trimmed)) {
        throw new Error('title must not hold control characters');
    }
    if (trimmed.length > TITLE_MAX)
        throw new Error(`title must be at most ${TITLE_MAX} characters`);
    const listed = await listedTerminal(id, options);
    await (options.run ?? run)(optionArgs(listed, TITLE_OPTION, trimmed), options);
}

/**
 * Set the icon, the colour or both; an empty value unsets. The icon must be a name of the glyph
 * vocabulary and the colour one of the eight.
 */
export async function restyleTerminal(
    id: unknown,
    style: { icon: unknown; color: unknown },
    glyphs: string[],
    options: RunOptions = {}
): Promise<void> {
    const { icon, color } = style;
    if (icon === undefined && color === undefined) {
        throw new Error('name an icon or a color');
    }
    if (
        icon !== undefined &&
        (typeof icon !== 'string' || (icon !== '' && !glyphs.includes(icon)))
    ) {
        throw new Error('icon is not a glyph of the vocabulary');
    }
    if (
        color !== undefined &&
        (typeof color !== 'string' ||
            (color !== '' && !(TERMINAL_COLORS as readonly string[]).includes(color)))
    ) {
        throw new Error(`color must be one of ${TERMINAL_COLORS.join(', ')}`);
    }
    const listed = await listedTerminal(id, options);
    const exec = options.run ?? run;
    if (typeof icon === 'string') await exec(optionArgs(listed, ICON_OPTION, icon), options);
    if (typeof color === 'string') await exec(optionArgs(listed, COLOR_OPTION, color), options);
}

/**
 * Empty the terminal's visible screen and then its scrollback history: `clear-history` alone keeps
 * the screen's rows, which a reattach paints back, so the pane is reset first. A pane on the
 * alternate screen is left as it is and only its history is emptied: the full-screen program
 * there draws its own screen, and a reset would blank it and drop the mouse mode it asked for.
 */
export async function clearTerminal(id: unknown, options: RunOptions = {}): Promise<void> {
    const listed = await listedTerminal(id, options);
    const exec = options.run ?? run;
    const target = sessionName(listed);
    const alternate = await exec(
        ['display-message', '-p', '-t', target, '#{alternate_on}'],
        options
    );
    if (alternate.trim() !== '1') await exec(['send-keys', '-R', '-t', target], options);
    await exec(['clear-history', '-t', target], options);
}

/** The ids of a busy query, or the sentence that refuses it. */
export function busyIds(query: string | null): string[] | string {
    if (query === null || query === '') return 'busy must name at least one terminal';
    const ids = query.split(',');
    if (ids.length > BUSY_MAX) return `busy must name at most ${BUSY_MAX} terminals`;
    if (!ids.every((id) => isTerminalId(id))) return 'busy must name terminal ids';
    return ids;
}

/**
 * Whether each terminal's pane runs something other than the user's shell, and what. The pane's
 * command is compared by its base name with the shell's, since tmux reports `zsh` for `/bin/zsh`
 * and `-zsh` for a login shell. A terminal whose read fails is busy with no program named, so the
 * question is asked rather than the terminal ended unasked.
 */
export async function busyTerminals(
    ids: string[],
    shell: string,
    options: RunOptions = {}
): Promise<Busy[]> {
    const idle = basename(shell);
    const exec = options.run ?? run;
    return Promise.all(
        ids.map(async (id): Promise<Busy> => {
            try {
                const out = await exec(
                    ['display-message', '-p', '-t', sessionName(id), '#{pane_current_command}'],
                    options
                );
                const command = out.trim();
                if (command === '') return { id, busy: true, command: '' };
                return { id, busy: command.replace(/^-/, '') !== idle, command };
            } catch {
                return { id, busy: true, command: '' };
            }
        })
    );
}
