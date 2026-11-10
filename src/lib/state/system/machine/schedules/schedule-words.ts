// Layer 2, client state. The sentences the catalog holds for the words a schedule is held or
// refused with (data/model/machine/model-machine.ts SCHEDULE_WORDS). The server answers a word and
// the names its sentence is about, so no English of the server reaches the reader. A word of the
// terminal route (`command-unknown`, `no-file`, `bad-repo` and the others a chain or a start is
// refused with) is said by state/shared/answers/terminal-words.ts, and a word of neither is said as
// a failure for a reason this version of oculus does not name.
//
// The labels an update task goes by are here too, since the tray, its dialog, the Focus board's
// refresh lines and the notices all name a task of a hub by the same words: the `label` of the
// hub's row of `update_tasks`, with the hub's name beside it when two or more offered rows have
// that label.

import { SCHEDULE_WORDS, type HubTask, type ScheduleWord } from '../../../../data/model/index.ts';
import { terminalSentence, terminalWord } from '../../../shared/answers/terminal-words.ts';
import { t as catalogText } from '../../../shared/words/text.ts';

/** A task of one hub by its task and its hub's name, as a schedule entry names it. */
export type TaskOfHub = Pick<HubTask, 'task' | 'hub'>;

/**
 * The label of a task of one hub: the label of its row among the `offered` rows, or the task's own
 * word for a task no offered row is, such as a schedule's task whose hub does not list it.
 */
function taskLabel(pair: TaskOfHub, offered: readonly HubTask[]): string {
    const row = offered.find((one) => one.task === pair.task && one.hub === pair.hub);
    return row?.label ?? pair.task;
}

/** The label of a task of one hub, with the hub's name beside it as `app.tasks.in_hub` puts it. */
export function hubTaskLabel(pair: TaskOfHub, offered: readonly HubTask[]): string {
    return catalogText('app.tasks.in_hub', taskLabel(pair, offered), pair.hub);
}

/**
 * The label of a task of one hub as the tray names its row: its label, with the hub's name beside
 * it when two or more of the `offered` rows have that label.
 */
export function pairLabel(pair: TaskOfHub, offered: readonly HubTask[]): string {
    const label = taskLabel(pair, offered);
    const shared = offered.filter((one) => one.label === label).length > 1;
    return shared ? hubTaskLabel(pair, offered) : label;
}

/** The schedule word a value is, or null for any other value. */
function scheduleWord(value: unknown): ScheduleWord | null {
    return SCHEDULE_WORDS.find((one) => one === value) ?? null;
}

/**
 * The sentence of `update-task-unknown`: the task alone for a task that is no task name, and with
 * its hub and the tasks that hub's `update_tasks` lists for a name the list lacks, an empty list
 * worded as a hub that lists none.
 */
function taskUnknown(names: readonly string[]): string {
    const [task = '', hub = '', listed = ''] = names;
    if (names.length < 2) return catalogText('app.schedules.problem_update_task_unknown', task);
    return listed === ''
        ? catalogText('app.schedules.problem_update_task_none', task, hub)
        : catalogText('app.schedules.problem_update_task_unlisted', task, hub, listed);
}

/** The sentence for one schedule word, with the names the server sent for it. */
function problemSentence(word: ScheduleWord, names: readonly string[]): string {
    const [first = '', second = ''] = names;
    switch (word) {
        case 'name-missing':
            return catalogText('app.schedules.problem_name_missing');
        case 'name-wrong':
            return catalogText('app.schedules.problem_name_wrong', first);
        case 'name-twice':
            return catalogText('app.schedules.problem_name_twice', first);
        case 'runs-wrong':
            return catalogText('app.schedules.problem_runs_wrong');
        case 'update-task-unknown':
            return taskUnknown(names);
        case 'command-missing':
            return catalogText('app.schedules.problem_command_missing', first, second);
        case 'commands-unread':
            return catalogText('app.schedules.problem_commands_unread', first);
        case 'folder-empty':
            return catalogText('app.schedules.problem_folder_empty');
        case 'folder-wrong':
            return catalogText('app.schedules.problem_folder_wrong', first);
        case 'folder-missing':
            return catalogText('app.schedules.problem_folder_missing', first);
        case 'folder-not-served':
            return catalogText('app.schedules.problem_folder_not_served', first);
        case 'prompt-empty':
            return catalogText('app.schedules.problem_prompt_empty');
        case 'prompt-too-long':
            return catalogText('app.schedules.problem_prompt_too_long', first);
        case 'prompt-control':
            return catalogText('app.schedules.problem_prompt_control');
        case 'hub-wrong':
            return catalogText('app.schedules.problem_hub_wrong', first);
        case 'hub-unknown':
            return catalogText('app.schedules.problem_hub_unknown', first);
        case 'when-unreadable':
            return catalogText('app.schedules.problem_when_unreadable', first);
        case 'when-never':
            return catalogText('app.schedules.problem_when_never', first);
        case 'key-unknown':
            return catalogText('app.schedules.problem_key_unknown', first);
        case 'flag-wrong':
            return catalogText('app.schedules.problem_flag_wrong', first);
        case 'unattended-command':
            return catalogText('app.schedules.problem_unattended_command');
        case 'needs-approval':
            return catalogText('app.schedules.problem_chain_unapproved', first);
        case 'approval-unwritten':
            return catalogText('app.schedules.problem_approval_unwritten');
        case 'chain-changed':
            return catalogText('app.schedules.problem_chain_changed', first);
        case 'no-primary':
            return catalogText('app.schedules.problem_no_primary');
        case 'record-locked':
            return catalogText('app.schedules.problem_record_locked');
        case 'record-unread':
            return catalogText('app.schedules.problem_record_unread');
        case 'record-unwritten':
            return catalogText('app.schedules.problem_record_unwritten');
        case 'schedules-unread':
            return catalogText('app.schedules.problem_schedules_unread');
        case 'schedules-unwritten':
            return catalogText('app.schedules.problem_schedules_unwritten');
        case 'server-stopped':
            return catalogText('app.schedules.problem_server_stopped');
        case 'entry-changed':
            return catalogText('app.schedules.problem_entry_changed');
        case 'entry-unwritable':
            return catalogText('app.schedules.problem_entry_unwritable', first);
        case 'entry-wrong':
            return catalogText('app.schedules.problem_entry_wrong', first);
    }
}

/**
 * The sentence for a word and its names: a schedule word, else a terminal route word, else null.
 */
export function wordSentence(word: unknown, names: readonly string[] = []): string | null {
    const schedule = scheduleWord(word);
    if (schedule !== null) return problemSentence(schedule, names);
    const terminal = terminalWord(word);
    return terminal === null ? null : terminalSentence(terminal, names);
}
