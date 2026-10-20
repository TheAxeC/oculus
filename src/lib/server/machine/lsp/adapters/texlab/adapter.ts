// Layer 2, server. What texlab needs of a root beyond its program: the program itself, found at the
// path `latex.texlab_path` names or else on the PATH oculus was started with, and the folder of
// links that is its whole PATH (links.ts). texlab has nothing to choose and nothing to approve: it
// never reads a latexmkrc (its PATH holds no latexmk), so nothing it runs is a repository's code.
//
// The program is launched by its absolute path, since a child started with an environment of its
// own looks a bare command up in that environment's PATH, which holds only the links. A
// `latex.texlab_path` that cannot be used is the server's `not_found` with the path in the note,
// and the PATH is not tried in its place: the reader named a program, and another one would be a
// different server than the one asked for.

import { isAbsolute } from 'node:path';
import { expandHome } from '../../../../files/files.ts';
import type { LatexBuilding } from '../../../../../data/sources/config/settings/latex.ts';
import { programPath } from '../../../../core/program.ts';
import { NO_APPROVAL, NO_CHOICE, notFound } from '../../choices.ts';
import type { Adapter, Prepared, RootEnv, ServerEntry } from '../../servers.ts';
import { makeLinks } from './links.ts';

/** The program texlab is run as: its absolute path, or the prepared answer that it is not there. */
function programOf(
    entry: ServerEntry,
    env: RootEnv,
    given: string
): { path: string } | { missing: Prepared } {
    if (given === '') {
        const found = programPath(entry.program, env.env);
        return found === null
            ? { missing: notFound(entry, ' on the PATH oculus was started with') }
            : { path: found };
    }
    const named = expandHome(given);
    if (!isAbsolute(named)) {
        return {
            missing: notFound(
                entry,
                ` at ${given}: latex.texlab_path takes an absolute path or one that starts with ~`
            )
        };
    }
    const found = programPath(named, env.env);
    return found === null
        ? { missing: notFound(entry, ` at ${given}, which latex.texlab_path names`) }
        : { path: found };
}

/** The adapter of the texlab entry; `latex` reads the LaTeX settings at each start. */
export function texlabAdapter(latex: () => LatexBuilding): Adapter {
    return {
        prepare(entry, env) {
            const program = programOf(entry, env, latex().texlabPath);
            if ('missing' in program) return program.missing;
            const links = makeLinks(env.lsp, env.env);
            if (!links.ok) {
                return {
                    ok: false,
                    state: 'failed',
                    code: 'lsp_folder',
                    program: entry.program,
                    note: `cannot make the folder ${links.folder} for the TeX programs texlab finds: ${links.error}`
                };
            }
            const setup = {
                root: env.root,
                interpreter: null,
                interpreterPrefixes: [],
                databaseFolder: null,
                fallbackFlags: [],
                resolved: { path: program.path, env: { ...env.env, PATH: links.folder } }
            };
            const launch = entry.launch(setup);
            if (launch === null) return notFound(entry, '');
            return { ok: true, setup, launch };
        },

        ...NO_CHOICE,
        ...NO_APPROVAL
    };
}
