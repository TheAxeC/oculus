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
import { homedir } from 'node:os';
import { z } from 'zod';
import { isUpdateTask } from '../../../data/helpers/run/tasks.ts';
import { isMap, scalar } from '../../../data/helpers/guards.ts';
import { tokenedBody } from '../../core/auth.ts';
import { glyphCatalog, textCatalog } from '../../../data/sources/config.ts';
import { repositoryRoots } from '../../files/roots.ts';
import { approveLatexStep, startLatex } from './latex/latex.ts';
import type { RcHomes } from './latex/approval.ts';
import { captureTask, restartTask, rerunTask, startCommand } from '../runs/commands/run.ts';
import { startChat, type ChatOptions } from './start/chat.ts';
import { defaultApprovalsPath } from '../approvals/approvals.ts';
import {
    approveSeed,
    seedApproval,
    seedFacts,
    taskPrompt,
    type SeedSource
} from '../runs/seeds/task-start.ts';
import { words } from '../../core/words.ts';
import {
    accountEnv,
    accountOfPath,
    agentAccounts,
    compose,
    composeRequest,
    readAgentsFile
} from './start/compose.ts';
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
    startTerminal,
    steerTerminal,
    stopTerminal,
    type StartOptions
} from './sessions.ts';
import { TmuxFailed, TerminalRefused, refusal, refusalFor } from './refusal.ts';
import { shellWord } from './shell-word.ts';
import { startUpdateTask } from '../runs/schedules/task.ts';
import { run } from './tmux.ts';
import type { Turns } from './latex/turns.ts';
import type { SessionRecord, TerminalKind, TerminalResume } from '../../../data/model/index.ts';
import { taskRefOf } from '../../../data/shapes/shapes.ts';

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
        /** Whether a program is found, as a build looks up each program of its recipe. */
        programFound?: (program: string) => boolean;
        /** Re-read the terminal manager after a write. */
        refresh?: () => void;
        /** Serves requests for one build one at a time; a request without it is served at once. */
        turns?: Turns;
        /** The user's shell, whose base name a busy read compares a pane's command with. */
        shell?: string;
        /** The approvals file the command texts are checked against. */
        approvalsFor?: () => string;
        /** The directories one of which holds a command's repository; the workspace's folders. */
        rootsFor?: () => string[];
        /** The home and XDG folders a build reads latexmkrc files from; the process's if absent. */
        latexHomesFor?: () => RcHomes;
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
        rootsFor: options.rootsFor ?? (() => repositoryRoots(options.openFor())),
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

/**
 * The account a session's transcript sits under, as the environment its resumed or forked process
 * starts with, so a session of a second account continues under that account's login.
 */
function sessionAccount(record: SessionRecord, options: TerminalOptions) {
    const accounts = agentAccounts(options.localFor());
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
    const local = options.localFor();
    let prompt = request.prompt;
    let name: string | undefined;
    let seed = '';
    if (request.task !== undefined) {
        ({ prompt, name, seed } = taskPrompt(request, request.task, seedSource(options)));
    }
    const composed = compose(
        { ...request, prompt },
        readAgentsFile(options.engine).agents,
        agentAccounts(local),
        local.claudeBin
    );
    if (request.task !== undefined) {
        const approve = seedApproval(
            request,
            seed,
            options.approvalsFor?.() ?? defaultApprovalsPath()
        );
        if (approve !== null) return json({ approve }, { headers: NO_STORE });
    }
    const kind: TerminalKind = request.agent;
    const id = newId(kind);
    const terminal = await startTerminal(
        {
            id,
            kind,
            cwd: request.cwd,
            cols: message.cols,
            rows: message.rows,
            name,
            env: composed.env
        },
        composed.argv === null ? options : { ...options, argv: composed.argv }
    );
    if (composed.keys.trim() !== '') await steerTerminal(id, composed.keys, options);
    options.refresh?.();
    return json({ ok: true, terminal }, { headers: NO_STORE });
}

/**
 * What the task steps read: the open workspace, the merged config and the engine of this request.
 */
function seedSource(options: TerminalOptions): SeedSource {
    return { open: options.openFor(), merged: options.configFor(), engine: options.engine };
}

/** The task reference of a seed or approve-seed request, or the refusal for a missing one. */
function taskOfMessage(message: Record<string, unknown>) {
    return taskRefOf(message.task) ?? { id: '' };
}

/** The seed, folder and name the page shows for a task. */
function seedTask(message: Record<string, unknown>, options: TerminalOptions): Response {
    const facts = seedFacts(taskOfMessage(message), seedSource(options));
    return json({ ok: true, ...facts }, { headers: NO_STORE });
}

/** Approve a seed for a folder and an agent, after building the seed again. */
function approveSeedTask(message: Record<string, unknown>, options: TerminalOptions): Response {
    approveSeed(
        taskOfMessage(message),
        {
            seed: scalar(message.seed),
            cwd: scalar(message.cwd),
            agent: scalar(message.agent)
        },
        seedSource(options),
        options.approvalsFor?.() ?? defaultApprovalsPath()
    );
    return json({ ok: true }, { headers: NO_STORE });
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
    const cwd = options.openFor().primaryDir ?? homedir();
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

/** Start one of the four update tasks as a Claude terminal in the configured hub root. */
async function startTask(
    kind: unknown,
    cols: unknown,
    rows: unknown,
    options: TerminalOptions
): Promise<Response> {
    if (!isUpdateTask(kind)) return refusal('bad-terminal');
    const local = options.localFor();
    const hub = options.openFor().primaryDir;
    if (hub === null) return refusal('no-primary');
    const started = await startUpdateTask(kind, false, {
        ...options,
        hub,
        claudeBin: local.claudeBin,
        size: { cols, rows }
    });
    if ('refused' in started) return refusal(started.refused, started.names);
    options.refresh?.();
    return json({ ok: true, terminal: started.terminal }, { headers: NO_STORE });
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
    const read = await tokenedBody(request, token, {
        headers: NO_STORE,
        text: () => textCatalog(options.configFor())
    });
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
        if (message.action === 'approve-latex') {
            return approveLatexStep(message, options);
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
        if (message.action === 'seed') return seedTask(message, options);
        if (message.action === 'approve-seed') return approveSeedTask(message, options);
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
