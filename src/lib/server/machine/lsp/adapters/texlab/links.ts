// Layer 2, server. The folder of links texlab runs with as its whole PATH. texlab finds the TeX
// distribution by running `kpsewhich` (and `latex`) and, for a project with a latexmkrc, runs
// `latexmk -dir-report` on it, and a latexmkrc is Perl that latexmk runs. With a PATH that holds no
// `latexmk`, texlab cannot start that run, so opening a repository's `.tex` file never runs the
// code of its latexmkrc; the LaTeX build's latexmk step is gated by the reader's approval of those
// files (pty/latex/approval.ts).
//
// The folder is `<lsp folder>/texlab/bin` and holds a link to `latex`, to `kpsewhich` and to
// `tectonic` for each of them oculus's own PATH finds. It is made again at each start: each link is
// written beside its name and renamed over it, and every entry that is not wanted is removed, so
// two starts at once leave a whole folder and a program that is gone since the last start leaves no
// link behind.

import { randomBytes } from 'node:crypto';
import { mkdirSync, readdirSync, renameSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { programPath } from '../../../../content/latex/recipes.ts';

/** The programs of the TeX distribution texlab is given, each when oculus's PATH finds it. */
const LINKED_PROGRAMS = ['latex', 'kpsewhich', 'tectonic'] as const;

/** How many times a link is written again when another start removed its temporary name. */
const ATTEMPTS = 3;

/** The folder of links under the lsp folder. */
function linksFolder(lsp: string): string {
    return join(lsp, 'texlab', 'bin');
}

/** Write a link to `target` as `name` in `folder`, replacing what was there in one rename. */
function link(folder: string, name: string, target: string): void {
    for (let attempt = 1; ; attempt += 1) {
        const beside = join(folder, `.new-${randomBytes(6).toString('hex')}`);
        symlinkSync(target, beside);
        try {
            renameSync(beside, join(folder, name));
            return;
        } catch (error) {
            rmSync(beside, { force: true });
            const missing = (error as NodeJS.ErrnoException).code === 'ENOENT';
            if (!missing || attempt >= ATTEMPTS) throw error;
        }
    }
}

/**
 * Make the folder of links for the programs `env` finds. Answers the folder, or the reason it could
 * not be made or written.
 */
export function makeLinks(
    lsp: string,
    env: NodeJS.ProcessEnv
): { ok: true; folder: string } | { ok: false; folder: string; error: string } {
    const folder = linksFolder(lsp);
    try {
        mkdirSync(folder, { recursive: true });
        const wanted = new Map<string, string>();
        for (const name of LINKED_PROGRAMS) {
            const found = programPath(name, env);
            if (found !== null) wanted.set(name, found);
        }
        for (const [name, target] of wanted) link(folder, name, target);
        for (const entry of readdirSync(folder)) {
            if (!wanted.has(entry)) rmSync(join(folder, entry), { recursive: true, force: true });
        }
        return { ok: true, folder };
    } catch (error) {
        return { ok: false, folder, error: (error as Error).message };
    }
}
