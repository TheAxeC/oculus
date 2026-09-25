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

import type {
    HookEvent,
    HpcPayload,
    HpcRecent,
    InboxPayload,
    Message,
    SessionsPayload,
    Snapshot
} from '../../../data/model/index.ts';
import type { NoticeAction, NoticesStore } from './notices.svelte.ts';
import { t } from '../../shared/words/text.ts';

/**
 * Whether a session's last hook leaves it waiting on a permission prompt, Claude Code's
 * `permission_prompt`, which is what the page's waiting count and the window title count.
 */
export function waitsOnReader(hook: HookEvent | null | undefined): boolean {
    return hook?.event === 'notification' && hook.kind === 'permission_prompt';
}

/** What a waiting session waits for: an answer to a permission prompt, or input after its turn. */
export type WaitKind = 'permission' | 'idle';

/**
 * What a session's last hook leaves it waiting for: a permission prompt, or Claude Code's
 * `idle_prompt`, sent when it has finished its turn and waits for the reader's input; null for
 * any other hook and for none.
 */
export function waitOf(hook: HookEvent | null | undefined): WaitKind | null {
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
export function waitingOf(payload: SessionsPayload | null): Waiting[] {
    return listOf(payload?.records).flatMap((record) => {
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

/** A list the wire carries, or none where a payload left it out. */
function listOf<T>(value: readonly T[] | undefined | null): readonly T[] {
    return Array.isArray(value) ? (value as readonly T[]) : [];
}

/**
 * The jobs the Live HPC poll lists as ended, `recent`, from a poll the cluster answered, and none
 * from one it did not: a failed poll says nothing about which jobs ended.
 */
export function endedJobs(payload: HpcPayload | null): readonly HpcRecent[] {
    return payload?.status === 'ok' ? listOf(payload.recent) : [];
}

/**
 * Whether an ended job finished: Slurm's COMPLETED with a zero exit code, or no code given. Any
 * other state (FAILED, TIMEOUT, OUT_OF_MEMORY, CANCELLED and the rest) or a non-zero code is a
 * failure.
 */
export function jobFinished(job: Pick<HpcRecent, 'state' | 'exit'>): boolean {
    const exit = job.exit.trim();
    return job.state.trim() === 'COMPLETED' && (exit === '' || exit === '0:0');
}

/** The update tray's tasks. */
export type Task = 'litwatch' | 'scout' | 'linkedin' | 'inbox';

/** The update tray's tasks, by the value that says when each last produced its results. */
export type TaskRuns = Partial<Record<Task, string>>;

/** The view each task's results are read in. */
export const TASK_VIEW: Record<Task, string> = {
    litwatch: 'radar',
    scout: 'leads',
    linkedin: 'linkedin',
    inbox: 'inbox'
};

/** The run dates of the three tasks the portfolio's feed summary carries, empty for none. */
export function feedRuns(snapshot: Snapshot | null): TaskRuns {
    // A snapshot that carries no entities, as a portfolio message still being built may, has no
    // feed summary to read.
    const entities: Snapshot['entities'] | undefined = snapshot?.entities;
    const feeds = entities?.feeds;
    return {
        litwatch: feeds?.radar?.lastRun ?? '',
        scout: feeds?.scout?.lastRun ?? '',
        linkedin: feeds?.linkedin?.lastPost ?? ''
    };
}

/** The run date of the inbox triage, which its own channel carries. */
export function notesRuns(inbox: InboxPayload | null): TaskRuns {
    return { inbox: inbox?.notesRun ?? '' };
}

/** What the store opens for a notification's action. */
export type NoticeOpeners = {
    openSession: (id: string, title: string) => void;
    openView: (view: string) => void;
};

export type NoticeSourcesStore = {
    /** Hear one message the entities store kept. */
    heard: (message: Message) => void;
    /**
     * Hear one write that did not land: `refused` when the server answered and refused it, and
     * otherwise a write that got no answer, in the words the writes store gave.
     */
    unwritten: (reason: string, refused: boolean) => void;
};

/** The words each update task goes by, the tray's own. */
function taskName(task: Task): string {
    if (task === 'litwatch') return t('app.tasks.lit_label');
    if (task === 'scout') return t('app.tasks.scout_label');
    if (task === 'linkedin') return t('app.tasks.linkedin_label');
    return t('app.tasks.inbox_label');
}

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

export function createNoticeSources(
    notices: Pick<NoticesStore, 'post'>,
    open: NoticeOpeners
): NoticeSourcesStore {
    const sessions = memory();
    const jobs = memory();
    const feeds = memory();
    const notes = memory();

    function action(run: () => void): NoticeAction[] {
        return [{ label: t('statusbar.notice_open'), run }];
    }

    function sessionsHeard(payload: SessionsPayload): void {
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
     * A poll the cluster did not answer is not read at all, so it neither starts the reading nor
     * makes the jobs of the next answered poll look new.
     */
    function hpcHeard(payload: HpcPayload): void {
        if (payload.status !== 'ok') return;
        const now = endedJobs(payload);
        for (const id of jobs(now.map((job) => job.id))) {
            const job = now.find((one) => one.id === id);
            if (job === undefined) continue;
            const finished = jobFinished(job);
            notices.post(
                finished
                    ? t('statusbar.notice_job_finished', job.name, job.id)
                    : t('statusbar.notice_job_failed', job.name, job.id, job.state, job.exit),
                { tone: finished ? 'info' : 'error', actions: action(() => open.openView('hpc')) }
            );
        }
    }

    /** Post for every task whose run date is one this channel has not shown before. */
    function runsHeard(seen: (keys: readonly string[]) => string[], runs: TaskRuns): void {
        const keys = (Object.keys(runs) as Task[]).flatMap((task) =>
            (runs[task] ?? '') === '' ? [] : [`${task}@${runs[task]}`]
        );
        for (const key of seen(keys)) {
            const task = key.slice(0, key.indexOf('@')) as Task;
            notices.post(t('statusbar.notice_update', taskName(task)), {
                actions: action(() => open.openView(TASK_VIEW[task]))
            });
        }
    }

    function heard(message: Message): void {
        if (message.channel === 'sessions') {
            sessionsHeard(message.payload as SessionsPayload);
        } else if (message.channel === 'hpc') {
            hpcHeard(message.payload as HpcPayload);
        } else if (message.channel === 'portfolio') {
            runsHeard(feeds, feedRuns(message.payload as Snapshot));
        } else if (message.channel === 'inbox') {
            runsHeard(notes, notesRuns(message.payload as InboxPayload));
        }
    }

    function unwritten(reason: string, refused: boolean): void {
        notices.post(
            refused
                ? t('statusbar.notice_write_refused', reason)
                : t('statusbar.notice_write_failed', reason),
            { tone: 'error' }
        );
    }

    return { heard, unwritten };
}
