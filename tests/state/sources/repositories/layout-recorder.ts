// A layout store double for the Repositories store's cases: it records every view opened, in the
// pane or beside it, and answers a fixed tab id.

import type { LayoutStore } from '../../../../src/lib/state/workbench/layout.svelte.ts';

/** One view the double was asked to open. */
export type Opened = { view: string; state: unknown; beside: boolean };

/** The double, appending to `opened`; `showInFiles` answers the Files view's reveal. */
export function layoutRecorder(
    opened: Opened[],
    showInFiles: (path: string, at?: string) => string = () => 'one'
): LayoutStore {
    return {
        openView: (view: string, state?: unknown) => {
            opened.push({ view, state, beside: false });
            return 'one';
        },
        openBeside: (view: string, state?: unknown) => {
            opened.push({ view, state, beside: true });
            return 'one';
        },
        showInFiles
    } as unknown as LayoutStore;
}
