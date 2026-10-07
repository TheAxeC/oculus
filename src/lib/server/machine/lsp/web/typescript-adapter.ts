// Layer 2, server. What the TypeScript server needs of a root beyond its program: nothing to
// choose, and whether the repository's Svelte configuration is approved, which decides whether
// tsserver is given the Svelte plugin (the plugin loads the repository's own `svelte/compiler`).
// It is restarted when that approval is made or taken back (choices.ts).

import { NO_APPROVAL, notFound } from '../choices.ts';
import type { Adapter, Setup } from '../servers.ts';
import { isRootApproved } from './approval.ts';

export const typescriptAdapter: Adapter = {
    async prepare(entry, env) {
        const setup: Setup = {
            root: env.root,
            interpreter: null,
            interpreterPrefixes: [],
            databaseFolder: null,
            fallbackFlags: [],
            configApproved: await isRootApproved(env)
        };
        const launch = entry.launch(setup);
        if (launch === null) return notFound(entry, ' under the oculus folder');
        return { ok: true, setup, launch };
    },

    choices() {
        return {};
    },

    choose() {
        return { choice: {}, apply: 'configuration' };
    },

    ...NO_APPROVAL
};
