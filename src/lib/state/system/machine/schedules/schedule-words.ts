// Layer 2, client state. The sentences the catalog holds for the words a schedule is held or
// refused with (data/model/machine/model-machine.ts SCHEDULE_WORDS). The server answers a word and
// the names its sentence is about, so no English of the server reaches the reader. A word of the
// terminal route (`command-unknown`, `no-file`, `bad-repo` and the others a chain or a start is
// refused with) is said by state/shared/answers/terminal-words.ts, and a word of neither is said as
// a failure for a reason this version of oculus does not name.

import { SCHEDULE_WORDS, type ScheduleWord } from '../../../../data/model/index.ts';
import { terminalSentence, terminalWord } from '../../../shared/answers/terminal-words.ts';
import { t as catalogText } from '../../../shared/words/text.ts';

/** The schedule word a value is, or null for any other value. */
function scheduleWord(value: unknown): ScheduleWord | null {
    return SCHEDULE_WORDS.find((one) => one === value) ?? null;
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
            return catalogText('app.schedules.problem_update_task_unknown', first, second);
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
