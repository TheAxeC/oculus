// Layer 2, server. The entry-edit facade owns the stable public import surface so internal writer
// modules can change independently of callers.

export { renderEntry, renderFlowMap } from './render.ts';
export {
    appendEntry,
    deleteEntry,
    reorderEntries,
    setEntryFields,
    startEntries
} from './entries.ts';
export { addSubtask, deleteSubtask, setSubtask, subtaskLines } from './subtasks.ts';
export { setHostStatus } from './host-status.ts';
export { entryRange } from './lines.ts';
export type { LineRange, SubtaskBlock, SubtaskLine } from './lines.ts';
