// Layer 2, server. What the Deposit view shows of a mirror beside the plan: how far the current
// branch is ahead of its upstream, how far it is ahead of and behind `origin/main`, the files its
// commits differ from `origin/main` in, Fetch, and the two texts of one file for the diff editor. A
// leaf over `Where`: it finds no project and reads no manifest, so deposit.ts resolves the mirror
// and calls it.
//
// The comparison with `origin/main` is between commits: the files `git diff origin/main HEAD`
// names, each shown as the text of `origin/main` against the text of `HEAD`. The sync plan's diff
// of a changed file is the text of `HEAD` against the file the sync left in the mirror. Only a path
// the caller names as listed is read, so a request cannot reach another file of the mirror.
//
// Nothing here moves the mirror's checkout or its current branch: `fetch origin` writes the
// remote-tracking refs alone, and the rest reads.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { words } from '../../core/words.ts';
import {
    MAX_OUTPUT,
    diffCmd,
    fetchCmd,
    logCmd,
    revParse,
    showCmd,
    type Outcome,
    type Where
} from './deposit-git.ts';

/** The remote branch the mirror is compared with. */
const REMOTE_MAIN = 'origin/main';

/** The mirror's branch against `origin/main`. */
export type MainComparison = {
    /** Whether `origin/main` and a commit of the mirror both exist to compare. */
    known: boolean;
    ahead: number;
    behind: number;
    /** The paths the mirror's commits and `origin/main` differ in, sorted. */
    differ: string[];
};

/** What a mirror with nothing to compare reads as. */
export const UNCOMPARED: MainComparison = { known: false, ahead: 0, behind: 0, differ: [] };

/** The two texts of one file, the left side first. */
type FileTexts = { original: string; modified: string };

/** An answer of the texts, with the texts on success. */
export type TextsOutcome = Outcome & { texts: FileTexts | null };

function lines(output: string): string[] {
    return output.split('\n').filter((one) => one !== '');
}

/** Fetch origin into the mirror's remote-tracking branches. */
export function fetchOrigin(at: Where, text: Record<string, string>): Promise<Outcome> {
    return fetchCmd(at, ['origin']).then((fetched) =>
        fetched.ok
            ? { ...fetched, output: words(text, 'server.deposit.fetched', 'origin') }
            : fetched
    );
}

/** How far the mirror's branch is ahead of and behind `origin/main`, and the files that differ. */
export async function compareWithMain(at: Where): Promise<MainComparison> {
    const there = await revParse(at, ['--verify', '--quiet', REMOTE_MAIN]);
    if (!there.ok) return UNCOMPARED;
    const here = await revParse(at, ['--verify', '--quiet', 'HEAD']);
    if (!here.ok) return UNCOMPARED;
    const ahead = await logCmd(at, ['--format=%H', `${REMOTE_MAIN}..HEAD`]);
    const behind = await logCmd(at, ['--format=%H', `HEAD..${REMOTE_MAIN}`]);
    const named = await diffCmd(at, ['--name-only', '--no-renames', '-z', REMOTE_MAIN, 'HEAD']);
    if (!ahead.ok || !behind.ok || !named.ok) return UNCOMPARED;
    return {
        known: true,
        ahead: lines(ahead.output).length,
        behind: lines(behind.output).length,
        differ: named.output
            .split('\0')
            .filter((one) => one !== '')
            .sort()
    };
}

/** How many commits the current branch is ahead of its upstream. No upstream is nothing to send. */
export async function aheadOfUpstream(at: Where): Promise<number> {
    const up = await revParse(at, ['--abbrev-ref', '@{upstream}']);
    if (!up.ok) return 0;
    const counted = await logCmd(at, ['--format=%H', `${up.output.trim()}..HEAD`]);
    return counted.ok ? lines(counted.output).length : 0;
}

/** The text of a path in a commit, empty when the commit holds no such path. */
async function committed(at: Where, commit: string, path: string): Promise<string> {
    const shown = await showCmd(at, [`${commit}:${path}`]);
    return shown.ok ? shown.output : '';
}

/** The text of a path in the mirror's checkout, empty when the file is not there. */
function onDisk(mirror: string, path: string): { text: string; size: number } {
    const file = join(mirror, path);
    try {
        const size = statSync(file).size;
        return { text: size > MAX_OUTPUT ? '' : readFileSync(file, 'utf8'), size };
    } catch {
        return { text: '', size: 0 };
    }
}

/**
 * The two texts of `path` for the diff editor, in the comparison `against` names. A path the
 * comparison does not list is refused, as is a file past what one command may answer.
 */
export async function textsOf(
    at: Where,
    against: string,
    path: string,
    planned: { path: string }[],
    text: Record<string, string>
): Promise<TextsOutcome> {
    const refused = (error: string): TextsOutcome => ({
        ok: false,
        output: '',
        error,
        texts: null
    });
    if (against !== 'plan' && against !== 'main') {
        return refused(words(text, 'server.deposit.diff_unknown_side', against));
    }
    const listed =
        against === 'main' ? (await compareWithMain(at)).differ : planned.map((one) => one.path);
    if (!listed.includes(path)) {
        return refused(words(text, 'server.deposit.diff_not_listed', path));
    }
    if (against === 'main') {
        const original = await committed(at, REMOTE_MAIN, path);
        const modified = await committed(at, 'HEAD', path);
        return { ok: true, output: '', error: '', texts: { original, modified } };
    }
    const synced = onDisk(at.dir, path);
    if (synced.size > MAX_OUTPUT) {
        return refused(words(text, 'server.deposit.diff_too_large', path));
    }
    const original = await committed(at, 'HEAD', path);
    return { ok: true, output: '', error: '', texts: { original, modified: synced.text } };
}
