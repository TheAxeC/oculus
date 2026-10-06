// Layer 2, server. What clangd needs of a root beyond its program: the compile database it is
// given, the flags of the configuration in force, and the databases the reader picks from. The
// finding and linking of databases is databases.ts's, the reading of `.oculus/cpp.yml` is
// cpp-file.ts's; this joins them to the choices file (../choices.ts).

import { chosenFor } from '../choices.ts';
import type { Adapter, Setup } from '../servers.ts';
import { databasePlan, hasDatabase, linkDatabase } from './databases.ts';

export const clangdAdapter: Adapter = {
    prepare(entry, env) {
        const plan = databasePlan(env.root, chosenFor(env.lsp, env.root).database);
        let folder: string | null = null;
        if (plan.inForce !== null && hasDatabase(plan.inForce, env.root)) {
            const linked = linkDatabase(env.lsp, env.root, plan.inForce);
            if (!linked.ok) {
                return {
                    ok: false,
                    state: 'failed',
                    code: 'lsp_folder',
                    program: entry.program,
                    note: `cannot make the folder ${linked.folder} for the compile database: ${linked.error}`
                };
            }
            folder = linked.folder;
        }
        const setup: Setup = {
            root: env.root,
            interpreter: null,
            databaseFolder: folder,
            fallbackFlags: plan.fallbackFlags
        };
        const launch = entry.launch(setup);
        if (launch === null) {
            return {
                ok: false,
                state: 'not_found',
                code: 'not_found',
                program: entry.program,
                note: `${entry.program} is not installed`
            };
        }
        return { ok: true, setup, launch };
    },

    choices(env) {
        const plan = databasePlan(env.root, chosenFor(env.lsp, env.root).database);
        return {
            interpreters: [],
            interpreter: null,
            databases: plan.databases,
            database: plan.inForce?.key ?? null,
            findings: plan.findings
        };
    },

    choose(env, message) {
        const offered = databasePlan(env.root).databases;
        if (
            message.database === undefined ||
            !offered.some((one) => one.key === message.database)
        ) {
            return { choice: {}, apply: 'restart' };
        }
        return { choice: { database: message.database }, apply: 'restart' };
    },

    approve() {
        return { ok: true, changed: false };
    },

    settings(_env, setup) {
        return setup;
    }
};
