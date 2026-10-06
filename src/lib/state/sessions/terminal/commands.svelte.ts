// Layer 2, client state. The project commands of a repository: the list read once through the query
// client, the calls that run, approve, save and remove one, Rerun and Restart for a task terminal,
// the errors a task terminal printed kept as diagnostics, and the two default keys.
//
// A repository's list is held under the key `['commands', repo]` while a view watches it. A `files`
// message for a folder holding the repository marks it, and the next read asks again with any read
// still out cancelled, so the later read is the one held. A save or a remove reads it again at
// once. A view that stops watching the last repository forgets the key, and an answer still out
// for it is never held.
//
// A press that needs a decision is held here as the question (`asking`): the lines of the chain a
// press would run and the reader has not approved, or the process a Restart would stop. A button
// and a key ask the same question, and the shell draws it once, so the answer comes from one place
// whichever started the run.
//
// The form that saves a command is held here too (`forming`): a button opens it with the command
// to edit or none, and the shell draws it over the page, so it stands on the modal ground like
// the question does and not inside the view that opened it.
//
// A task terminal's output is read for `file:line:column: error|warning` lines by the pane that
// shows it, which hands each chunk to `note`. A line is read when it ends, with colour codes taken
// out, so a line that arrives in pieces reads as one. The scrollback a pane is sent on attaching
// replaces what was kept, which is what keeps an output replayed twice from counting twice. A task
// that ends while no pane is reading its terminal is read once from the server's capture of its
// pane, which replaces what was read, so the errors printed after a pane stopped reading are not
// lost. The chain line prints a marker before each command, the run's token and the command's name,
// and the output is read by those markers: a path an error names is resolved from the folder of the
// command that printed it, the token, the chain and its folders being the ones the terminal's mark
// carries. A line ending in the marker counts, so a command whose last output had no line break
// does not hide the next marker; a mark with no token is read by the bare name. A LaTeX build is a
// task terminal too, and its problems are the LaTeX state's own (state/sessions/latex.svelte.ts),
// so its output is not read here.

import { untrack } from 'svelte';
import { z } from 'zod';
import type {
    ChainLine,
    CommandContext,
    CommandDefault,
    CommandDiagnostic,
    CommandSource,
    CommandsAnswer,
    ProjectCommand,
    Terminal
} from '../../../data/model/index.ts';
import { deepestHolding, joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { chainMarker } from '../../../data/helpers/run/marker.ts';
import { readAs, readJson, rowsShape } from '../../../data/shapes/shapes.ts';
import { tabOfFile, type ServedRoot } from '../../sources/repositories/file-git.ts';
import { unreachableAnswer } from '../../shared/answers/answers.ts';
import type { EntitiesStore, Fetcher, Queries, WritesStore } from '../../shared/stores/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { holds } from '../../system/docs.svelte.ts';
import { COLS, ROWS, postTerminal } from './pty/pty-io.ts';

export type {
    ChainLine,
    CommandDefault,
    CommandDiagnostic,
    CommandFinding,
    CommandSource,
    CommandsAnswer,
    ProjectCommand
} from '../../../data/model/index.ts';

/** What every repository's query key opens with. */
const KIND = 'commands';

/** The most diagnostics kept for one terminal, and the longest unfinished line kept for one. */
const FOUND_MAX = 500;
const TAIL_MAX = 16384;

/** A line of output that names a place and a severity; the severity is read in any letter case. */
const ERROR_LINE =
    /^(?<file>[^\s:][^:]*):(?<line>\d+)(?::(?<column>\d+))?:\s*(?<severity>error|warning)\b:?\s*(?<message>.*)$/i;

/** Colour and cursor codes of the terminal, which are no part of a line's text. */
/* eslint-disable no-control-regex -- the codes are the control characters of the terminal. */
const ESCAPES =
    /\u001b\[[0-9;?]*[ -/]*[@-~]|\u001b\][^\u0007]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g;
/* eslint-enable no-control-regex */

/** One matched line, and the span of its `file:line[:column]` in the line. */
export type ErrorMatch = {
    file: string;
    line: number;
    column?: number;
    severity: 'error' | 'warning';
    message: string;
    start: number;
    length: number;
};

/** The error a line of output holds, or null for a line that holds none. */
export function errorMatch(text: string): ErrorMatch | null {
    const found = ERROR_LINE.exec(text);
    const groups = found?.groups;
    if (groups === undefined) return null;
    // A group that took no part in the match is absent, which the index type does not say.
    const column = groups.column as string | undefined;
    const place = `${groups.file}:${groups.line}${column === undefined ? '' : `:${column}`}`;
    return {
        file: groups.file,
        line: Number(groups.line),
        ...(column === undefined ? {} : { column: Number(column) }),
        severity: groups.severity.toLowerCase() === 'warning' ? 'warning' : 'error',
        message: groups.message,
        start: 0,
        length: place.length
    };
}

/** A path with its `.` and `..` segments folded away, for a path joined from two. */
function folded(path: string): string {
    const kept: string[] = [];
    for (const part of path.split('/')) {
        if (part === '' || part === '.') continue;
        if (part === '..') kept.pop();
        else kept.push(part);
    }
    return `/${kept.join('/')}`;
}

/** The command a run asks for, as the form writes it. */
export type CommandDraft = {
    name: string;
    run: string;
    cwd?: string;
    depends_on?: string[];
    default?: CommandDefault;
};

/** The form's draft of a saved command, with its folder written relative to the repository. */
export function draftOf(repo: string, command: ProjectCommand): CommandDraft {
    const folder = pathUnder(repo, command.cwd) ?? '';
    return {
        name: command.name,
        run: command.run,
        ...(folder === '' ? {} : { cwd: folder }),
        ...(command.depends_on.length === 0 ? {} : { depends_on: command.depends_on }),
        ...(command.default === undefined ? {} : { default: command.default })
    };
}

/** The path, under the repository, of the file a file or found command is written at, or null. */
export function entryPath(repo: string, command: ProjectCommand): string | null {
    const path = command.entry === undefined ? null : pathUnder(repo, command.entry.file);
    return path === null || path === '' ? null : path;
}

/** What a write of the commands answered: whether it landed, and the server's words if not. */
export type CommandWrite = { ok: boolean; error: string };

/** What a run, a Rerun or a Restart answered. */
export type RunAnswer =
    | { approve: ChainLine[] }
    | { confirm: string }
    | { ok: false; error: string }
    | { ok: true; id: string; terminal?: Terminal };

/** The question a press is waiting on. */
export type CommandAsking =
    | { kind: 'approve'; repo: string; name: string; source: CommandSource; lines: ChainLine[] }
    | { kind: 'restart'; id: string; process: string };

/** The form that saves a command: the repository, and the command edited or null for a new one. */
export type CommandForming = { repo: string; edit: CommandDraft | null };

/** The commands of the repositories, and what is done with them. */
export type CommandsStore = {
    /** Hold a repository's list for a view; the call returned lets it go. */
    watch: (repo: string) => () => void;
    /** The list of a repository while a view watches it, null before the first answer. */
    commands: (repo: string) => CommandsAnswer | null;
    /** Read a repository's list now, for a caller that holds it only as long as it needs it. */
    load: (repo: string) => Promise<CommandsAnswer>;
    /** Put an answer in as though it had been read. */
    seed: (repo: string, answer: CommandsAnswer) => void;
    save: (repo: string, command: CommandDraft) => Promise<CommandWrite>;
    remove: (repo: string, name: string) => Promise<CommandWrite>;
    approve: (repo: string, lines: ChainLine[]) => Promise<CommandWrite>;
    /**
     * Ask the server to run a command, with the source tab on screen, or else the one focused last,
     * as its context.
     */
    run: (repo: string, name: string, source: CommandSource) => Promise<RunAnswer>;
    rerun: (id: string) => Promise<RunAnswer>;
    restart: (id: string, confirmed: boolean) => Promise<RunAnswer>;
    /** Run a command as a press does: ask what it needs, say a refusal, show the terminal. */
    press: (repo: string, name: string, source: CommandSource) => Promise<boolean>;
    /** Restart as a press does: ask for a running line, then restart it. */
    pressRestart: (id: string) => Promise<boolean>;
    /** Rerun as a press does: a refusal is said and the terminal's output starts again. */
    pressRerun: (id: string) => Promise<boolean>;
    /** The question waiting on the reader, or null. */
    asking: () => CommandAsking | null;
    /** The reader's answer to the question: yes runs what it was about, no drops it. */
    answer: (yes: boolean) => Promise<void>;
    /** The form that saves a command while it is open, or null. */
    forming: () => CommandForming | null;
    /** Open the form for a repository, to edit a command or, with null, to add one. */
    openForm: (repo: string, edit: CommandDraft | null) => void;
    closeForm: () => void;
    /** Read a chunk of a task terminal's output; `scrollback` replaces what was read before. */
    note: (id: string, text: string, scrollback: boolean) => void;
    /** The errors and warnings of the listed task terminals' output. */
    commandDiagnostics: () => CommandDiagnostic[];
    /** The folder a task terminal's output is read from: its command's, else its repository's. */
    folderOf: (id: string) => string;
    /**
     * The file of the repository an error line of a task terminal names, resolved from the folder
     * the output is read from, when the file is there; null for a file outside the repository or
     * one the file routes do not find.
     */
    errorFile: (id: string, file: string) => Promise<{ repo: string; path: string } | null>;
    /** Open a file of a repository in a source tab, at a line. */
    openAt: (repo: string, path: string, line: number) => void;
    /** Run the default build or test of the repository holding the file on screen. */
    runDefault: (which: CommandDefault) => Promise<boolean>;
};

const commandShape = z.object({
    name: z.string(),
    run: z.string(),
    cwd: z.string(),
    depends_on: z.array(z.string()).catch([]),
    default: z.enum(['build', 'test']).optional().catch(undefined),
    source: z.enum(['file', 'saved', 'found']),
    entry: z.object({ file: z.string(), line: z.number() }).optional().catch(undefined)
}) satisfies z.ZodType<ProjectCommand>;

const findingShape = z.object({ file: z.string(), field: z.string(), message: z.string() });

const answerShape = z.object({
    commands: rowsShape(commandShape).catch([]),
    findings: rowsShape(findingShape).catch([])
}) satisfies z.ZodType<CommandsAnswer>;

const errorShape = z.object({ error: z.string().optional().catch(undefined) });

/** A source tab, as far as a run's placeholders read it. */
type SourceOnScreen = {
    status: { file: string; selection: string; caret: { line: number } | null };
};

/** What the page needs of the other stores. */
export type CommandsDeps = {
    entities: EntitiesStore;
    writes: WritesStore;
    queries: Queries;
    /** Where a refusal and a missing default are said: the words and their tone. */
    notices: { post: (message: string, options: { tone: 'warning' | 'error' }) => unknown };
    terminals: {
        terminals: () => Terminal[];
        adopt: (made: Terminal) => void;
        /** Whether a pane is reading a terminal's output right now. */
        subscribed: (id: string) => boolean;
    };
    /** The source tab on screen and what it says of its file, or null. */
    onScreen: () => SourceOnScreen | null;
    /**
     * The source tab whose editor the reader focused last, or null: what a run started from a
     * button in another view reads, since pressing the button puts that view on screen.
     */
    focusedSource: () => SourceOnScreen | null;
    /** The repositories the `git` channel carries. */
    gitRoots: () => string[];
    /** The roots the file routes serve. */
    served: () => ServedRoot[];
    /** Open a repository's file in a source tab, at a line. */
    openFile: (repo: string, path: string, line: number) => boolean;
};

/**
 * What one task terminal's output gave so far: the diagnostics, the unfinished last line, and how
 * many of the chain's commands have printed their name.
 */
type Output = { found: CommandDiagnostic[]; tail: string; started: number };

/** The output of a terminal nothing was read from. */
const NOTHING: Output = { found: [], tail: '', started: 0 };

export function createCommands(deps: CommandsDeps): CommandsStore {
    const { entities, writes, queries, notices, terminals } = deps;

    /** How many views watch each repository's list. */
    const watching: Record<string, number> = $state({});
    /** The output read of each task terminal, by terminal id. */
    const outputs: { byId: Record<string, Output> } = $state({ byId: {} });
    let question: CommandAsking | null = $state(null);
    let form: CommandForming | null = $state(null);
    /** The count of presses begun, so an answer of an earlier press raises no question. */
    let pressed = 0;
    /** The version of the last `files` message heard, or null before the first. */
    let heard: number | null = null;
    /** The process of each task terminal's run that was looked at once it ended, by terminal id. */
    const looked = new Map<string, number>();
    /** How many times each task terminal's line was started again from this page. */
    const restarted = new Map<string, number>();

    const keyOf = (repo: string): [string, string] => [KIND, repo];

    function fetcherOf(repo: string): Fetcher<CommandsAnswer> {
        return async () => {
            const words = (message: string): CommandsAnswer => ({
                commands: [],
                findings: [{ file: repo, field: '', message }]
            });
            try {
                const response = await fetch(`/api/commands?repo=${encodeURIComponent(repo)}`);
                const raw = await readJson(response);
                if (!response.ok) {
                    return words(readAs(errorShape, raw)?.error ?? String(response.status));
                }
                return readAs(answerShape, raw) ?? words(t('commands.unreadable'));
            } catch {
                return words(unreachableAnswer());
            }
        };
    }

    entities.afterReceive((message) => {
        if (message.channel === 'files') {
            if (heard === message.version) return;
            const gap = heard === null || message.version !== heard + 1;
            heard = message.version;
            const root = entities.payloadOf(message, 'files')?.root ?? '';
            for (const one of queries.entries<CommandsAnswer>([KIND])) {
                const repo = String(one.key[1]);
                if (gap || holds(root, repo)) queries.mark(keyOf(repo), 'replace');
            }
            return;
        }
        if (message.channel !== 'sessions') return;
        const listed = new Set(terminals.terminals().map((one) => one.id));
        const kept = Object.entries(outputs.byId).filter(([id]) => listed.has(id));
        if (kept.length !== Object.keys(outputs.byId).length)
            outputs.byId = Object.fromEntries(kept);
        for (const id of [...looked.keys()]) if (!listed.has(id)) looked.delete(id);
        readEnded();
    });

    function watch(repo: string): () => void {
        // Called from an effect, so the count is read untracked: an effect that read the count it
        // writes would run again on its own write.
        untrack(() => {
            watching[repo] = (watching[repo] ?? 0) + 1;
        });
        let released = false;
        return () => {
            if (released) return;
            released = true;
            untrack(() => {
                watching[repo] = (watching[repo] ?? 1) - 1;
            });
            // A view that watches again in the same turn (a list redrawn) keeps the list; one
            // that does not lets it go, so an answer still out for it is never held.
            queueMicrotask(() => {
                if ((watching[repo] ?? 0) > 0) return;
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- keyed by path
                delete watching[repo];
                queries.forget(keyOf(repo));
            });
        };
    }

    function commands(repo: string): CommandsAnswer | null {
        const { data } = queries.read(keyOf(repo), fetcherOf(repo), {
            enabled: (watching[repo] ?? 0) > 0 && typeof fetch === 'function'
        });
        return data ?? null;
    }

    const load = (repo: string): Promise<CommandsAnswer> =>
        queries.fetch(keyOf(repo), fetcherOf(repo));

    function seed(repo: string, answer: CommandsAnswer): void {
        queries.hold(keyOf(repo), answer);
    }

    /** Read a repository's list again after a write, or let it go when no view holds it. */
    function changed(repo: string): void {
        if ((watching[repo] ?? 0) > 0) queries.refetch(keyOf(repo), fetcherOf(repo), 'again');
        else queries.forget(keyOf(repo));
    }

    async function write(repo: string, body: Record<string, unknown>): Promise<CommandWrite> {
        const posted = await writes.postCommand('/api/commands', { ...body, repo });
        if (posted.failed === 'unreachable') return { ok: false, error: unreachableAnswer() };
        if (posted.failed === 'unreadable') return { ok: false, error: t('commands.unreadable') };
        const error = readAs(errorShape, posted.body)?.error;
        if (!posted.ok) return { ok: false, error: error ?? t('commands.refused') };
        changed(repo);
        return { ok: true, error: '' };
    }

    const save = (repo: string, command: CommandDraft) => write(repo, { action: 'save', command });
    const remove = (repo: string, name: string) => write(repo, { action: 'remove', name });
    const approve = (repo: string, chain: ChainLine[]) => write(repo, { action: 'approve', chain });

    /** What a source tab says, as the placeholders of a run read it. */
    function contextOf(screen: SourceOnScreen | null): CommandContext | undefined {
        if (screen === null) return undefined;
        const { file, selection, caret } = screen.status;
        const context: CommandContext = {
            ...(file === '' ? {} : { file }),
            ...(caret === null ? {} : { line: caret.line }),
            ...(selection === '' ? {} : { selectedText: selection })
        };
        return Object.keys(context).length === 0 ? undefined : context;
    }

    /** Post one action of the terminal route and read it as a run's answer. */
    async function post(body: Record<string, unknown>): Promise<RunAnswer> {
        const answer = await postTerminal(body, writes);
        if (answer.approve !== undefined) return { approve: answer.approve };
        if (answer.confirm !== undefined) return { confirm: answer.confirm };
        if (!answer.ok) return { ok: false, error: answer.error };
        return {
            ok: true,
            id: answer.id,
            ...(answer.terminal === undefined ? {} : { terminal: answer.terminal })
        };
    }

    function run(repo: string, name: string, source: CommandSource): Promise<RunAnswer> {
        const context = contextOf(deps.onScreen() ?? deps.focusedSource());
        return post({
            action: 'command',
            repo,
            name,
            source,
            ...(context === undefined ? {} : { context }),
            cols: COLS,
            rows: ROWS
        });
    }

    /**
     * The output kept for a terminal is dropped when its line starts again, and a capture still
     * out for the line that ended is never held.
     */
    function clear(id: string): void {
        restarted.set(id, (restarted.get(id) ?? 0) + 1);
        if (!(id in outputs.byId)) return;
        outputs.byId = Object.fromEntries(
            Object.entries(outputs.byId).filter(([one]) => one !== id)
        );
    }

    async function rerun(id: string): Promise<RunAnswer> {
        const answer = await post({ action: 'rerun', id });
        if ('ok' in answer && answer.ok) clear(id);
        return answer;
    }

    async function restart(id: string, confirmed: boolean): Promise<RunAnswer> {
        const answer = await post({
            action: 'restart',
            id,
            ...(confirmed ? { confirmed: true } : {})
        });
        if ('ok' in answer && answer.ok) clear(id);
        return answer;
    }

    /**
     * Say what a run, a Rerun or a Restart did not do, or show the terminal it started. A question
     * the server asked is held as `again`; null holds none, which is how the answer of a press that
     * a later press superseded leaves the question of the later one.
     */
    function settle(answer: RunAnswer, again: CommandAsking | null): boolean {
        if ('approve' in answer || 'confirm' in answer) {
            if (again !== null) question = again;
            return false;
        }
        if (!answer.ok) {
            notices.post(answer.error === '' ? t('commands.refused') : answer.error, {
                tone: 'error'
            });
            return false;
        }
        if (answer.terminal !== undefined) terminals.adopt(answer.terminal);
        return true;
    }

    async function press(repo: string, name: string, source: CommandSource): Promise<boolean> {
        pressed += 1;
        const turn = pressed;
        const answer = await run(repo, name, source);
        const lines = 'approve' in answer ? answer.approve : [];
        const ask: CommandAsking = { kind: 'approve', repo, name, source, lines };
        return settle(answer, turn === pressed ? ask : null);
    }

    async function pressRestart(id: string): Promise<boolean> {
        pressed += 1;
        const turn = pressed;
        const answer = await restart(id, false);
        const process = 'confirm' in answer ? answer.confirm : '';
        return settle(answer, turn === pressed ? { kind: 'restart', id, process } : null);
    }

    async function pressRerun(id: string): Promise<boolean> {
        return settle(await rerun(id), null);
    }

    async function answer(yes: boolean): Promise<void> {
        const asked = question;
        question = null;
        if (!yes || asked === null) return;
        if (asked.kind === 'restart') {
            settle(await restart(asked.id, true), null);
            return;
        }
        const approved = await approve(asked.repo, asked.lines);
        if (!approved.ok) {
            notices.post(approved.error, { tone: 'error' });
            return;
        }
        await press(asked.repo, asked.name, asked.source);
    }

    function record(id: string): Terminal | null {
        return terminals.terminals().find((one) => one.id === id) ?? null;
    }

    /** Whether a terminal is a project command's run; a LaTeX build's diagnostics are LaTeX's. */
    function ranCommand(one: Terminal | null): boolean {
        return one?.task === true && one.job?.source !== 'latex';
    }

    /**
     * The commands a task terminal's line runs, in order, with their folders: the chain its mark
     * carries, which is the line it was made of whatever the repository's list says now. Null for
     * a terminal whose mark names no chain.
     */
    function chainOf(id: string): { name: string; cwd: string }[] | null {
        return record(id)?.job?.chain ?? null;
    }

    function folderOf(id: string): string {
        const job = record(id)?.job;
        if (job === null || job === undefined) return record(id)?.cwd ?? '';
        return chainOf(id)?.at(-1)?.cwd ?? job.repo;
    }

    /** The whole path of a file an error line names: as written if absolute, else in `folder`. */
    function wholeOf(folder: string, file: string): string {
        return folded(file.startsWith('/') ? file : joinPath(folder, file));
    }

    /** The file of the repository a path names, when the file routes serve it; else null. */
    async function sourceUnder(
        repo: string,
        whole: string
    ): Promise<{ repo: string; path: string } | null> {
        const path = pathUnder(repo, whole);
        if (path === null || path === '') return null;
        const tab = tabOfFile(deps.served(), { root: repo, path });
        if (tab === null || typeof fetch !== 'function') return null;
        try {
            const query = `root=${encodeURIComponent(tab.root)}&path=${encodeURIComponent(tab.path)}`;
            const response = await fetch(`/api/source?${query}`);
            return response.ok ? { repo, path } : null;
        } catch {
            return null;
        }
    }

    async function errorFile(
        id: string,
        file: string
    ): Promise<{ repo: string; path: string } | null> {
        const repo = record(id)?.job?.repo;
        if (repo === undefined) return null;
        // The line is not known to belong to one command, so a relative path is tried from the
        // folder of the command the press named and then from those of the commands it ran first.
        const folders = [folderOf(id), ...(chainOf(id) ?? []).map((one) => one.cwd)];
        for (const folder of file.startsWith('/') ? [folders[0]] : new Set(folders)) {
            const found = await sourceUnder(repo, wholeOf(folder, file));
            if (found !== null) return found;
        }
        return null;
    }

    function openAt(repo: string, path: string, line: number): void {
        deps.openFile(repo, path, line);
    }

    function note(id: string, text: string, scrollback: boolean): void {
        if (!ranCommand(record(id))) return;
        const before = scrollback ? NOTHING : (outputs.byId[id] ?? NOTHING);
        const lines = `${before.tail}${text.replace(ESCAPES, '')}`.split(/\r\n|\r|\n/);
        const tail = (lines.pop() ?? '').slice(-TAIL_MAX);
        const job = record(id)?.job;
        const chain = chainOf(id);
        const token = job?.token;
        const marks = (line: string, name: string): boolean =>
            token === undefined ? line === name : line.endsWith(chainMarker(token, name));
        let started = before.started;
        const found = [...before.found];
        for (const line of lines) {
            // The line a chain prints before each command is its marker, in the chain's order.
            if (chain !== null && started < chain.length && marks(line, chain[started].name)) {
                started += 1;
                continue;
            }
            const match = errorMatch(line);
            if (match === null || job === null || job === undefined || found.length >= FOUND_MAX)
                continue;
            const folder = chain?.[started - 1]?.cwd ?? folderOf(id);
            const whole = wholeOf(folder, match.file);
            const inside = pathUnder(job.repo, whole);
            found.push({
                root: job.repo,
                file: inside === null || inside === '' ? whole : inside,
                line: match.line,
                ...(match.column === undefined ? {} : { column: match.column }),
                severity: match.severity,
                message: match.message,
                source: `command:${job.name}`
            });
        }
        outputs.byId = { ...outputs.byId, [id]: { found, tail, started } };
    }

    /**
     * Read the output of the task terminals that ended while no pane was reading them, once for
     * each run: the run is the process the pane held, which a Rerun or a Restart changes. A pane
     * that reads a terminal when it ends has seen all of its output, and one that stopped reading
     * earlier has not seen what was printed after.
     */
    function readEnded(): void {
        for (const one of terminals.terminals()) {
            if (!ranCommand(one) || one.exit === null || looked.get(one.id) === one.pid) continue;
            looked.set(one.id, one.pid);
            if (!terminals.subscribed(one.id)) void capture(one.id, one.pid);
        }
    }

    /**
     * Ask the server for all the text of an ended task terminal's pane and read it as a pane's
     * scrollback, which replaces what was held. An answer is dropped when the line started again, a
     * pane began reading the terminal (its scrollback replaces the output too), or the terminal
     * went, while it was out. A refusal or an unreachable server leaves no diagnostics.
     */
    async function capture(id: string, pid: number): Promise<void> {
        const turn = restarted.get(id) ?? 0;
        const answer = await postTerminal({ action: 'capture', id }, writes);
        if (!answer.ok || answer.output === undefined) return;
        if (
            (restarted.get(id) ?? 0) !== turn ||
            record(id)?.pid !== pid ||
            terminals.subscribed(id)
        ) {
            return;
        }
        note(id, answer.output.endsWith('\n') ? answer.output : `${answer.output}\n`, true);
    }

    function commandDiagnostics(): CommandDiagnostic[] {
        const listed = new Set(
            terminals
                .terminals()
                .filter((one) => ranCommand(one))
                .map((one) => one.id)
        );
        return Object.entries(outputs.byId).flatMap(([id, one]) =>
            listed.has(id) ? one.found : []
        );
    }

    async function runDefault(which: CommandDefault): Promise<boolean> {
        const screen = deps.onScreen();
        const file = screen?.status.file ?? '';
        if (file === '') {
            notices.post(t('commands.no_file'), { tone: 'warning' });
            return false;
        }
        const repo = deepestHolding(deps.gitRoots(), (root) => root, file)?.item;
        if (repo === undefined) {
            notices.post(t('commands.no_repo'), { tone: 'warning' });
            return false;
        }
        const listed = await load(repo);
        const chosen = listed.commands.find((one) => one.default === which);
        if (chosen === undefined) {
            const words =
                which === 'build' ? t('commands.no_default_build') : t('commands.no_default_test');
            notices.post(words, { tone: 'warning' });
            return false;
        }
        return press(repo, chosen.name, chosen.source);
    }

    return {
        watch,
        commands,
        load,
        seed,
        save,
        remove,
        approve,
        run,
        rerun,
        restart,
        press,
        pressRestart,
        pressRerun,
        asking: () => question,
        answer,
        forming: () => form,
        openForm: (repo, edit) => {
            form = { repo, edit };
        },
        closeForm: () => {
            form = null;
        },
        note,
        commandDiagnostics,
        folderOf,
        errorFile,
        openAt,
        runDefault
    };
}
