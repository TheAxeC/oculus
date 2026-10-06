// Layer 2, server. What pyright needs of a root beyond its program: the interpreter it is answered,
// the interpreters the reader picks from, and the approval of a repository's own interpreter. The
// finding and asking of interpreters is interpreter.ts's; this joins it to the choices file
// (../choices.ts) and the approvals file (server/machine/approvals/approvals.ts).

import { approveInterpreter, isInterpreterApproved } from '../../approvals/approvals.ts';
import { chosenFor } from '../choices.ts';
import type { Adapter, RootEnv, Setup } from '../servers.ts';
import { interpretersFor, type Interpreters } from './interpreter.ts';

/** The interpreters of a root, with the reader's choice for it in force. */
async function interpreters(env: RootEnv): Promise<Interpreters> {
    return interpretersFor({
        root: env.root,
        chosen: chosenFor(env.lsp, env.root).interpreter,
        approved: (path) => isInterpreterApproved(env.approvals, env.root, path),
        run: env.run,
        exists: env.exists
    });
}

export const pyrightAdapter: Adapter = {
    async prepare(entry, env) {
        const found = await interpreters(env);
        const forced = found.list.find((one) => one.path === found.inForce);
        const note =
            forced !== undefined && !forced.approved && found.effective !== forced.path
                ? `${forced.path} is not approved on this machine, so pyright uses ${found.effective ?? 'its own Python'}`
                : undefined;
        const setup: Setup = {
            root: env.root,
            interpreter: found.effective,
            databaseFolder: null,
            fallbackFlags: []
        };
        const launch = entry.launch(setup);
        if (launch === null) {
            return {
                ok: false,
                state: 'not_found',
                code: 'not_found',
                program: entry.program,
                note: `${entry.program} is not installed under the oculus folder`
            };
        }
        return { ok: true, setup, launch, note };
    },

    async choices(env) {
        const found = await interpreters(env);
        return {
            interpreters: found.list,
            interpreter: found.inForce,
            databases: [],
            database: null,
            findings: []
        };
    },

    async choose(env, message) {
        if (message.interpreter === undefined) return { choice: {}, apply: 'configuration' };
        // A typed path is listed once it answers its version, so the listing is the check.
        const typed = await interpretersFor({
            root: env.root,
            chosen: message.interpreter,
            approved: (path) => isInterpreterApproved(env.approvals, env.root, path),
            run: env.run,
            exists: env.exists
        });
        if (typed.list.some((one) => one.path === message.interpreter)) {
            return { choice: { interpreter: message.interpreter }, apply: 'configuration' };
        }
        return {
            choice: {},
            note: `${message.interpreter} is not a Python that answers its version`,
            apply: 'configuration'
        };
    },

    async approve(env, message) {
        const listed = (await interpreters(env)).list.find(
            (one) => one.path === message.interpreter
        );
        if (listed?.found !== 'venv') return { ok: true, changed: false };
        const done = approveInterpreter(env.approvals, env.root, listed.path);
        return { ok: done.ok, changed: done.ok };
    },

    async settings(env, setup) {
        return { ...setup, interpreter: (await interpreters(env)).effective };
    }
};
