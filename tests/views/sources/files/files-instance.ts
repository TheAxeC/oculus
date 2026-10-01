// Layer 5, test support. The Files view's tab as the file-browser tests open it: one instance with
// the state a test hands in.

import type { Instance } from '../../../../src/lib/state/workbench/layout/index.ts';

/** One Files tab holding the given instance state. */
export function instance(state: unknown = {}): Instance {
    return { id: 'files-one', view: 'files', state };
}
