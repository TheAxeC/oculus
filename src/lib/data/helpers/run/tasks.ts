// Layer 1, data. The four update tasks and whether a word names one. The list itself, UPDATE_TASKS,
// is defined in data/model/model-processes.ts, because the schedule payload there names the kinds
// and the model layer may not import data/helpers; it is re-exported here so every other module
// reads the kinds beside the rule. The server starts a task from it and the update tray lists the
// four by it, and both must give the same answer for a word.

import { UPDATE_TASKS, type UpdateTask } from '../../model/index.ts';

export { UPDATE_TASKS, type UpdateTask };

/** Whether a value names one of the four update tasks. */
export function isUpdateTask(value: unknown): value is UpdateTask {
    return UPDATE_TASKS.some((task) => task === value);
}
