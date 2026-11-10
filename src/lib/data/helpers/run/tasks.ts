// Layer 1, data. The form of an update task's name, which is the name of its file
// `.oculus/tasks/<task>.md` in a hub, and whether a value has it. The tasks a hub offers are the
// rows of its `update_tasks` (data/sources/config/settings/hub-rows.ts), whose `task` field the
// options catalog holds to this form through `task_name` (config/catalog/value-rule.ts), and a
// schedule's task is held to it by the rule both the dialog and the server read an entry by
// (run/schedules.ts), so no name reaches a path outside the tasks folder.

import type { UpdateTask } from '../../model/index.ts';

/** Lowercase letters, digits and dashes that start with a letter: the form of a task's name. */
export const TASK_NAME = /^[a-z][a-z0-9-]*$/;

/** Whether a value is text of the form of a task's name. */
export function isTaskName(value: unknown): value is UpdateTask {
    return typeof value === 'string' && TASK_NAME.test(value);
}
