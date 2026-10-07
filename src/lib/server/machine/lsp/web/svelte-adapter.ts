// Layer 2, server. What the Svelte server needs of a root beyond its program: whether the
// repository's own Svelte and Vite configuration is approved, which decides whether the server
// starts trusted (it imports the configuration and the repository's `svelte`, `prettier` and
// preprocessors) or untrusted (it loads neither and runs with reduced capabilities). An approval
// or its taking back restarts the server, since the server reads the trust at `initialize` only.

import { notFound } from '../choices.ts';
import type { Adapter, Setup } from '../servers.ts';
import { approveRootConfig, configOf, revokeRootConfig } from './approval.ts';

export const svelteAdapter: Adapter = {
    async prepare(entry, env) {
        const { view } = await configOf(env);
        const setup: Setup = {
            root: env.root,
            interpreter: null,
            interpreterPrefixes: [],
            databaseFolder: null,
            fallbackFlags: [],
            configApproved: view.approved
        };
        const launch = entry.launch(setup);
        if (launch === null) return notFound(entry, ' under the oculus folder');
        const untrusted = `${entry.program} runs untrusted: the configuration is not approved`;
        return { ok: true, setup, launch, note: view.approved ? undefined : untrusted };
    },

    async choices(env) {
        return { config: (await configOf(env)).view };
    },

    choose() {
        return { choice: {}, apply: 'configuration' };
    },

    async approve(env, message) {
        if (message.approval.kind !== 'config') return { ok: true, apply: null };
        const done = await approveRootConfig(env, message.approval.key);
        // A key that no longer matches approves nothing and the list is sent again.
        if (done === null) return { ok: true, apply: null };
        return { ok: done.ok, apply: done.ok ? 'restart' : null };
    },

    async revoke(env) {
        const done = await revokeRootConfig(env);
        return { ok: done.ok, apply: done.ok ? 'restart' : null };
    },

    settings(_env, setup) {
        return setup;
    }
};
