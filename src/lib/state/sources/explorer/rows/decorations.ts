// Layer 2, client state, pure. What git and the Problems view say of the rows of the tree: the
// letter and the colour a changed file is drawn with, and the colour a folder takes from the
// strongest change below it; and the count of errors and warnings a file holds, with the dot a
// folder holding some draws.
//
// The `git` channel carries, per repository, the staged, unstaged, untracked and conflicted paths.
// `statusFold` turns those lists into one lookup by absolute path, built once per payload;
// `decorationOf` then answers for one row. A file in several lists takes the strongest letter, so a
// staged add that was edited since still reads `A`. A folder takes the colour of the strongest
// change below it (conflict, then deleted, then modified, then added) and shows no letter. The
// untracked list names every untracked file; where it was cut at its 200 entries, the folder form
// of it (`untrackedByFolder`) is read too, and an untracked folder git lists there as a whole
// (`newdir/`) decorates everything under it as untracked. A problem mark is drawn beside the
// letter and in its own colour, which the name takes in place of git's: `problemMarkOf` turns the
// errors and warnings the store counts for a row into the mark, and the infos are no part of it.

import type { GitEntry, GitState } from '../../../../data/model/index.ts';
import { joinPath, pathUnder, trimSlash } from '../../../../data/helpers/files/paths.ts';
import { t } from '../../../shared/words/text.ts';

/** The letter a changed file shows: modified, untracked, added, deleted, renamed or conflicted. */
export type Mark = 'M' | 'U' | 'A' | 'D' | 'R' | '!';

/** The hue a decoration is drawn in: one of the four `--c-scm-*-txt` colours. */
export type Tone = 'conflict' | 'deleted' | 'modified' | 'added';

/** What a row shows: a file's letter, or the empty string for a folder, and the hue. */
export type Decoration = { mark: Mark | ''; tone: Tone };

/** The lists of one repository the fold reads, and the folder the repository is. */
export type FoldRepo = {
    dir: string;
    git: Pick<GitState, 'staged' | 'unstaged' | 'untracked' | 'untrackedByFolder' | 'conflicted'>;
};

/** Every decorated path: files by their letter, folders by their hue, whole untracked folders. */
export type StatusFold = {
    files: Map<string, Mark>;
    folders: Map<string, Tone>;
    whole: string[];
};

/** The hue each letter is drawn in: untracked in the added hue, renamed in the modified hue. */
const TONE: Record<Mark, Tone> = {
    '!': 'conflict',
    D: 'deleted',
    M: 'modified',
    R: 'modified',
    A: 'added',
    U: 'added'
};

/** The hues from the strongest to the weakest, which is the order a folder takes its colour in. */
const TONES: Tone[] = ['conflict', 'deleted', 'modified', 'added'];

/** The letters from the strongest to the weakest, which is the order a file takes its letter in. */
const MARKS: Mark[] = ['!', 'D', 'A', 'R', 'M', 'U'];

/** The letter a status of git's stands for, or null for one this view draws no letter for. */
function markOf(status: string): Mark | null {
    switch (status[0]) {
        case 'M':
        case 'T':
            return 'M';
        case 'A':
        case 'C':
            return 'A';
        case 'D':
            return 'D';
        case 'R':
            return 'R';
        case '?':
            return 'U';
        default:
            return null;
    }
}

/** The stronger of two letters. */
function stronger(a: Mark | undefined, b: Mark): Mark {
    return a === undefined || MARKS.indexOf(b) < MARKS.indexOf(a) ? b : a;
}

/** The stronger of two hues. */
function strongerTone(a: Tone | undefined, b: Tone): Tone {
    return a === undefined || TONES.indexOf(b) < TONES.indexOf(a) ? b : a;
}

/** The folder a path sits in, or null for a path with no folder above it. */
function folderOf(path: string): string | null {
    const at = path.lastIndexOf('/');
    return at <= 0 ? null : path.slice(0, at);
}

/**
 * The lookup of every path the repositories' lists decorate. A conflicted path is `!` whatever its
 * two letters are; any other path takes the letter of its status.
 */
export function statusFold(repos: readonly FoldRepo[]): StatusFold {
    const fold: StatusFold = { files: new Map(), folders: new Map(), whole: [] };
    for (const repo of repos) {
        const dir = trimSlash(repo.dir);
        const put = (entry: GitEntry, conflicted: boolean): void => {
            const mark = conflicted ? '!' : markOf(entry.status);
            if (mark === null) return;
            const whole = entry.path.endsWith('/');
            const path = joinPath(dir, whole ? entry.path.slice(0, -1) : entry.path);
            if (whole) fold.whole.push(path);
            else fold.files.set(path, stronger(fold.files.get(path), mark));
            const tone = TONE[mark];
            for (
                let at = whole ? path : folderOf(path);
                at !== null && pathUnder(dir, at) !== null;
                at = at === dir ? null : folderOf(at)
            ) {
                fold.folders.set(at, strongerTone(fold.folders.get(at), tone));
            }
        };
        for (const entry of repo.git.conflicted) put(entry, true);
        for (const entry of repo.git.staged) put(entry, false);
        for (const entry of repo.git.unstaged) put(entry, false);
        for (const entry of repo.git.untracked) put(entry, false);
        for (const entry of repo.git.untrackedByFolder) put(entry, false);
    }
    return fold;
}

/**
 * What one row of the tree shows, from its absolute path and whether it is a folder; null for a row
 * git says nothing of. A file under a whole untracked folder is untracked, and so is a folder under
 * one.
 */
export function decorationOf(
    fold: StatusFold,
    path: string,
    kind: 'file' | 'dir'
): Decoration | null {
    if (kind === 'dir') {
        const tone = fold.folders.get(path);
        if (tone !== undefined) return { mark: '', tone };
        return fold.whole.some((one) => pathUnder(one, path) !== null)
            ? { mark: '', tone: 'added' }
            : null;
    }
    const mark = fold.files.get(path);
    if (mark !== undefined) return { mark, tone: TONE[mark] };
    return fold.whole.some((one) => pathUnder(one, path) !== null)
        ? { mark: 'U', tone: 'added' }
        : null;
}

/** The hue of a problem mark: the worst severity of the problems it counts. */
type ProblemTone = 'error' | 'warning';

/**
 * What a row shows of its problems: how many errors and warnings it holds, the hue of the worst,
 * and whether it is drawn as a dot, which is how a folder holding some is drawn.
 */
export type ProblemMark = { count: number; tone: ProblemTone; dot: boolean };

/**
 * The mark of a row from the errors and warnings counted for it, or null for a row with none. The
 * infos in the counts are left out.
 */
export function problemMarkOf(
    counts: { errors: number; warnings: number } | null,
    kind: 'file' | 'dir'
): ProblemMark | null {
    if (counts === null) return null;
    const count = counts.errors + counts.warnings;
    if (count === 0) return null;
    return { count, tone: counts.errors > 0 ? 'error' : 'warning', dot: kind === 'dir' };
}

/** The words of a file's problem mark: its count, `9+` from ten, and the tooltip that says it. */
export function problemWords(mark: ProblemMark): { count: string; title: string } {
    return {
        count: mark.count > 9 ? t('files.problems_many') : String(mark.count),
        title:
            mark.count === 1 ? t('files.problems_one_title') : t('files.problems_title', mark.count)
    };
}
