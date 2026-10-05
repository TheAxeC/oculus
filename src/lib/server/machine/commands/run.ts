// Layer 2, server. The three actions of POST /api/terminal that belong to project commands.
//
// `command` resolves the command a press names, by its name and its source, and the commands it
// depends on, takes each placeholder's value from the context the page sent, and checks that the
// chain has been approved when any command of it was not saved through the form. A chain not yet
// approved is answered as `{ approve: [<the lines of the chain>] }` and nothing starts; once it is
// approved, one shell terminal starts, named after the command, running the whole chain as one
// line, and it is a task terminal: tmux keeps it after its line ended, with the status of the line.
// Each placeholder of the line is `"$OCULUS_ARG_<n>"` and its value is set in the terminal's
// environment (placeholders.ts), so the shell never reads a value as code. The line prints a token
// minted for this start with each command's name, and the terminal's mark carries the token.
//
// `rerun` runs the line of an ended task terminal again in the same pane, and `restart` does the
// same for a line still running once the reader confirmed the process that would be stopped.
// `capture` answers all the text a listed terminal's pane holds, which the page reads the
// diagnostics of a task from when no pane shows it. Every refusal is a word of TERMINAL_REFUSALS
// with the names its sentence is about (pty/refusal.ts).

import { randomBytes } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type { CommandContext, Terminal, TerminalRefusal } from '../../../data/model/index.ts';
import { NOT_LISTED, NOT_OURS } from '../pty/edit.ts';
import { refusal } from '../pty/refusal.ts';
import {
    isTerminalId,
    listTerminals,
    paneOutput,
    respawnTerminal,
    startTerminal,
    type StartOptions
} from '../pty/sessions.ts';
import { resolveChain } from './resolve.ts';
import { chainLines, chainText, defaultApprovalsPath, isApproved } from '../approvals/approvals.ts';
import { chainLine } from './chain.ts';
import { listCommands } from './list.ts';
import { fillPlaceholders } from './placeholders.ts';
import { repositoryOf } from './repo.ts';

/** What a command run needs besides the tmux options: the roots it may run under, the approvals. */
export type CommandRunOptions = StartOptions & {
    /** The directories the file browser serves, from which a repository is taken. */
    rootsFor?: () => string[];
    /** The approvals file. Defaults to ~/.oculus/approvals.json. */
    approvalsFor?: () => string;
    /** Re-read the terminal manager after a write. */
    refresh?: () => void;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The bytes of the token a start mints for its chain's markers, printed as hex. */
const TOKEN_BYTES = 6;

/**
 * The context of a run: each field is read as the text or the whole number it should be, and
 * absent when it is anything else, so a placeholder the page gave no usable value for refuses the
 * run.
 */
const contextShape = z
    .object({
        file: z.string().optional().catch(undefined),
        line: z.number().int().min(1).optional().catch(undefined),
        selectedText: z.string().optional().catch(undefined)
    })
    .catch({}) satisfies z.ZodType<CommandContext>;

const sourceShape = z.enum(['file', 'saved', 'found']);

/** Start the command a `command` action names, or answer what stops it. */
export async function startCommand(
    message: Record<string, unknown>,
    options: CommandRunOptions
): Promise<Response> {
    const found = repositoryOf(message.repo, options.rootsFor?.() ?? []);
    if ('error' in found) return refusal('bad-repo');
    const repo = found.repo;
    const name = message.name;
    if (typeof name !== 'string' || name === '') return refusal('bad-terminal');
    const source = sourceShape.safeParse(message.source);
    if (!source.success) return refusal('bad-terminal');
    const resolved = resolveChain(listCommands(repo).commands, name, source.data);
    if ('error' in resolved) return refusal(resolved.error, resolved.names);
    const context = contextShape.parse(message.context);
    const runs = resolved.chain.map((command) => command.run);
    const filled = fillPlaceholders(runs, context, repo);
    if ('error' in filled) return refusal(filled.error, filled.names);
    const approvals = options.approvalsFor?.() ?? defaultApprovalsPath();
    const lines = chainLines(repo, resolved.chain);
    const asks = resolved.chain.some((command) => command.source !== 'saved');
    if (asks && !isApproved(approvals, chainText(repo, lines))) {
        return json({ approve: lines }, { headers: NO_STORE });
    }
    const token = randomBytes(TOKEN_BYTES).toString('hex');
    const lined = resolved.chain.map((command, at) => ({ ...command, run: filled.lines[at] }));
    const terminal = await startTerminal(
        { kind: 'shell', cwd: repo, cols: message.cols, rows: message.rows, name },
        {
            ...options,
            command: chainLine(lined, token),
            taskEnv: filled.env,
            task: {
                repo,
                name,
                source: source.data,
                token,
                chain: resolved.chain.map((one) => ({ name: one.name, cwd: one.cwd }))
            }
        }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/** The listed task terminal an id names, or the word that refuses it. */
async function taskTerminal(
    id: unknown,
    options: CommandRunOptions
): Promise<Terminal | TerminalRefusal> {
    if (!isTerminalId(id)) return NOT_OURS;
    const found = (await listTerminals(options)).find((terminal) => terminal.id === id);
    if (found === undefined) return NOT_LISTED;
    if (!found.task) return 'not-a-task';
    return found;
}

/** Run an ended task terminal's line again; a line still running is refused. */
export async function rerunTask(
    message: Record<string, unknown>,
    options: CommandRunOptions
): Promise<Response> {
    const terminal = await taskTerminal(message.id, options);
    if (typeof terminal === 'string') return refusal(terminal);
    if (terminal.exit === null) return refusal('still-running');
    await respawnTerminal(terminal.id, options);
    options.refresh?.();
    return json({ ok: true, id: terminal.id }, { headers: NO_STORE });
}

/**
 * Run a task terminal's line again. A line still running is stopped first, which asks for a
 * confirmation naming the process: the answer is `{ confirm: <process> }` until the request
 * carries `confirmed: true`. An ended line is run again as rerun does.
 */
export async function restartTask(
    message: Record<string, unknown>,
    options: CommandRunOptions
): Promise<Response> {
    const terminal = await taskTerminal(message.id, options);
    if (typeof terminal === 'string') return refusal(terminal);
    if (terminal.exit === null && message.confirmed !== true) {
        return json({ confirm: terminal.command || terminal.name }, { headers: NO_STORE });
    }
    await respawnTerminal(terminal.id, options);
    options.refresh?.();
    return json({ ok: true, id: terminal.id }, { headers: NO_STORE });
}

/** All the text of a listed terminal's pane, or the word refusing an unlisted name. */
export async function captureTask(
    message: Record<string, unknown>,
    options: CommandRunOptions
): Promise<Response> {
    const id = message.id;
    const listed = isTerminalId(id) && (await listTerminals(options)).some((one) => one.id === id);
    if (!listed) return refusal(NOT_LISTED);
    const output = await paneOutput(id, options);
    return json({ ok: true, id, output }, { headers: NO_STORE });
}
