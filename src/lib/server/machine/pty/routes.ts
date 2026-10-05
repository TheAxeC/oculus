// Layer 2, server. The /api/terminal endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/terminal/+server.ts is the two
// lines that join them, the pattern lib/server/content/docs.ts and lib/server/edit/writes.ts
// already hold.
//
// A GET lists the terminals and is same-origin only, like every read. A POST starts, stops, resizes
// or resumes a terminal, starts the composer's session, types a message into one or interrupts its
// turn, forks a session, starts dataset recovery, starts an update task, or builds or cleans one
// main file of a project's manuscript or of a folder of a served root, runs a project command,
// runs a task terminal's line again or reads the output of a listed terminal, and additionally
// carries the write token, since it is a write in DESIGN.md's "Auth" sense: it runs a process on
// the machine.
//
// The resume action is DESIGN.md's one explicit migration: an observed session becomes a terminal
// oculus holds by running `claude --resume <id>` or `codex resume <id>` in its own cwd. Nothing is
// signalled: a session whose process is still running is refused until it has ended, since two
// processes writing one transcript is what the rule against signalling exists to prevent.
//
// A refusal travels as one word of TERMINAL_REFUSALS (pty/refusal.ts), so the endpoint holds no
// English and no text of tmux or of a validator reaches the page, which says the sentence the
// catalog holds for the word (state/shared/answers/terminal-words.ts).

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { join } from 'node:path';
import { taskSkipPermissions } from '../../../data/helpers/run/tasks.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { tokenedBody } from '../../core/auth.ts';
import { glyphCatalog, loadLocalOrDefaults, textCatalog } from '../../../data/sources/config.ts';
import { MANUSCRIPT, isMainOf, programOf } from '../../content/latex.ts';
import type { Program } from '../../../data/prose/latex.ts';
import { projectDirectory, resolveRootPath, type Root } from '../../files/files.ts';
import { captureTask, restartTask, rerunTask, startCommand } from '../commands/run.ts';
import { startChat, type ChatOptions } from './chat.ts';
import { words } from '../../core/words.ts';
import {
    accountEnv,
    accountOfPath,
    agentAccounts,
    compose,
    composeRequest,
    readAgentsFile
} from './compose.ts';
import {
    NOT_OURS,
    busyIds,
    busyTerminals,
    clearTerminal,
    renameTerminal,
    restyleTerminal
} from './edit.ts';
import {
    RESUME_TOOLS,
    interruptTerminal,
    isSessionId,
    NAME_MAX,
    isTerminalId,
    listTerminals,
    newId,
    resizeTerminal,
    resumeArgs,
    respawnTerminal,
    startTerminal,
    steerTerminal,
    stopTerminal,
    type StartOptions
} from './sessions.ts';
import { TmuxFailed, TerminalRefused, refusal, refusalFor } from './refusal.ts';
import { shellWord } from './shell-word.ts';
import { run } from './tmux.ts';
import type {
    SessionRecord,
    Terminal,
    TerminalJob,
    TerminalKind,
    TerminalResume
} from '../../../data/model/index.ts';

/** The four update skills the palette and tray may start. */
const TASKS = ['litwatch', 'scout', 'linkedin', 'inbox'] as const;
type TaskKind = (typeof TASKS)[number];

/** Whether a value names one of the four update tasks. */
function isTask(value: unknown): value is TaskKind {
    return TASKS.some((task) => task === value);
}

/** The two things a reader does to one main file of a manuscript. */
const LATEX_STEPS = ['build', 'clean'] as const;
type LatexStep = (typeof LATEX_STEPS)[number];

/** The step of a latex request: build or clean, and anything else is refused. */
const latexStepShape = z.literal(LATEX_STEPS);

/**
 * The folder a latex request names: a project by its id, or a folder of a served root by the root's
 * key and the path under it. A request naming both, or neither, names no folder.
 */
const latexFolderShape = z.union([
    z.object({ id: z.string().min(1), root: z.undefined().optional() }),
    z.object({ id: z.undefined().optional(), root: z.string().min(1), path: z.string() })
]);

/** The name of a start request: text, and anything else starts the terminal with no name. */
const startNameShape = z.string().optional().catch(undefined);

/**
 * The text of a steer, read by the shared `scalar`: a string as it is, a number or a boolean
 * written out, and anything else the empty text, which steerTerminal then refuses.
 */
const steerTextShape = z
    .unknown()
    .optional()
    .transform((value) => scalar(value));

/** The tool of a fork or a resume request: one of the two whose sessions can be continued. */
const resumeToolShape = z.literal(RESUME_TOOLS);

export type TerminalOptions = StartOptions &
    ChatOptions & {
        /**
         * The session record a resume is about, from the last published `sessions` payload.
         * Defaulted Tests and the route pass the source they own.
         */
        recordFor?: (id: string) => SessionRecord | null;
        /** Dataset keys in the server's latest portfolio payload. */
        datasetIdsFor?: () => string[];
        /** The hub root in which a recovery shell starts. */
        hubFor?: () => string;
        /**
         * The roots the file browser serves, which a latex request for a folder is looked up in.
         */
        servedRootsFor?: () => Root[];
        /** Re-read the terminal manager after a write. */
        refresh?: () => void;
        /** The user's shell, whose base name a busy read compares a pane's command with. */
        shell?: string;
        /** The directories the file browser serves, one of which holds a command's repository. */
        rootsFor?: () => string[];
        /** The approvals file the command texts are checked against. */
        approvalsFor?: () => string;
    };

/** The options a list request takes: a tmux runner and the shell a busy read compares against. */
export type ListOptions = StartOptions & { shell?: string };

/** What every answer of this route carries besides its type: nothing of it is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/**
 * The options with a runner that turns a failed tmux call into TmuxFailed, so the catch of
 * handleTerminal can tell tmux's own failure, whose text never reaches the page, from a refusal a
 * check made.
 */
function wrapped(options: TerminalOptions): TerminalOptions {
    const inner = options.run ?? run;
    return {
        ...options,
        run: async (args, tmux) => {
            try {
                return await inner(args, tmux);
            } catch (error) {
                if (error instanceof TerminalRefused) throw error;
                throw new TmuxFailed(error instanceof Error ? error.message : String(error));
            }
        }
    };
}

/**
 * GET /api/terminal: every terminal oculus owns, or with `?busy=<id>,<id>` which of those named
 * are running a program other than the user's shell.
 */
export async function handleTerminalList(
    request: Request,
    options: ListOptions = {}
): Promise<Response> {
    const query = new URL(request.url).searchParams.get('busy');
    if (query !== null) {
        const ids = busyIds(query);
        if (typeof ids === 'string') {
            return json({ error: ids }, { status: 400, headers: NO_STORE });
        }
        const shell = options.shell ?? process.env.SHELL ?? '/bin/zsh';
        return json({ busy: await busyTerminals(ids, shell, options) }, { headers: NO_STORE });
    }
    return json({ terminals: await listTerminals(options) }, { headers: NO_STORE });
}

/**
 * The terminal that continues one session, or the refusal. The record is read rather than trusted
 * from the page: the cwd the tmux session starts in is the record's own, and a live record is
 * refused here even though the page does not offer the control for one, since the page's payload
 * can be one rescan out of date.
 */
async function resumeSession(
    resume: TerminalResume,
    cols: unknown,
    rows: unknown,
    options: TerminalOptions
): Promise<Response> {
    const record = (options.recordFor ?? (() => null))(resume.id);
    if (record === null) return refusal('session-unknown');
    if (record.live) return refusal('session-live');
    const title = record.title === '' ? record.id : record.title;
    const { prefix, env } = sessionAccount(record, options);
    const terminal = await startTerminal(
        {
            kind: resume.tool,
            cwd: record.cwd ?? '',
            cols,
            rows,
            name: title.slice(0, NAME_MAX),
            resume,
            env
        },
        { ...options, argv: [...prefix, ...resumeArgs(resume)] }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/** The local config a request reads, the route's own when it hands one. */
function localOf(options: TerminalOptions) {
    return options.localFor?.() ?? loadLocalOrDefaults(options.engine);
}

/**
 * The account a session's transcript sits under, as the environment its resumed or forked process
 * starts with, so a session of a second account continues under that account's login.
 */
function sessionAccount(record: SessionRecord, options: TerminalOptions) {
    const accounts = agentAccounts(localOf(options));
    return accountEnv(record.tool, accountOfPath(record.tool, record.path, accounts));
}

/**
 * The argv that forks one session: a new session carrying the old one's conversation, which
 * `claude --resume <id> --fork-session` and `codex fork <id>` start. A fork leaves the session it
 * copies running, so a live one is forked as well as an ended one.
 */
export function forkArgs(resume: TerminalResume): string[] {
    const args = resumeArgs(resume);
    if (resume.tool === 'claude') return [...args, '--fork-session'];
    return ['codex', 'fork', resume.id];
}

/** Start a fork of one session in a new terminal, in the session's own folder. */
async function forkSession(
    resume: TerminalResume,
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const record = (options.recordFor ?? (() => null))(resume.id);
    if (record?.tool !== resume.tool) return refusal('session-unknown');
    const title = record.title === '' ? record.id : record.title;
    const catalog = textCatalog(options.configFor());
    const { prefix, env } = sessionAccount(record, options);
    const terminal = await startTerminal(
        {
            kind: resume.tool,
            cwd: record.cwd ?? '',
            cols: message.cols,
            rows: message.rows,
            name: words(catalog, 'server.fork.name', title).slice(0, NAME_MAX),
            env
        },
        { ...options, argv: [...prefix, ...forkArgs(resume)] }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/**
 * Start the session the composer asked for. The argv is built from config/catalogs/agents.yml, the
 * account from local.yml and the prompt from the request, and tmux runs it directly; a shell's
 * prompt is its first command, typed into it once it has started.
 */
async function composeSession(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const request = composeRequest(message);
    const local = localOf(options);
    const composed = compose(
        request,
        readAgentsFile(options.engine).agents,
        agentAccounts(local),
        local.claudeBin
    );
    const kind: TerminalKind = request.agent;
    const id = newId(kind);
    const terminal = await startTerminal(
        {
            id,
            kind,
            cwd: request.cwd,
            cols: message.cols,
            rows: message.rows,
            env: composed.env
        },
        composed.argv === null ? options : { ...options, argv: composed.argv }
    );
    if (composed.keys.trim() !== '') await steerTerminal(id, composed.keys, options);
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/** Start the registry's recovery script for one dataset the current snapshot holds. */
async function recoverDataset(
    key: unknown,
    cols: unknown,
    rows: unknown,
    options: TerminalOptions
): Promise<Response> {
    // A key that starts with a dash would read as a flag of the recovery script (its --all fetches
    // every dataset), so it is refused before the snapshot is consulted; the snapshot decides the
    // rest.
    if (typeof key !== 'string' || key === '' || key.startsWith('-')) {
        return refusal('bad-terminal');
    }
    const known = options.datasetIdsFor?.() ?? [];
    if (!known.includes(key)) return refusal('bad-terminal');
    const cwd = options.hubFor?.() ?? loadLocalOrDefaults(options.engine).hub;
    const terminal = await startTerminal(
        {
            kind: 'shell',
            cwd,
            cols,
            rows,
            name: `recover ${key}`
        },
        { ...options, command: `python3 tools/data/redownload.py ${shellWord(key)}` }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/**
 * The server-built shell command for one update task. It is an ordinary interactive session, the
 * shape the chat terminal has, so the skill runs in the pty the terminal pane shows and every
 * permission prompt the CLI raises is answered there by the reader; the skill invocation is the
 * session's first message, passed as the positional argument. `tasks.skip_permissions` puts
 * `--dangerously-skip-permissions` back, which runs the task unattended instead.
 */
function taskCommand(binary: string, kind: TaskKind, skip: boolean): string {
    const argv = [binary];
    if (skip) argv.push('--dangerously-skip-permissions');
    argv.push(`/research-cockpit ${kind}`);
    return argv.map(shellWord).join(' ');
}

/** Start one of the four update tasks as a Claude terminal in the configured hub root. */
async function startTask(
    kind: unknown,
    cols: unknown,
    rows: unknown,
    options: TerminalOptions
): Promise<Response> {
    if (!isTask(kind)) return refusal('bad-terminal');
    const local = options.localFor?.() ?? loadLocalOrDefaults(options.engine);
    const config = options.configFor();
    const terminal = await startTerminal(
        {
            kind: 'claude',
            cwd: local.hub,
            cols,
            rows,
            name: `task ${kind}`
        },
        {
            ...options,
            command: taskCommand(local.claudeBin, kind, taskSkipPermissions(config))
        }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/** The latexmk switch that builds with each program. */
const LATEX_SWITCH: Record<Program, string> = {
    pdflatex: '-pdf',
    xelatex: '-pdfxe',
    lualatex: '-pdflua'
};

/**
 * The exact latexmk command one step runs. `-file-line-error` is what puts a file and a line in
 * front of every error, which is the form server/content/latex.ts reads the log back in; the flags
 * are this module's own words and the file is the one value from the page, so it is the one word
 * quoted. The program is the one the main file's magic comment names; a clean needs none.
 */
export function latexCommand(step: LatexStep, main: string, program: Program): string {
    if (step === 'clean') return `latexmk -c ${shellWord(main)}`;
    const flags = `${LATEX_SWITCH[program]} -interaction=nonstopmode -file-line-error`;
    return `latexmk ${flags} ${shellWord(main)}`;
}

/**
 * The name the terminals list shows for one step, from the catalog: the reader sees it, so it is
 * words rather than a literal, as the chat terminals' names are. The route hands the config its
 * request read.
 */
function latexName(options: TerminalOptions, step: LatexStep, id: string, main: string): string {
    const catalog = textCatalog(options.configFor());
    return words(catalog, 'server.latex.name', step, id, main).slice(0, NAME_MAX);
}

/** The folder a latex request names and what the terminal's name calls it, or the refusal. */
function latexFolder(
    message: Record<string, unknown>,
    options: TerminalOptions
): { dir: string; label: string } | Response {
    const named = latexFolderShape.safeParse(message);
    if (!named.success) {
        return refusal('not-an-action');
    }
    if (named.data.id === undefined) {
        const found = resolveRootPath(
            options.servedRootsFor?.() ?? [],
            named.data.root,
            named.data.path
        );
        if ('error' in found) return refusal(found.error);
        return {
            dir: found.path,
            label: named.data.path === '' ? named.data.root : named.data.path
        };
    }
    const project = (options.projectFor ?? (() => null))(named.data.id);
    if (project === null) return refusal('no-project');
    const hub =
        options.hubFor?.() ?? (options.localFor?.() ?? loadLocalOrDefaults(options.engine)).hub;
    return {
        dir: join(projectDirectory(hub, project.folder), MANUSCRIPT),
        label: named.data.id
    };
}

/**
 * The kept terminal of a build or clean of one main file, or null: the listed task terminal whose
 * job is a LaTeX job of this folder with this name. The name holds the step, the folder's label and
 * the main file, so a main file has one terminal per step.
 */
async function keptLatex(
    folder: string,
    name: string,
    options: TerminalOptions
): Promise<Terminal | null> {
    const listed = await listTerminals(options);
    return (
        listed.find(
            (one) =>
                one.task &&
                one.job?.source === 'latex' &&
                one.job.repo === folder &&
                one.job.name === name
        ) ?? null
    );
}

/**
 * Build or clean one main file, as a task terminal in the folder of the main file: a project's
 * `manuscript/` folder or a folder of a served root. The file is checked against the folder's own
 * main files before a command is built from it, so the only names that can reach latexmk are the
 * ones the view offered. tmux keeps the pane after latexmk ended, with its exit status, so the
 * output stays readable. A step whose kept terminal is listed runs in that terminal: a latexmk
 * still running is answered as it is, and an ended one is run again there with the command the
 * request builds now, so a build on every save leaves one terminal per main file and step.
 */
async function startLatex(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const asked = latexStepShape.safeParse(message.step);
    if (!asked.success) return refusal('not-an-action');
    const step = asked.data;
    const folder = latexFolder(message, options);
    if (folder instanceof Response) return folder;
    const main = message.main;
    if (typeof main !== 'string' || !isMainOf(folder.dir, main)) {
        return refusal('not-a-main');
    }
    const name = latexName(options, step, folder.label, main);
    const command = latexCommand(step, main, programOf(join(folder.dir, main)));
    const kept = await keptLatex(folder.dir, name, options);
    if (kept !== null) {
        if (kept.exit !== null) {
            await respawnTerminal(kept.id, options, command);
            options.refresh?.();
        }
        const again = (await listTerminals(options)).find((one) => one.id === kept.id);
        return json({ ok: true, terminal: again ?? kept }, { headers: NO_STORE });
    }
    const job: TerminalJob = { repo: folder.dir, name, source: 'latex' };
    const terminal = await startTerminal(
        { kind: 'shell', cwd: folder.dir, cols: message.cols, rows: message.rows, name },
        { ...options, command, task: job }
    );
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/** The session a fork or a resume names, or the refusal of a tool or an id that is none. */
function sessionOf(message: Record<string, unknown>): TerminalResume | Response {
    const tool = resumeToolShape.safeParse(message.tool);
    if (!tool.success) return refusal('bad-terminal');
    if (!isSessionId(message.id)) return refusal('not-a-session');
    return { tool: tool.data, id: message.id };
}

/**
 * POST /api/terminal: start, compose, steer, interrupt, fork, stop, resize, resume or recover one
 * terminal, run a project command, or run a task terminal's line again.
 */
export async function handleTerminal(
    request: Request,
    token: string,
    options: TerminalOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE });
    if (read instanceof Response) return read;
    const body = read.body;
    if (!isMap(body)) return refusal('not-an-action');
    const message = body;
    const plain = options;
    options = wrapped(options);

    try {
        if (message.action === 'start') {
            const terminal = await startTerminal(
                {
                    kind: message.kind,
                    cwd: message.cwd,
                    cols: message.cols,
                    rows: message.rows,
                    name: startNameShape.parse(message.name)
                },
                options
            );
            options.refresh?.();
            return json({ ok: true, terminal }, { headers: NO_STORE });
        }
        if (message.action === 'recover') {
            return await recoverDataset(message.key, message.cols, message.rows, options);
        }
        if (message.action === 'task') {
            return await startTask(message.kind, message.cols, message.rows, options);
        }
        if (message.action === 'latex') {
            return await startLatex(message, options);
        }
        if (message.action === 'command') {
            return await startCommand(message, options);
        }
        if (message.action === 'rerun') {
            return await rerunTask(message, options);
        }
        if (message.action === 'restart') {
            return await restartTask(message, options);
        }
        if (message.action === 'capture') {
            return await captureTask(message, options);
        }
        if (message.action === 'chat') {
            const terminal = await startChat(message.id, message.cols, message.rows, options);
            options.refresh?.();
            return json({ ok: true, terminal }, { headers: NO_STORE });
        }
        if (message.action === 'compose') {
            return await composeSession(message, options);
        }
        if (message.action === 'steer') {
            if (!isTerminalId(message.id)) return refusal(NOT_OURS);
            await steerTerminal(message.id, steerTextShape.parse(message.text), options);
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'interrupt') {
            if (!isTerminalId(message.id)) return refusal(NOT_OURS);
            await interruptTerminal(message.id, options);
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'fork') {
            const session = sessionOf(message);
            if (session instanceof Response) return session;
            return await forkSession(session, message, options);
        }
        if (message.action === 'stop') {
            if (!isTerminalId(message.id)) return refusal(NOT_OURS);
            await stopTerminal(message.id, options);
            options.refresh?.();
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'rename') {
            await renameTerminal(message.id, message.title, options);
            options.refresh?.();
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'restyle') {
            const glyphs = Object.keys(glyphCatalog(options.configFor()));
            await restyleTerminal(
                message.id,
                { icon: message.icon, color: message.color },
                glyphs,
                options
            );
            options.refresh?.();
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'clear') {
            await clearTerminal(message.id, options);
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
        if (message.action === 'resume') {
            const session = sessionOf(message);
            if (session instanceof Response) return session;
            return await resumeSession(session, message.cols, message.rows, options);
        }
        if (message.action === 'resize') {
            if (!isTerminalId(message.id)) return refusal(NOT_OURS);
            await resizeTerminal(message.id, message.cols, message.rows, options);
            return json({ ok: true, id: message.id }, { headers: NO_STORE });
        }
    } catch (error) {
        return refusalFor(error, message.id, () => listTerminals(plain));
    }
    return refusal('not-an-action');
}
