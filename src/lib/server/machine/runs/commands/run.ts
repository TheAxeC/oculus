// Layer 2, server. The three actions of POST /api/terminal that belong to project commands.
//
// `command` resolves the command a press names, by its name and its source, and the commands it
// depends on, takes each placeholder's value from the context the page sent, and checks that the
// chain has been approved: the command form approves the chain of the entry it writes, and any
// other chain, or one whose text changed since, asks the reader. A chain not yet approved is
// answered as `{ approve: [<the lines of the chain>] }` and nothing starts; once it is
// approved, one shell terminal starts, named after the command, running the whole chain as one
// line, and it is a task terminal: tmux keeps it after its line ended, with the status of the line.
// Each placeholder of the line is `"$OCULUS_ARG_<n>"` and its value is set in the terminal's
// environment (placeholders.ts), so the shell never reads a value as code. The line prints a token
// minted for this start with each command's name, and the terminal's mark carries the token.
// The start is `runCommand`, which a schedule's run (schedules/run.ts) calls as the route does, so
// both refuse the same things in the same order.
//
// A command that is a task of an app (source `app`, or a typed entry of the file) is not a shell
// line: it asks no approval, and the app's host prepares it and it runs in a terminal of the kind
// `app` (apps/tools/run/tasks.ts). It is not a step another command depends on.
//
// `rerun` runs the line of an ended task terminal again in the same pane, and `restart` does the
// same for a line still running once the reader confirmed the process that would be stopped; for
// a task of an app the host prepares the task again, so both go through the app. The
// kept terminal of a LaTeX build or clean is answered with what its step waits on to be approved,
// and nothing runs, while the latexmkrc files or weave tools of the step are not approved.
// `capture` answers all the text a listed terminal's pane holds, which the page reads the
// diagnostics of a task from when no pane shows it. Every refusal is a word of TERMINAL_REFUSALS
// with the names its sentence is about (pty/refusal.ts).

import { randomBytes } from 'node:crypto';
import { json } from '@sveltejs/kit';
import { z } from 'zod';
import type {
    ChainLine,
    CommandContext,
    Terminal,
    TerminalRefusal
} from '../../../../data/model/index.ts';
import { NOT_LISTED, NOT_OURS } from '../../pty/edit.ts';
import { latexAgain } from '../../pty/latex/latex.ts';
import { refusal } from '../../pty/refusal.ts';
import type { TerminalOptions } from '../../pty/routes.ts';
import {
    isTerminalId,
    listTerminals,
    paneOutput,
    respawnTerminal,
    startTerminal,
    type StartOptions
} from '../../pty/sessions.ts';
import type { StreamTerminalSet } from '../../apps/tools/run/stream-terminals.ts';
import { resolveChain } from '../../../../data/helpers/run/chain.ts';
import {
    chainLines,
    chainText,
    defaultApprovalsPath,
    isApproved
} from '../../approvals/approvals.ts';
import { chainLine } from './chain.ts';
import { listAll, type CommandTasks } from './list.ts';
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
    /** The apps, whose tasks are commands too. */
    tasks?: CommandTasks;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The escape sequences of a terminal's bytes (control sequences and operating system commands). */
// eslint-disable-next-line no-control-regex
const ANSI = /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)/g;

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

const sourceShape = z.enum(['file', 'found', 'app']);

/** What a run of a command answers: its terminal, the chain that needs approval, or a refusal. */
export type CommandStart =
    | { terminal: Terminal }
    | { approve: ChainLine[] }
    | { refused: TerminalRefusal; names: string[] };

/**
 * Run the command of that name and source in the repository, with the context's values, in a
 * terminal of the given grid. The arguments are as a request carries them, each checked here, so
 * the route and a schedule's run refuse the same things in the same order. A chain not yet
 * approved answers its lines and starts nothing.
 */
export async function runCommand(
    folder: unknown,
    name: unknown,
    sourceName: unknown,
    rawContext: unknown,
    size: { cols: unknown; rows: unknown },
    options: CommandRunOptions
): Promise<CommandStart> {
    const found = repositoryOf(folder, options.rootsFor?.() ?? []);
    if ('error' in found) return { refused: 'bad-repo', names: [] };
    const repo = found.repo;
    if (typeof name !== 'string' || name === '') return { refused: 'bad-terminal', names: [] };
    const source = sourceShape.safeParse(sourceName);
    if (!source.success) return { refused: 'bad-terminal', names: [] };
    const listed = await listAll(repo, options.tasks);
    const resolved = resolveChain(listed.commands, name, source.data);
    if ('error' in resolved) return { refused: resolved.error, names: resolved.names };
    const root = resolved.chain[resolved.chain.length - 1];
    if (root.task !== undefined) {
        if (options.tasks === undefined) return { refused: 'task-gone', names: [name] };
        const started = await options.tasks.run(root, repo, size);
        options.refresh?.();
        return started;
    }
    const context = contextShape.parse(rawContext);
    const runs = resolved.chain.map((command) => command.run);
    const filled = fillPlaceholders(runs, context, repo);
    if ('error' in filled) return { refused: filled.error, names: filled.names };
    const approvals = options.approvalsFor?.() ?? defaultApprovalsPath();
    const lines = chainLines(repo, resolved.chain);
    if (!isApproved(approvals, chainText(repo, lines))) return { approve: lines };
    const token = randomBytes(TOKEN_BYTES).toString('hex');
    const lined = resolved.chain.map((command, at) => ({ ...command, run: filled.lines[at] }));
    const terminal = await startTerminal(
        { kind: 'shell', cwd: repo, cols: size.cols, rows: size.rows, name },
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
    return { terminal };
}

/** Start the command a `command` action names, or answer what stops it. */
export async function startCommand(
    message: Record<string, unknown>,
    options: CommandRunOptions
): Promise<Response> {
    const started = await runCommand(
        message.repo,
        message.name,
        message.source,
        message.context,
        { cols: message.cols, rows: message.rows },
        options
    );
    if ('refused' in started) return refusal(started.refused, started.names);
    if ('approve' in started) return json({ approve: started.approve }, { headers: NO_STORE });
    return json({ ok: true, terminal: started.terminal }, { headers: NO_STORE });
}

/** The listed task terminal an id names, or the word that refuses it. */
async function taskTerminal(
    id: unknown,
    options: CommandRunOptions & { streams?: StreamTerminalSet }
): Promise<Terminal | TerminalRefusal> {
    if (!isTerminalId(id)) return NOT_OURS;
    const streamed = options.streams?.record(id);
    const found = streamed ?? (await listTerminals(options)).find((terminal) => terminal.id === id);
    if (found === undefined) return NOT_LISTED;
    if (!found.task) return 'not-a-task';
    return found;
}

/**
 * Run an app's task terminal again: the command of that name is listed again, so the host
 * prepares the task as it is now, and its run takes over the row of the terminal.
 */
async function appAgain(
    terminal: Terminal,
    options: TerminalOptions & { tasks?: CommandTasks }
): Promise<Response> {
    const job = terminal.job;
    if (job === null || options.tasks === undefined) return refusal('task-gone', [terminal.name]);
    const listed = await listAll(job.repo, options.tasks);
    const command = listed.commands.find(
        (one) => one.name === job.name && one.source === job.source
    );
    if (command === undefined) return refusal('task-gone', [job.name]);
    const started = await options.tasks.run(command, job.repo, { cols: 120, rows: 30 }, terminal);
    if ('refused' in started) return refusal(started.refused, started.names);
    options.refresh?.();
    return json({ ok: true, id: started.terminal.id }, { headers: NO_STORE });
}

/**
 * Run an ended task terminal's line again; a line still running is refused. The kept terminal of a
 * LaTeX build or clean whose step waits on an approval answers what it waits on and runs nothing
 * (pty/latex/latex.ts, `latexAgain`).
 */
export async function rerunTask(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const terminal = await taskTerminal(message.id, options);
    if (typeof terminal === 'string') return refusal(terminal);
    if (terminal.exit === null) return refusal('still-running');
    if (terminal.job?.source === 'app') return appAgain(terminal, options);
    const waiting = latexAgain(terminal, options);
    if (waiting !== null) return waiting;
    await respawnTerminal(terminal.id, options);
    options.refresh?.();
    return json({ ok: true, id: terminal.id }, { headers: NO_STORE });
}

/**
 * Run a task terminal's line again. A line still running is stopped first, which asks for a
 * confirmation naming the process: the answer is `{ confirm: <process> }` until the request
 * carries `confirmed: true`. A line that may run again is run as rerun does, including the answer
 * of a LaTeX step that waits on an approval.
 */
export async function restartTask(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const terminal = await taskTerminal(message.id, options);
    if (typeof terminal === 'string') return refusal(terminal);
    if (terminal.exit === null && message.confirmed !== true) {
        return json({ confirm: terminal.command || terminal.name }, { headers: NO_STORE });
    }
    if (terminal.job?.source === 'app') return appAgain(terminal, options);
    const waiting = latexAgain(terminal, options);
    if (waiting !== null) return waiting;
    await respawnTerminal(terminal.id, options);
    options.refresh?.();
    return json({ ok: true, id: terminal.id }, { headers: NO_STORE });
}

/** All the text of a listed terminal's pane, or the word refusing an unlisted name. */
export async function captureTask(
    message: Record<string, unknown>,
    options: CommandRunOptions & { streams?: StreamTerminalSet }
): Promise<Response> {
    const id = message.id;
    if (isTerminalId(id) && options.streams?.has(id) === true) {
        const output = options.streams.replay(id).toString('utf8').replace(ANSI, '');
        return json({ ok: true, id, output }, { headers: NO_STORE });
    }
    const listed = isTerminalId(id) && (await listTerminals(options)).some((one) => one.id === id);
    if (!listed) return refusal(NOT_LISTED);
    const output = await paneOutput(id, options);
    return json({ ok: true, id, output }, { headers: NO_STORE });
}
