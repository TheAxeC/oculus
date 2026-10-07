// Layer 2, server. The sentence of a git or gh command that ended with no reason of git's own:
// Cancel, the time limit, the output limit, a signal, or an exit status with nothing written (the
// codes of parse.ts's `classifyFailure`). It is worded from the `server.git` group of the text
// catalog, so the write routes (server/git/git-routes.ts) and the read path (run.ts's `reasonOf`)
// say a failure in one set of words. It sits beside run.ts, below every folder that words a git
// failure.

import { words } from '../words.ts';
import type { CommandFailure, Unfinished } from './parse.ts';

/** The word for the operation a command left unfinished, from the catalog. */
function leftWord(left: Unfinished, catalog: Record<string, string>): string {
    if (left === 'merge') return words(catalog, 'server.git.kind_merge');
    if (left === 'rebase') return words(catalog, 'server.git.kind_rebase');
    return words(catalog, 'server.git.kind_cherry_pick');
}

/** The catalog's sentence for a failure's code, without what it left unfinished. */
function sentenceOf(failure: CommandFailure, catalog: Record<string, string>): string {
    const program =
        failure.program === 'gh'
            ? words(catalog, 'server.git.program_gh')
            : words(catalog, 'server.git.program_git');
    if (failure.code === 'cancelled') return words(catalog, 'server.git.cancelled', program);
    if (failure.code === 'timed-out') {
        return words(catalog, 'server.git.timed_out', program, failure.detail);
    }
    if (failure.code === 'too-much-output') {
        return words(catalog, 'server.git.too_much_output', program, failure.detail);
    }
    if (failure.code === 'signal') {
        return words(catalog, 'server.git.signal', program, failure.detail);
    }
    return words(catalog, 'server.git.exit_status', program, failure.detail);
}

/**
 * The sentence of a command that ended with no reason of git's own, from the catalog: the program's
 * word first, then the detail (the limit in seconds, the limit in MB, the signal, the status), and
 * after it the operation the run left unfinished, when there is one.
 */
export function failureLine(failure: CommandFailure, catalog: Record<string, string>): string {
    const said = sentenceOf(failure, catalog);
    if (failure.left === undefined) return said;
    return words(catalog, 'server.git.left_in_progress', said, leftWord(failure.left, catalog));
}
