// Layer 2, server. The entry-edit facade owns the stable public import surface so internal writer
// modules can change independently of callers.

export { renderEntry, renderFlowMap } from './render.ts';
export {
    appendEntry,
    deleteEntry,
    reorderEntries,
    setEntryFields,
    startEntries,
    takeOutAppended
} from './entries.ts';
export { addSubtask, deleteSubtask, setSubtask, subtaskLines, subtaskValues } from './subtasks.ts';
export { setSections } from './merge.ts';
export { FOLLOWUP, SUBTASKS, entryRange } from './lines.ts';
export type { LineBlock, LineRange, SubtaskBlock, SubtaskLine } from './lines.ts';
