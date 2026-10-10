// Layer 3, shell. How the Workbenches menu makes a workbench again from its arrangement. The
// arrangement is the `workbench:` key of the merged config, which the shell may not read, so the
// page makes one function from the folder pages and provides it to the rail under a context key, as
// it hands the panes their file problems; a rail with none (a test drawing the rail alone) remakes
// nothing.

import { getContext, setContext } from 'svelte';

/** Make the workbench page with this id again; answers whether it was remade. */
export type ResetWorkbench = (id: string) => boolean;

/** The context key the page provides the function under. */
const RESET_WORKBENCH = Symbol('reset workbench');

/** Provide the function to the rail below the caller. Called by the page alone. */
export function provideWorkbenchReset(reset: ResetWorkbench): void {
    setContext(RESET_WORKBENCH, reset);
}

/** The function the page provided, or one that remakes nothing. */
export function useWorkbenchReset(): ResetWorkbench {
    return getContext<ResetWorkbench | undefined>(RESET_WORKBENCH) ?? (() => false);
}
