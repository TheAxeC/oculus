// Layer 2, client state, pure. The folder a LaTeX read or a LaTeX terminal is about: a project, by
// its id, whose main files sit in its `manuscript/` folder, or any folder of a served root, by the
// root's key and the path under it. The two forms are the two ways api/latex and the latex action
// of api/terminal take a folder, and `targetKey` is the key the page holds a folder's state under,
// so a project and a folder whose names happen to match can never share one. A terminal's task mark
// keeps a project by its hub and its key, which `markedTarget` reads back as the project's id.
// `latexCalls` words the two LaTeX actions of api/terminal over the terminals store's post.

import { hubId } from '../../../data/helpers/hub-names.ts';
import type { LatexApproval, LatexJobTarget } from '../../../data/model/index.ts';
import { COLS, ROWS, type TerminalAnswer } from './pty/pty-io.ts';

/** A project by its id, or a folder of a served root by its root key and its path under it. */
export type LatexTarget = { id: string } | { root: string; path: string };

/**
 * What a LaTeX terminal does to one main file: build it, clear what a build left beside it, stop
 * the build that runs, or check its citations.
 */
export type LatexStep = 'build' | 'clean' | 'stop' | 'checkcites';

/** What a build asks for beyond the main file: a recipe by name, the last one used, and force. */
export type LatexBuildAsk = { recipe?: string; last?: string; force?: boolean };

/** The LaTeX actions of the terminals store. */
export type LatexCalls = {
    latex: (
        target: LatexTarget,
        main: string,
        step: LatexStep,
        ask?: LatexBuildAsk,
        cols?: number,
        rows?: number
    ) => Promise<TerminalAnswer>;
    /**
     * Approve what a build or clean asked about, with the texts it was shown; the answer is ok, or
     * the refusal, `latex-changed` when the files changed since they were listed.
     */
    approveLatex: (
        target: LatexTarget,
        main: string,
        approval: LatexApproval,
        ask?: LatexBuildAsk
    ) => Promise<TerminalAnswer>;
};

/**
 * Build, clean, stop or check the citations of one main file of a project's manuscript or of a
 * folder of a served root, and approve what such a step asked about. The page sends the folder's
 * name and the file's, and for a build the recipe it asks for; the server checks the name against
 * the folder's own main files and supplies both the command and the folder it runs in.
 */
export function latexCalls(post: (body: unknown) => Promise<TerminalAnswer>): LatexCalls {
    return {
        latex: (target, main, step, ask = {}, cols = COLS, rows = ROWS) =>
            post({ action: 'latex', ...targetFields(target), main, step, ...ask, cols, rows }),
        approveLatex: (target, main, approval, ask = {}) => {
            const { step, texts } = approval;
            return post({
                action: 'approve-latex',
                ...targetFields(target),
                main,
                step,
                ...ask,
                texts
            });
        }
    };
}

/**
 * The target a terminal's task mark names, which keeps a project as its hub and its key: the
 * project by its internal id, a folder as it is.
 */
export function markedTarget(target: LatexJobTarget): LatexTarget {
    return 'key' in target ? { id: hubId(target.hub, target.key) } : target;
}

/** The part of a query key that names the target, for the query client and the wait lists. */
export function targetKey(target: LatexTarget): string[] {
    return 'id' in target ? ['project', target.id] : ['folder', target.root, target.path];
}

/** The fields of an api request that name the target. */
export function targetFields(target: LatexTarget): Record<string, string> {
    return 'id' in target ? { id: target.id } : { root: target.root, path: target.path };
}

/** Whether the target names nothing: a project with no id, or a folder of no root. */
export function emptyTarget(target: LatexTarget): boolean {
    return 'id' in target ? target.id === '' : target.root === '';
}
