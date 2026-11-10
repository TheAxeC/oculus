// Layer 2, client state. The events the reader is told of in a notification that come from the
// channels and the writes: a session that starts waiting for the reader, on a permission prompt or
// idle after its turn, a Live HPC job that ends, an update task whose results land, and a write the
// server refuses or that fails, each with the action that opens what it is about.
//
// A channel's event is read as a state no earlier message of that channel held since the page
// loaded, so it is posted once per event and never again for the same state on a later push, a
// reconnect's repeat of the current message and a state that goes and comes back included. The
// first message of a channel is where the reading starts and posts nothing: a state that was there
// when the page opened did not happen while the reader was looking.
//
// The rules are pure functions over one payload, so each is held by a test with no socket; the
// store keeps what each channel has shown and hears every message the entities store keeps, wired
// in state/client/context.ts, as it hears every write that did not land from the writes store.
//
// Seven sources post: a refused rail write, a session that starts waiting on a permission prompt or
// goes idle after its turn (`permission_prompt`, `idle_prompt`), each worded as what it waits for,
// an update task whose run date moved, a Live HPC job newly in `recent`, any write refused or
// unanswered (`writes.onUnwritten`, a refused fetch, push, pull, sync or publish in words of its
// own), a save of the page state the server refused (`pageState.onRefused`), and an option a
// control set while no workspace file is open, which offers Save Workspace As (`noWorkspace`,
// called by the ui store).
//
// An update task's run date is read where its row of `update_tasks` says (`last_run`): its hub's
// row of the portfolio's feed summary (`byHub`), for the radar, the scout and LinkedIn, or the
// inbox triage's one date of the machine. The dates are remembered by place and hub: the dates a
// place of a hub carries when the channel first shows it are where its reading starts and post
// nothing, as the first message of a channel does, so a hub added or renamed while the page is open
// posts nothing until one of its dates moves. A notice is posted only for a task the tray offers
// (the schedule store's `offered`), named as the tray names that row and opening the view its row
// names, so a hub with no file of the task posts no notice for it; the inbox's notice, whose date
// is no hub's, is posted once, for the first offered task that reads it.

import { z } from 'zod';
import type { HookEvent, HubTask, LastRun, Message } from '../../../data/model/index.ts';
import { readAs, rowsShape } from '../../../data/shapes/shapes.ts';
import { pairLabel } from '../../system/machine/schedules/schedule-words.ts';
import type { NoticeAction, NoticesStore } from './notices.svelte.ts';
import { t } from '../../shared/words/text.ts';

/** The line of a refused git action that names it, by the action; any other has the general one. */
const GIT_REFUSED: ReadonlyMap<string, (reason: string) => string> = new Map([
    ['fetch', (reason: string) => t('statusbar.notice_fetch_refused', reason)],
    ['push', (reason: string) => t('statusbar.notice_push_refused', reason)],
    ['pull', (reason: string) => t('statusbar.notice_pull_refused', reason)],
    ['sync', (reason: string) => t('statusbar.notice_sync_refused', reason)],
    ['publish', (reason: string) => t('statusbar.notice_publish_refused', reason)]
]);

/** The words of a hook the notifications compare: what happened and what kind of notification. */
type HookWords = { event: string; kind?: string };

/** A session's last hook as far as the notifications read it. */
const hookShape = z.object({
    event: z.string(),
    kind: z.string().optional().catch(undefined),
    at: z.string()
});

/** A session record as far as the notifications read it. */
const waitingRecordShape = z.object({
    id: z.string(),
    title: z.string().catch(''),
    hook: hookShape.nullable().catch(null)
});

/** The records of a sessions payload that read as sessions; none where the payload has no list. */
const waitingShape = z.object({ records: rowsShape(waitingRecordShape).catch([]) });

/**
 * Whether a session's last hook leaves it waiting on a permission prompt, Claude Code's
 * `permission_prompt`, which is what the page's waiting count and the window title count.
 */
export function waitsOnReader(hook: HookEvent | HookWords | null | undefined): boolean {
    return hook?.event === 'notification' && hook.kind === 'permission_prompt';
}

/** What a waiting session waits for: an answer to a permission prompt, or input after its turn. */
export type WaitKind = 'permission' | 'idle';

/**
 * What a session's last hook leaves it waiting for: a permission prompt, or Claude Code's
 * `idle_prompt`, sent when it has finished its turn and waits for the reader's input; null for
 * any other hook and for none.
 */
export function waitOf(hook: HookEvent | HookWords | null | undefined): WaitKind | null {
    if (waitsOnReader(hook)) return 'permission';
    return hook?.event === 'notification' && hook.kind === 'idle_prompt' ? 'idle' : null;
}

/** A session waiting for the reader, by the event that says so and what it waits for. */
export type Waiting = { key: string; id: string; title: string; kind: WaitKind };

/**
 * The sessions waiting for the reader. The key names the session and the moment its hook came, so
 * a session answered that waits again later is a new event, and one still waiting on the next push
 * is not.
 */
export function waitingOf(payload: unknown): Waiting[] {
    return (readAs(waitingShape, payload)?.records ?? []).flatMap((record) => {
        const hook = record.hook;
        const kind = waitOf(hook);
        if (hook === null || kind === null) return [];
        return [
            {
                key: `${record.id}@${hook.at}`,
                id: record.id,
                title: record.title === '' ? record.id : record.title,
                kind
            }
        ];
    });
}

/** An ended job as far as the notifications read it. */
const endedJobShape = z.object({
    id: z.string(),
    name: z.string(),
    state: z.string(),
    exit: z.string()
});

/**
 * The poll's status and the jobs of it that read as ended jobs. Only a poll the cluster answered
 * lists ended jobs: a failed poll says nothing about which jobs ended.
 */
const pollShape = z.object({
    resource: z.string(),
    name: z.string(),
    status: z.string(),
    recent: rowsShape(endedJobShape).catch([])
});

/** The clusters of the `hpc` channel's message; a cluster that does not read is left out. */
const messageShape = z.object({ clusters: rowsShape(pollShape).catch([]) });

/**
 * Whether an ended job finished: Slurm's COMPLETED with a zero exit code, or no code given. Any
 * other state (FAILED, TIMEOUT, OUT_OF_MEMORY, CANCELLED and the rest) or a non-zero code is a
 * failure.
 */
export function jobFinished(job: { state: string; exit: string }): boolean {
    const exit = job.exit.trim();
    return job.state.trim() === 'COMPLETED' && (exit === '' || exit === '0:0');
}

/**
 * One run date: the place it is read from (one of LAST_RUNS, which a row of `update_tasks` names
 * as its `last_run`), the hub whose feed carries the date (null for the inbox, whose date is the
 * machine's), and the date as the text the portfolio or the inbox carries.
 */
type TaskRun = { source: LastRun; hub: string | null; at: string };

/** When a task last ran, as the text the portfolio or the inbox carries; empty otherwise. */
const stampShape = z.string().catch('');

/** A feed of a hub that carries a `lastRun`, or null where the hub has no such feed. */
const lastRunShape = z.object({ lastRun: stampShape }).nullable().catch(null);

/** One hub's run dates in the portfolio's feed summary, each null where the hub has no feed. */
const hubRunsShape = z.object({
    hub: z.string(),
    radar: lastRunShape,
    scout: lastRunShape,
    linkedin: z.object({ lastPost: stampShape }).nullable().catch(null)
});

/** Each hub's run dates of a portfolio; a snapshot still being built carries none. */
const feedRunsShape = z.object({
    entities: z
        .object({
            feeds: z.object({ byHub: rowsShape(hubRunsShape).catch([]) }).catch({ byHub: [] })
        })
        .optional()
});

/**
 * The run dates each hub's row of the feed summary carries, the empty text for a feed that never
 * ran, so a task of a hub is shown from the first message that carries its hub's row. A place
 * where the hub has no feed carries no run, so a feed a hub's settings add later is first seen
 * then and its date, there before the feed was read, posts nothing.
 */
function feedRuns(snapshot: unknown): TaskRun[] {
    const rows = readAs(feedRunsShape, snapshot)?.entities?.feeds.byHub ?? [];
    const run = (source: LastRun, hub: string, at: string | undefined): TaskRun[] =>
        at === undefined ? [] : [{ source, hub, at }];
    return rows.flatMap((row) => [
        ...run('radar', row.hub, row.radar?.lastRun),
        ...run('scout', row.hub, row.scout?.lastRun),
        ...run('linkedin', row.hub, row.linkedin?.lastPost)
    ]);
}

/** The date the inbox triage last ran, which its own channel carries. */
const notesShape = z.object({ notesRun: stampShape });

/**
 * The run date of the inbox triage, which its own channel carries, the empty text while it has
 * none, so the inbox task is shown from the channel's first message.
 */
function notesRuns(inbox: unknown): TaskRun[] {
    return [{ source: 'inbox', hub: null, at: readAs(notesShape, inbox)?.notesRun ?? '' }];
}

/** What the store opens for a notification's action, and the tasks the tray offers. */
export type NoticeOpeners = {
    openSession: (id: string, title: string) => void;
    openView: (view: string) => void;
    /** The update tasks the tray offers, each a row of its hub's `update_tasks`. */
    offered: () => HubTask[];
    /** Ask for the name of a workspace file to save the workspace to. */
    saveWorkspace: () => void;
};

export type NoticeSourcesStore = {
    /** Hear one message the entities store kept. */
    heard: (message: Message) => void;
    /**
     * Hear one write that did not land: `refused` when the server answered and refused it, and
     * otherwise a write that got no answer, in the words the writes store gave.
     */
    unwritten: (reason: string, refused: boolean) => void;
    /** Hear a save of the page state the server refused, with its sentence. */
    stateRefused: (error: string) => void;
    /** Say that an option has no workspace file to be written to, and offer to save one. */
    noWorkspace: () => void;
};

/**
 * The states one channel has shown since the page loaded. `seen` answers the keys never shown
 * before and remembers them; the first reading remembers and answers none.
 */
function memory(): (keys: readonly string[]) => string[] {
    let started = false;
    const known = new Set<string>();
    return (keys) => {
        const fresh = keys.filter((key) => !known.has(key));
        for (const key of fresh) known.add(key);
        const first = !started;
        started = true;
        return first ? [] : [...new Set(fresh)];
    };
}

/**
 * The run dates one channel has shown since the page loaded, by place and hub. Each message of the
 * channel carries every place and hub it holds, and the function answers the runs whose date that
 * place of that hub never showed before. A place and hub the channel did not carry in its last
 * message, every pair of the first message among them, is remembered with its date and answers
 * none, since that date was there before the reader looked at it; an empty date is no run. A pair
 * a message no longer carries is forgotten, so a hub that leaves and a hub that later takes its
 * name is seen for the first time.
 */
function runMemory(): (runs: readonly TaskRun[]) => TaskRun[] {
    const known = new Map<string, Set<string>>();
    return (runs) => {
        const fresh: TaskRun[] = [];
        const carried = new Set(runs.map((run) => JSON.stringify([run.source, run.hub])));
        for (const pair of known.keys()) if (!carried.has(pair)) known.delete(pair);
        for (const run of runs) {
            const pair = JSON.stringify([run.source, run.hub]);
            const dates = known.get(pair);
            if (dates === undefined) {
                known.set(pair, new Set([run.at]));
            } else if (run.at !== '' && !dates.has(run.at)) {
                dates.add(run.at);
                fresh.push(run);
            }
        }
        return fresh;
    };
}

export function createNoticeSources(
    notices: Pick<NoticesStore, 'post'>,
    open: NoticeOpeners
): NoticeSourcesStore {
    const sessions = memory();
    /** The jobs each cluster has shown, by the cluster's key. */
    const jobs = new Map<string, (keys: readonly string[]) => string[]>();
    const feeds = runMemory();
    const notes = runMemory();

    function action(run: () => void): NoticeAction[] {
        return [{ label: t('statusbar.notice_open'), run }];
    }

    function sessionsHeard(payload: unknown): void {
        const now = waitingOf(payload);
        for (const key of sessions(now.map((one) => one.key))) {
            const one = now.find((wait) => wait.key === key);
            if (one === undefined) continue;
            const words =
                one.kind === 'permission'
                    ? t('statusbar.notice_permission', one.title)
                    : t('statusbar.notice_idle', one.title);
            notices.post(words, {
                tone: 'warning',
                actions: action(() => open.openSession(one.id, one.title))
            });
        }
    }

    /**
     * Each cluster is read on its own, with the jobs it has shown kept apart from another
     * cluster's, since a job id names one job on one cluster. A poll the cluster did not answer is
     * not read at all, so it neither starts that cluster's reading nor makes the jobs of its next
     * answered poll look new.
     */
    function hpcHeard(payload: unknown): void {
        for (const poll of readAs(messageShape, payload)?.clusters ?? []) {
            if (poll.status !== 'ok') continue;
            let seen = jobs.get(poll.resource);
            if (seen === undefined) {
                seen = memory();
                jobs.set(poll.resource, seen);
            }
            const now = poll.recent;
            for (const id of seen(now.map((job) => job.id))) {
                const job = now.find((one) => one.id === id);
                if (job === undefined) continue;
                const finished = jobFinished(job);
                notices.post(
                    finished
                        ? t('statusbar.notice_job_finished', job.name, job.id, poll.name)
                        : t(
                              'statusbar.notice_job_failed',
                              job.name,
                              job.id,
                              job.state,
                              job.exit,
                              poll.name
                          ),
                    {
                        tone: finished ? 'info' : 'error',
                        actions: action(() => open.openView('hpc'))
                    }
                );
            }
        }
    }

    /**
     * The offered tasks a run's date is the last run of: each row of the run's hub whose `last_run`
     * names the run's place, and for the inbox, whose date is no hub's, the first offered row that
     * names it, so the machine's one date posts once.
     */
    function tasksOf(run: TaskRun, offered: readonly HubTask[]): HubTask[] {
        const reading = offered.filter((one) => one.lastRun === run.source);
        if (run.hub === null) return reading.slice(0, 1);
        return reading.filter((one) => one.hub === run.hub);
    }

    /**
     * Post for every run date this channel has not shown before for its place and hub, once for
     * each task the tray offers that reads its last run there, named as the tray names its row and
     * opening the view its row names. Every date is remembered, so a task offered later posts
     * nothing for a date it already had.
     */
    function runsHeard(seen: (runs: readonly TaskRun[]) => TaskRun[], runs: TaskRun[]): void {
        for (const run of seen(runs)) {
            const offered = open.offered();
            for (const task of tasksOf(run, offered)) {
                notices.post(t('statusbar.notice_update', pairLabel(task, offered)), {
                    actions: action(() => open.openView(task.view))
                });
            }
        }
    }

    function heard(message: Message): void {
        if (message.channel === 'sessions') {
            sessionsHeard(message.payload);
        } else if (message.channel === 'hpc') {
            hpcHeard(message.payload);
        } else if (message.channel === 'portfolio') {
            runsHeard(feeds, feedRuns(message.payload));
        } else if (message.channel === 'inbox') {
            runsHeard(notes, notesRuns(message.payload));
        }
    }

    function unwritten(reason: string, refused: boolean, action?: string): void {
        const named = refused && action !== undefined ? GIT_REFUSED.get(action) : undefined;
        notices.post(
            named?.(reason) ??
                (refused
                    ? t('statusbar.notice_write_refused', reason)
                    : t('statusbar.notice_write_failed', reason)),
            { tone: 'error' }
        );
    }

    function stateRefused(error: string): void {
        notices.post(t('app.state_refused', error), { tone: 'error' });
    }

    function noWorkspace(): void {
        notices.post(t('app.setting_no_workspace'), {
            tone: 'warning',
            actions: [{ label: t('app.setting_save_workspace'), run: open.saveWorkspace }]
        });
    }

    return { heard, unwritten, stateRefused, noWorkspace };
}
