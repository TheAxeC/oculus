// Layer 2, server. The steer and the interrupt a page sends to a terminal whose agent is detected:
// its id says `shell`, or it is a by-hand pane. Such a pane may have gone back to a shell since the
// list was read, and the text of the box would then run as a command, so the pane's terminal is
// asked first and nothing is typed unless an agent holds its foreground: tmux names the pane's tty
// and `ps` names what runs on it. tmux's own word for the pane cannot say, since a program is free
// to name itself and a shell need not be the login shell. A saved by-hand id may name a pane of an
// earlier tmux server, which the server pid in the id tells. A terminal oculus started as an agent
// holds that agent or has ended, and is typed into unasked.

import { byHandPane } from '../../../../data/model/index.ts';
import { foregroundAgent } from '../../processes/agents.ts';
import { readTty } from '../../processes/ps.ts';
import type { TtyProcess } from '../../processes/table.ts';
import { TerminalRefused } from '../refusal.ts';
import { interruptTerminal, isTerminalId, steerTerminal, type RunOptions } from '../sessions.ts';
import { run } from '../tmux.ts';
import { targetOf } from './target.ts';

/** The options of a steer: what a pane's tty runs, by `ps` when absent. */
export type SteerOptions = RunOptions & {
    foreground?: (tty: string) => Promise<TtyProcess[]>;
};

/** The tmux server that answers, then the pane's tty, which is empty for a pane that went. */
const PANE_FORMAT = '#{pid}\t#{pane_tty}';

/**
 * Refuse a pane that no longer holds an agent in its foreground. Throws the refusal. `typing` is
 * whether what follows would run as a command at a shell: a press of Escape would not, so an
 * interrupt goes on when the foreground cannot be read.
 */
async function checkPane(id: string, options: SteerOptions, typing: boolean): Promise<void> {
    const args = ['display-message', '-p', '-t', targetOf(id), PANE_FORMAT];
    const [server, tty = ''] = (await (options.run ?? run)(args, options)).trim().split('\t');
    const named = byHandPane(id);
    if (named !== null && (String(named.server) !== server || tty === '')) {
        throw new TerminalRefused('terminal-ended');
    }
    if (tty === '') throw new TerminalRefused('no-agent');
    // A read that fails says nothing of the pane, and what is not known to be an agent is not typed
    // into.
    const processes = await (options.foreground ?? readTty)(tty).catch(() => null);
    if (processes === null && !typing) return;
    if (!foregroundAgent(processes ?? [])) throw new TerminalRefused('no-agent');
}

/** Type one message into the agent of a terminal, once its pane is known to hold one. */
export async function steerAgent(id: string, text: string, options: SteerOptions): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    if (id.endsWith('-shell') || byHandPane(id) !== null) await checkPane(id, options, true);
    await steerTerminal(id, text, options);
}

/** Interrupt the agent of a terminal; a by-hand id is checked as a steer is. */
export async function interruptAgent(id: string, options: SteerOptions): Promise<void> {
    if (!isTerminalId(id)) throw new TerminalRefused('not-ours');
    if (byHandPane(id) !== null) await checkPane(id, options, false);
    await interruptTerminal(id, options);
}
