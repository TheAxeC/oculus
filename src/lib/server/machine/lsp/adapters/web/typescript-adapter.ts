// Layer 2, server. What the TypeScript server needs of a root beyond its program: nothing to
// choose, and whether the repository's Svelte configuration is approved, which decides whether
// tsserver is given the Svelte plugin (the plugin loads the repository's own `svelte/compiler`).
// It is restarted when that approval is made or taken back (choices.ts).

import { NO_APPROVAL, NO_CHOICE, prepareBare } from '../../choices.ts';
import type { Adapter } from '../../servers.ts';
import { isRootApproved } from './approval.ts';

export const typescriptAdapter: Adapter = {
    async prepare(entry, env) {
        return prepareBare(entry, env, { configApproved: await isRootApproved(env) });
    },

    ...NO_CHOICE,
    ...NO_APPROVAL
};
