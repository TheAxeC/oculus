// Layer 2, server. The /api/terminal endpoint. A route module may export only its verbs, so
// everything the request does is here and src/routes/api/(sessions)/terminal/+server.ts is the two
// lines that join them, the pattern lib/server/content/docs.ts and lib/server/edit/writes.ts
// already hold.
//
// A GET lists the terminals and is same-origin only, like every read. A POST starts, stops, resizes
// or resumes a terminal, starts the composer's session, types a message into one or interrupts its
// turn, forks a session, starts dataset recovery, starts an update task, or builds or cleans one
// main file of a manuscript, and additionally carries the write token,
// since it is a write in DESIGN.md's "Auth" sense: it runs a process on the machine.
//
// The resume action is DESIGN.md's one explicit migration: an observed session becomes a terminal
// oculus holds by running `claude --resume <id>` or `codex resume <id>` in its own cwd. Nothing is
// signalled: a session whose process is still running is refused until it has ended, since two
// processes writing one transcript is what the rule against signalling exists to prevent.
//
// A refusal the page has words for travels as the catalog key of those words, so the endpoint holds
// no English the page would have to show raw. The page maps the two keys back through t().

import { join } from 'node:path';
import { taskSkipPermissions } from '../../../data/helpers/tasks.ts';
import { scalar } from '../../../data/helpers/guards.ts';
import { hasToken, sameOrigin } from '../../core/auth.ts';
import { loadConfig, loadLocalOrDefaults, textCatalog } from '../../../data/sources/config.ts';
import { MANUSCRIPT, mains } from '../../content/latex.ts';
import { projectDirectory } from '../../files/files.ts';
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
    KINDS,
    RESUME_TOOLS,
    interruptTerminal,
    isSessionId,
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
import type { SessionRecord, TerminalKind, TerminalResume } from '../../../data/model/index.ts';

/** The catalog keys the page has words for; every other refusal is the server's own sentence. */
const UNKNOWN = 'sessions.resume_unknown';
const LIVE = 'sessions.resume_live';

/** The longest name a terminal may carry, which is what sessions.ts `label` accepts. */
const NAME_MAX = 80;

/**
 * Why a stop or a resize is refused for a session under the `oculus-` prefix that oculus did not
 * mint. The list carries such a session with `foreign: true`, so the refusal says what it is rather
 * than reading as a malformed request.
 */
const NOT_OURS = 'id is not a terminal id: this tmux session was not started by oculus';

/** The four update skills the palette and tray may start. */
const TASKS = ['litwatch', 'scout', 'linkedin', 'inbox'] as const;
type TaskKind = (typeof TASKS)[number];

/** The two things a reader does to one main file of a manuscript. */
const LATEX_STEPS = ['build', 'clean'] as const;
type LatexStep = (typeof LATEX_STEPS)[number];

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
        /** Re-read the terminal manager after a write. */
        refresh?: () => void;
    };

function json(status: number, body: unknown): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }
    });
}

function reason(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/** GET /api/terminal: every terminal oculus owns. */
export async function handleTerminalList(
    request: Request,
    options: StartOptions = {}
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    return json(200, { terminals: await listTerminals(options) });
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
    if (record === null) return json(400, { error: UNKNOWN });
    if (record.live) return json(400, { error: LIVE });
    const title = record.title === '' ? record.id : record.title;
    const { prefix, env } = sessionAccount(record, options);
    const terminal = await startTerminal(
        {
            kind: resume.tool,
            cwd: record.cwd ?? '',
            cols: cols as number,
            rows: rows as number,
            name: title.slice(0, NAME_MAX),
            resume,
            env
        },
        { ...options, argv: [...prefix, ...resumeArgs(resume)] }
    );
    options.refresh?.();
    return json(200, { ok: true, terminal });
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
    if (record?.tool !== resume.tool) return json(400, { error: UNKNOWN });
    const title = record.title === '' ? record.id : record.title;
    const catalog = textCatalog(options.configFor?.() ?? loadConfig(options.engine).config);
    const { prefix, env } = sessionAccount(record, options);
    const terminal = await startTerminal(
        {
            kind: resume.tool,
            cwd: record.cwd ?? '',
            cols: message.cols as number,
            rows: message.rows as number,
            name: words(catalog, 'server.fork.name', title).slice(0, NAME_MAX),
            env
        },
        { ...options, argv: [...prefix, ...forkArgs(resume)] }
    );
    options.refresh?.();
    return json(200, { ok: true, terminal });
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
            cols: message.cols as number,
            rows: message.rows as number,
            env: composed.env
        },
        composed.argv === null ? options : { ...options, argv: composed.argv }
    );
    if (composed.keys.trim() !== '') await steerTerminal(id, composed.keys, options);
    options.refresh?.();
    return json(200, { ok: true, terminal });
}

/** Quote one word for the shell command tmux starts. */
function shellWord(value: string): string {
    return `'${value.replaceAll("'", `'"'"'`)}'`;
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
        return json(400, { error: 'key is not a valid dataset key' });
    }
    const known = options.datasetIdsFor?.() ?? [];
    if (!known.includes(key)) {
        return json(400, { error: 'key is not a dataset in the current portfolio' });
    }
    const cwd = options.hubFor?.() ?? loadLocalOrDefaults(options.engine).hub;
    const terminal = await startTerminal(
        {
            kind: 'shell',
            cwd,
            cols: cols as number,
            rows: rows as number,
            name: `recover ${key}`
        },
        { ...options, command: `python3 tools/data/redownload.py ${shellWord(key)}` }
    );
    options.refresh?.();
    return json(200, { ok: true, terminal });
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
    if (typeof kind !== 'string' || !TASKS.includes(kind as TaskKind)) {
        return json(400, { error: `kind must be one of ${TASKS.join(', ')}` });
    }
    const local = options.localFor?.() ?? loadLocalOrDefaults(options.engine);
    const config = options.configFor?.() ?? loadConfig(options.engine).config;
    const terminal = await startTerminal(
        {
            kind: 'claude',
            cwd: local.hub,
            cols: cols as number,
            rows: rows as number,
            name: `task ${kind}`
        },
        {
            ...options,
            command: taskCommand(local.claudeBin, kind as TaskKind, taskSkipPermissions(config))
        }
    );
    options.refresh?.();
    return json(200, { ok: true, terminal });
}

/**
 * The exact latexmk command one step runs. `-file-line-error` is what puts a file and a line in
 * front of every error, which is the form server/content/latex.ts reads the log back in; the flags
 * are this module's own words and the file is the one value from the page, so it is the one word
 * quoted.
 */
function latexCommand(step: LatexStep, main: string): string {
    if (step === 'clean') return `latexmk -c ${shellWord(main)}`;
    return `latexmk -pdf -interaction=nonstopmode -file-line-error ${shellWord(main)}`;
}

/**
 * The name the terminals list shows for one step, from the catalog: the reader sees it, so it is
 * words rather than a literal, as the chat terminals' names are. The route hands the config its
 * server already holds; a caller that hands none reads the engine's own.
 */
function latexName(options: TerminalOptions, step: LatexStep, id: string, main: string): string {
    const catalog = textCatalog(options.configFor?.() ?? loadConfig(options.engine).config);
    return words(catalog, 'server.latex.name', step, id, main).slice(0, NAME_MAX);
}

/**
 * Build or clean one main file, as a shell terminal in the project's own `manuscript/` folder. The
 * file is checked against the folder's own main files before a command is built from it, so the
 * only names that can reach latexmk are the ones the panel offered.
 */
async function startLatex(
    message: Record<string, unknown>,
    options: TerminalOptions
): Promise<Response> {
    const step = message.step as LatexStep;
    if (!LATEX_STEPS.includes(step)) {
        return json(400, { error: `step must be one of ${LATEX_STEPS.join(', ')}` });
    }
    const id = message.id;
    if (typeof id !== 'string' || id === '') {
        return json(400, { error: 'id is not a project id' });
    }
    const project = (options.projectFor ?? (() => null))(id);
    if (project === null) {
        return json(400, { error: 'id is not a project in the current portfolio' });
    }
    const hub =
        options.hubFor?.() ?? (options.localFor?.() ?? loadLocalOrDefaults(options.engine)).hub;
    const folder = projectDirectory(hub, project.folder);
    const main = message.main;
    if (typeof main !== 'string' || !mains(folder).includes(main)) {
        return json(400, { error: 'main is not a main file of this project' });
    }
    const terminal = await startTerminal(
        {
            kind: 'shell',
            cwd: join(folder, MANUSCRIPT),
            cols: message.cols as number,
            rows: message.rows as number,
            name: latexName(options, step, id, main)
        },
        { ...options, command: latexCommand(step, main) }
    );
    options.refresh?.();
    return json(200, { ok: true, terminal });
}

/**
 * POST /api/terminal: start, compose, steer, interrupt, fork, stop, resize, resume or recover one
 * terminal.
 */
export async function handleTerminal(
    request: Request,
    token: string,
    options: TerminalOptions
): Promise<Response> {
    if (!sameOrigin(request, request.headers.get('host') ?? '')) {
        return json(403, { error: 'the request did not come from this page' });
    }
    if (!hasToken(request, token)) {
        return json(403, { error: 'the write token is missing or stale' });
    }
    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return json(400, { error: 'the body is not JSON' });
    }
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return json(400, { error: 'the body is not an action' });
    }
    const message = body as Record<string, unknown>;

    try {
        if (message.action === 'start') {
            const kind = message.kind as TerminalKind;
            if (!KINDS.includes(kind)) {
                return json(400, { error: `kind must be one of ${KINDS.join(', ')}` });
            }
            const terminal = await startTerminal(
                {
                    kind,
                    cwd: scalar(message.cwd),
                    cols: message.cols as number,
                    rows: message.rows as number,
                    name: typeof message.name === 'string' ? message.name : undefined
                },
                options
            );
            options.refresh?.();
            return json(200, { ok: true, terminal });
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
        if (message.action === 'chat') {
            const terminal = await startChat(message.id, message.cols, message.rows, options);
            options.refresh?.();
            return json(200, { ok: true, terminal });
        }
        if (message.action === 'compose') {
            return await composeSession(message, options);
        }
        if (message.action === 'steer') {
            if (!isTerminalId(message.id)) return json(400, { error: NOT_OURS });
            await steerTerminal(message.id, scalar(message.text), options);
            return json(200, { ok: true, id: message.id });
        }
        if (message.action === 'interrupt') {
            if (!isTerminalId(message.id)) return json(400, { error: NOT_OURS });
            await interruptTerminal(message.id, options);
            return json(200, { ok: true, id: message.id });
        }
        if (message.action === 'fork') {
            const tool = message.tool as TerminalResume['tool'];
            if (!RESUME_TOOLS.includes(tool)) {
                return json(400, { error: `tool must be one of ${RESUME_TOOLS.join(', ')}` });
            }
            if (!isSessionId(message.id)) return json(400, { error: 'id is not a session id' });
            return await forkSession({ tool, id: message.id }, message, options);
        }
        if (message.action === 'stop') {
            if (!isTerminalId(message.id)) return json(400, { error: NOT_OURS });
            await stopTerminal(message.id, options);
            options.refresh?.();
            return json(200, { ok: true, id: message.id });
        }
        if (message.action === 'resume') {
            const tool = message.tool as TerminalResume['tool'];
            if (!RESUME_TOOLS.includes(tool)) {
                return json(400, { error: `tool must be one of ${RESUME_TOOLS.join(', ')}` });
            }
            if (!isSessionId(message.id)) return json(400, { error: 'id is not a session id' });
            return await resumeSession(
                { tool, id: message.id },
                message.cols,
                message.rows,
                options
            );
        }
        if (message.action === 'resize') {
            if (!isTerminalId(message.id)) return json(400, { error: NOT_OURS });
            await resizeTerminal(
                message.id,
                message.cols as number,
                message.rows as number,
                options
            );
            return json(200, { ok: true, id: message.id });
        }
    } catch (error) {
        return json(400, { error: reason(error) });
    }
    return json(400, {
        error: 'action must be start, compose, steer, interrupt, fork, stop, resize, resume, recover, task, latex or chat'
    });
}
