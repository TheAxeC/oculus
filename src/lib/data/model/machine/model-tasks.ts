// Layer 1, data. The update tasks the update tray offers, declared once here and re-exported by
// data/model/index.ts: the word a task is named by, the places its last run is read from, and one
// task of one hub as a row of that hub's `update_tasks` describes it.

/**
 * An update task: the word a row of a hub's `update_tasks` names it by, which is also the name of
 * its file `.oculus/tasks/<task>.md`.
 */
export type UpdateTask = string;

/**
 * Where the update tray reads the last run of a task from: the hub's radar feed, its leads feed,
 * its LinkedIn folder's last post, or the machine's inbox notes. Each is a reader of oculus's own,
 * so a row of `update_tasks` names one of them and no other.
 */
export const LAST_RUNS = ['radar', 'scout', 'linkedin', 'inbox'] as const;

/** One of the places LAST_RUNS names. */
export type LastRun = (typeof LAST_RUNS)[number];

/**
 * An update task of one hub, as a row of that hub's `update_tasks` describes it and the hub holds
 * its file: the task, the name of the hub, the words of its tray row and its note, the view a
 * notice of its run opens, where its last run is read from (null for a row that names no place, a
 * task whose last run oculus does not read), and the place of the row (the hub's settings file and
 * the dotted key of the row), which a finding about it names.
 */
export type HubTask = {
    task: UpdateTask;
    hub: string;
    label: string;
    note: string;
    view: string;
    lastRun: LastRun | null;
    file: string;
    at: string;
};
