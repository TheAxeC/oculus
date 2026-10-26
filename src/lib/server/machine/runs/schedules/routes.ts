// Layer 2, server. POST /api/schedules. A route module may export only its verbs, so everything the
// request does is here and src/routes/api/(machine)/schedules/+server.ts is the lines that join
// them.
//
// A POST carries the write token and one `action`: `save` an entry (a new one when `at` is null),
// `delete`, `pause` or `resume` the entry at a position, or `run` one by its name. A write names
// its entry by its position and the name the page read there, and is refused when the entry at
// that position has another name. A save is checked by the rule the page checks by
// (data/helpers/run/schedules.ts) and by the disk (schedules/file.ts), and the chain of a command
// of the repository's `.oculus/commands.yml` must be one that can run with no context. A save of a
// command entry carries the chain the dialog listed, and is refused `chain-changed` unless that is
// the chain the commands file resolves to at the save. Once the schedules file is written, the save
// approves that chain in the approvals file, by the write the command form's Save approves by
// (commands/routes.ts `writeChange`), so the entry's due run starts until the chain's text changes,
// and a save refused on the way approves nothing. The writes run behind the process's write
// chain, a write while the run record does not read is refused before the schedules file is
// touched, and a write that changed something is one line of the change log, kind `schedules`.
//
// A save that renames an entry or adds one, and a delete, change the record's entry for the name (a
// rename moves it with the entry, a new entry drops any entry the record holds under its name, so a
// name reused for a new schedule never inherits a handled time). They take the record's lock first,
// check that the record reads, commit the schedules file, change the record and release the lock: a
// lock that stays taken or a record that does not read refuses before anything is written, and a
// commit that failed leaves the record as it was. The answer is `{ ok: true }`, `{ ok: true,
// terminal }` or `{ ok: true, skipped }`, or `{ error: <word>, names }` with 400 for a rule, 409
// for a file or a record that does not read, a record whose lock is taken, an entry or a chain that
// changed or an entry that cannot be edited in place, 500 for a file, a record or an approvals file
// that could not be written, and 403 without the token. The word is a SCHEDULE_WORDS word or a
// TERMINAL_REFUSALS word; the system's own reason for a failed write goes to the server log.

import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { nameKey, readEntry } from '../../../../data/helpers/run/schedules.ts';
import type { ScheduleEntry } from '../../../../data/model/index.ts';
import { tokenedBody } from '../../../core/auth.ts';
import { logChanges, type ChangeLog } from '../../../core/changes.ts';
import { chained, type FsWrites } from '../../../core/json.ts';
import { resolveChain } from '../../../../data/helpers/run/chain.ts';
import { approveTexts, chainLines, chainText } from '../../approvals/approvals.ts';
import { listCommands } from '../commands/list.ts';
import { fillPlaceholders } from '../commands/placeholders.ts';
import { repositoryOf } from '../commands/repo.ts';
import {
    commitText,
    diskChecker,
    holdsText,
    planEdit,
    readSchedules,
    resolveFolder,
    type Disk,
    type Edit
} from './file.ts';
import { loadRecord, moveRecord, type RecordMove } from './record.ts';
import type { TaskHubs } from './task.ts';
import type { SchedulesWatcher } from './watch.ts';

/** What the route needs of the process. */
export type SchedulesRouteOptions = {
    /** The schedules file and the run record, read at the request. */
    files: () => { schedules: string | null; record: string };
    /** The directories the file browser serves, read at the request. */
    rootsFor: () => string[];
    /**
     * The open workspace's hubs, read at the request: the primary's folder, null with no primary,
     * and the hubs' names, which a task entry's `hub` must be one of.
     */
    hubsFor: () => TaskHubs;
    /** The text catalog the token refusal is worded from, read when a refusal is made. */
    text: () => Record<string, string>;
    /** The approvals file a saved command entry's chain is approved in, read at the request. */
    approvalsFor: () => string;
    /** The write chain the schedules file and the record are written behind. */
    writes: FsWrites;
    /** The change log a write is recorded in. */
    changes?: ChangeLog;
    /** The watcher in force, which reads the files again after a write and runs an entry now. */
    schedules: SchedulesWatcher;
};

const NO_STORE = { 'cache-control': 'no-store' };

/** The change log's kind for a write of the schedules file. */
const KIND = 'schedules';

/**
 * The words that answer 409: a file or a record that does not read, an entry or a chain that
 * changed.
 */
const CONFLICTS = [
    'schedules-unread',
    'entry-changed',
    'chain-changed',
    'entry-unwritable',
    'record-unread',
    'record-locked'
];

const position = z.number().int().min(0);

/** The lines of a chain as the dialog listed them, in run order. */
const listedShape = z.array(z.object({ folder: z.string(), run: z.string() }));

/** The body of a POST: one of the five actions. */
const bodyShape = z.discriminatedUnion('action', [
    z.object({
        action: z.literal('save'),
        at: position.nullable(),
        was: z.string().nullable(),
        entry: z.unknown(),
        chain: listedShape.nullable().optional()
    }),
    z.object({ action: z.literal('delete'), at: position, name: z.string() }),
    z.object({ action: z.literal('pause'), at: position, name: z.string() }),
    z.object({ action: z.literal('resume'), at: position, name: z.string() }),
    z.object({ action: z.literal('run'), name: z.string() })
]);

function refuse(error: string, names: string[] = [], status?: number): Response {
    const code = status ?? (CONFLICTS.includes(error) ? 409 : 400);
    return json({ error, names }, { status: code, headers: NO_STORE });
}

const OK = (): Response => json({ ok: true }, { headers: NO_STORE });

/** What a write did that the change log and the watcher need. */
type Wrote = {
    /** The schedules file the write changed. */
    file: string;
    before: unknown;
    after: unknown;
    name: string;
    /**
     * The refusal of a record that could not be written after the file was committed, when the
     * file could not be written back either.
     */
    late: Response | null;
} | null;

/**
 * Check an entry the page sent against everything its write needs: the shared rule, the disk, a
 * name no other entry holds and, for a command, a chain that can run with no context and is the
 * chain the page listed (`listed`, compared line by line with its folders). The refusal
 * as its word and names, or the entry with the text its command's chain is approved by (null for
 * an entry that runs no command).
 */
function checkSave(
    options: SchedulesRouteOptions,
    files: { schedules: string; record: string },
    at: number | null,
    was: string | null,
    raw: unknown,
    listed: z.infer<typeof listedShape> | null
): { word: string; names: string[] } | { entry: ScheduleEntry; chain: string | null } {
    const read = readEntry(raw);
    if (read.problem !== null) return read.problem;
    if (read.entry === null) return { word: 'entry-wrong', names: [] };
    const entry = read.entry;
    const open = options.hubsFor();
    const hubs = open.hubs.map((one) => one.name);
    const disk: Disk = { hub: open.primaryDir, roots: options.rootsFor(), hubs };
    const rows = readSchedules(files.schedules, disk);
    if (!rows.ok) return { word: 'schedules-unread', names: [] };
    if (at !== null && rows.rows[at]?.name !== (was ?? '')) {
        return { word: 'entry-changed', names: [] };
    }
    const found = diskChecker(disk).problem(entry);
    if (found !== null) return found;
    const clash = rows.rows.some(
        (row) => row.at !== at && row.entry !== null && nameKey(row.name) === nameKey(entry.name)
    );
    if (clash) return { word: 'name-twice', names: [entry.name] };
    if ('command' in entry.runs) {
        const repo = repositoryOf(resolveFolder(entry.runs.folder, disk.hub), disk.roots);
        if ('error' in repo) return { word: 'bad-repo', names: [] };
        const commands = listCommands(repo.repo).commands;
        const chain = resolveChain(commands, entry.runs.command, 'file');
        if ('error' in chain) return { word: chain.error, names: chain.names };
        const filled = fillPlaceholders(
            chain.chain.map((one) => one.run),
            {},
            repo.repo
        );
        if ('error' in filled) return { word: filled.error, names: filled.names };
        const lines = chainLines(repo.repo, chain.chain);
        const same =
            listed !== null &&
            listed.length === lines.length &&
            listed.every((one, at) => one.folder === lines[at].folder && one.run === lines[at].run);
        if (!same) return { word: 'chain-changed', names: [entry.runs.command] };
        return { entry, chain: chainText(repo.repo, lines) };
    }
    return { entry, chain: null };
}

/** The word a record that could not be changed is refused with, by why it could not. */
const RECORD_WORDS = {
    unread: 'record-unread',
    locked: 'record-locked',
    unwritable: 'record-unwritten'
} as const;

/**
 * What a save or a delete does to the record: a new entry drops the record's entry under its name,
 * a renamed one moves it, a delete drops it; null when the record is not touched.
 */
function recordMove(edit: Edit, was: string | null): RecordMove | null {
    if (edit.action === 'delete') return edit.name === '' ? null : { drop: edit.name };
    if (edit.action !== 'save') return null;
    if (edit.at === null) return { drop: edit.entry.name };
    if (was === null || was === '' || was === edit.entry.name) return null;
    return { rename: { from: was, to: edit.entry.name } };
}

/**
 * One write of the schedules file with the record change it needs; the log's facts or a refusal.
 * The file is committed only when it still holds the text the change was planned from, and a
 * record change that fails after the commit writes that text back, so a refusal saved nothing.
 */
async function write(
    options: SchedulesRouteOptions,
    action: Exclude<z.infer<typeof bodyShape>, { action: 'run' }>
): Promise<Response | Wrote> {
    const listed = options.files();
    if (listed.schedules === null) return refuse('no-primary');
    const files = { ...listed, schedules: listed.schedules };
    let edit: Edit;
    let chain: string | null = null;
    if (action.action === 'save') {
        const checked = checkSave(
            options,
            files,
            action.at,
            action.was,
            action.entry,
            action.chain ?? null
        );
        if (!('entry' in checked)) return refuse(checked.word, checked.names);
        edit = { action: 'save', at: action.at, was: action.was, entry: checked.entry };
        chain = checked.chain;
    } else {
        edit = { action: action.action, at: action.at, name: action.name };
    }
    const touchesRecord = action.action === 'save' || action.action === 'delete';
    if (touchesRecord && !loadRecord(files.record).ok) return refuse('record-unread');
    const planned = planEdit(files.schedules, edit);
    if (!planned.ok) return refuse(planned.error, planned.names, planned.status);
    // The chain is approved once nothing is left that could refuse the save. A save that leaves the
    // file as it is approves too: it is how an entry whose command was changed by hand is approved
    // again.
    const approve = (): Response | null => {
        if (chain === null) return null;
        const approved = approveTexts(options.approvalsFor(), [chain]);
        if (approved.ok) return null;
        console.error(`schedules: the approvals file was not written: ${approved.error}`);
        return refuse('approval-unwritten', [], 500);
    };
    if (planned.text === null) return approve();
    const text = planned.text;
    const move = recordMove(edit, planned.was);
    const result: { commit: ReturnType<typeof commitText> | null; changed: boolean } = {
        commit: null,
        changed: false
    };
    const commit = (): boolean => {
        if (!holdsText(files.schedules, planned.from)) {
            result.changed = true;
            return false;
        }
        result.commit = commitText(files.schedules, text);
        return result.commit.ok;
    };
    let late: Response | null = null;
    if (move === null) commit();
    else {
        const moved = await moveRecord(files.record, move, commit);
        if (!moved.ok) {
            console.error(`schedule record: ${files.record}: ${moved.reason}`);
            const word = RECORD_WORDS[moved.why];
            const answer = refuse(word, [], moved.why === 'unwritable' ? 500 : undefined);
            if (!result.commit?.ok) return answer;
            const back = commitText(files.schedules, planned.from);
            if (back.ok) return answer;
            console.error(`schedules: ${files.schedules} was not written back: ${back.reason}`);
            late = answer;
        }
    }
    if (result.changed) return refuse('entry-changed');
    if (result.commit !== null && !result.commit.ok) {
        console.error(`schedules: ${files.schedules} was not written: ${result.commit.reason}`);
        return refuse('schedules-unwritten', [], 500);
    }
    late ??= approve();
    const name = edit.action === 'save' ? edit.entry.name : edit.name;
    return { file: files.schedules, before: planned.before, after: planned.after, name, late };
}

/** POST /api/schedules: save, delete, pause, resume or run. */
export async function handleSchedules(
    request: Request,
    token: string,
    options: SchedulesRouteOptions
): Promise<Response> {
    const read = await tokenedBody(request, token, { headers: NO_STORE, text: options.text });
    if (read instanceof Response) return read;
    const body = bodyShape.safeParse(read.body);
    if (!body.success) {
        return json(
            {
                error: 'action must be save, delete, pause, resume or run, with the fields that action takes'
            },
            { status: 400, headers: NO_STORE }
        );
    }
    const action = body.data;
    if (action.action === 'run') {
        const answer = await options.schedules.runNow(action.name);
        if ('refused' in answer) return refuse(answer.refused, answer.names);
        if ('terminal' in answer) {
            return json({ ok: true, terminal: answer.terminal }, { headers: NO_STORE });
        }
        return json({ ok: true, skipped: answer.skipped }, { headers: NO_STORE });
    }
    const wrote = await chained(options.writes, () => write(options, action));
    if (wrote instanceof Response) return wrote;
    if (wrote === null) return OK();
    options.schedules.reload();
    await logChanges(options.changes, KIND, [
        {
            file: wrote.file,
            key: wrote.name,
            field: 'entries',
            before: wrote.before,
            after: wrote.after,
            undo: 'none'
        }
    ]);
    return wrote.late ?? OK();
}
