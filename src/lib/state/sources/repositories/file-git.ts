// Layer 2, client state. What the source tab needs to put git in its gutter: which repository holds
// the file it has open and the file's path there, the words a blamed line carries, how long ago a
// commit was made, which gutter mark each line draws and the words a mark says. The read-only code
// window's gutter (views/sources/source/Gutter.svelte) and the editor's (the blame rows and the
// marks handed to ui/controls/editor) both read them here, so the two say the same thing.
//
// A source tab names its file by the key of the root the file routes serve it under and a path
// under that root; the `git` channel names a repository by its folder. The repository holding a
// file is the deepest one whose folder holds the file's folder, which is the rule the status bar's
// branch item already reads a tab's repository by: both read it through deepestHolding and
// pathUnder of data/helpers/files/paths.ts, and build a file's whole path with its joinPath. How
// long ago a commit was made is counted by data/helpers/dates.ts's ago, the one the session list
// counts by, and worded here.

import type { GitBlameLine, GitLineMark } from '../../../data/model/index.ts';
import { ago as countAgo, type AgoUnit } from '../../../data/helpers/dates.ts';
import { deepestHolding, joinPath, pathUnder } from '../../../data/helpers/files/paths.ts';
import { t } from '../../shared/words/text.ts';

/** A root the file routes serve: its key and the folder it is. */
export type ServedRoot = { key: string; dir: string };

/** A file of a repository: the repository's folder and the path under it. */
export type RepoFile = { root: string; path: string };

/** A file as a source tab names it: the served root's key and the path under it. */
export type TabFile = { root: string; path: string };

/** The whole path of a tab's file, or null for a key no served root has. */
function wholePath(served: readonly ServedRoot[], file: TabFile): string | null {
    const dir = served.find((root) => root.key === file.root)?.dir;
    if (dir === undefined) return null;
    const path = file.path.split('/').filter(Boolean).join('/');
    return joinPath(dir, path);
}

/**
 * The repository holding a tab's file and the file's path in it, or null for none. A file that is
 * a repository's own folder is not a file of that repository, so that repository is left out.
 */
export function repoOfFile(
    served: readonly ServedRoot[],
    file: TabFile,
    repositories: readonly string[]
): RepoFile | null {
    const target = wholePath(served, file);
    if (target === null) return null;
    const holders = repositories.filter((root) => pathUnder(root, target) !== '');
    const found = deepestHolding(holders, (root) => root, target);
    return found === null ? null : { root: found.item, path: found.path };
}

/**
 * The tab a repository's file opens in: the served root holding it most closely and the path under
 * that root, or null when no served root holds it and the file routes could not read it.
 */
export function tabOfFile(served: readonly ServedRoot[], file: RepoFile): TabFile | null {
    const target = joinPath(file.root, file.path);
    const holders = served.filter((root) => pathUnder(root.dir, target) !== '');
    const found = deepestHolding(holders, (root) => root.dir, target);
    return found === null ? null : { root: found.item.key, path: found.path };
}

/**
 * How long ago a moment was, in the largest unit that is at least one, counted by
 * data/helpers/dates.ts's ago up to years. Nothing for a moment that cannot be read or lies more
 * than a minute in the future.
 */
export function ago(iso: string, now: number = Date.now()): string {
    const told = countAgo(iso, now, 'year');
    if (told === null) return '';
    if (told.unit === 'now') return t('repositories.ago_now');
    return counted(told.unit, told.count);
}

/** A count of one unit ago, in the unit's singular for one and its plural otherwise. */
function counted(unit: Exclude<AgoUnit, 'now'>, count: number): string {
    if (unit === 'minute') {
        return count === 1 ? t('repositories.ago_minute') : t('repositories.ago_minutes', count);
    }
    if (unit === 'hour') {
        return count === 1 ? t('repositories.ago_hour') : t('repositories.ago_hours', count);
    }
    if (unit === 'day') {
        return count === 1 ? t('repositories.ago_day') : t('repositories.ago_days', count);
    }
    if (unit === 'week') {
        return count === 1 ? t('repositories.ago_week') : t('repositories.ago_weeks', count);
    }
    if (unit === 'month') {
        return count === 1 ? t('repositories.ago_month') : t('repositories.ago_months', count);
    }
    return count === 1 ? t('repositories.ago_year') : t('repositories.ago_years', count);
}

/** What one blamed line carries: its gutter words and its hover words. */
export type BlameWords = { gutter: string; title: string };

/** A blamed line's gutter words (the author and how long ago) and its hover words. */
export function blameWords(line: GitBlameLine, now: number = Date.now()): BlameWords {
    if (line.uncommitted) {
        const words = t('repositories.blame_uncommitted');
        return { gutter: words, title: words };
    }
    return {
        gutter: t('repositories.blame_gutter', line.author, ago(line.when, now)),
        title: t('repositories.blame_title', line.short, line.subject, line.when.slice(0, 10))
    };
}

/** What the status bar says for the caret's line while blame is on. */
export function blameStatus(line: GitBlameLine | undefined, now: number = Date.now()): string {
    if (line === undefined) return '';
    if (line.uncommitted) return t('repositories.blame_uncommitted');
    return t('repositories.blame_status', line.author, ago(line.when, now), line.subject);
}

/** A blamed line as the editor's line-number column draws it: its words, hover and commit. */
export type BlameRow = { line: number; words: string; title: string; commit: string };

/**
 * The blame as the editor's rows: the gutter words on the first line of each run and on no other,
 * the hover words on every line, and the commit, the empty string for a line no commit holds.
 */
export function blameRows(lines: readonly GitBlameLine[], now: number = Date.now()): BlameRow[] {
    const starts = blameStarts(lines);
    return lines.map((line) => {
        const words = blameWords(line, now);
        return {
            line: line.line,
            words: starts.has(line.line) ? words.gutter : '',
            title: words.title,
            commit: line.uncommitted ? '' : line.hash
        };
    });
}

/** The words a quick diff mark says, which name what it marks and that a press opens it. */
export function markWords(mark: { kind: GitLineMark['kind']; start: number }): string {
    if (mark.kind === 'added') return t('repositories.mark_added', mark.start);
    if (mark.kind === 'deleted') return t('repositories.mark_deleted', mark.start);
    return t('repositories.mark_modified', mark.start);
}

/** The mark each line of a file draws, by line from one: added, modified, or a deletion above. */
export type LineMark = { kind: GitLineMark['kind']; start: number };

/**
 * The gutter mark of every line a mark touches, by line number. An added or modified run marks
 * each of its lines; a deletion marks the line it sits before with a wedge at its top, or the last
 * line, with a wedge at its foot, for a deletion at the end of the file. `start` is the first line
 * of the mark, which is where the diff pane opens.
 */
export function marksByLine(marks: readonly GitLineMark[], lines: number): Map<number, LineMark> {
    const byLine = new Map<number, LineMark>();
    for (const mark of marks) {
        if (mark.kind === 'deleted') {
            const line = Math.min(Math.max(1, mark.line), Math.max(1, lines));
            byLine.set(line, { kind: 'deleted', start: mark.line });
            continue;
        }
        for (let line = mark.line; line < mark.line + mark.count; line += 1) {
            byLine.set(line, { kind: mark.kind, start: mark.line });
        }
    }
    return byLine;
}

/**
 * The lines where a run of lines from one commit starts, which is where the gutter writes the
 * blame's words; the lines under them in the same run draw the run's bar alone, so a block written
 * in one commit reads as one block.
 */
export function blameStarts(lines: readonly GitBlameLine[]): Set<number> {
    const starts = new Set<number>();
    let before = '';
    for (const line of lines) {
        const key = line.uncommitted ? '' : line.hash;
        if (line.line === 1 || key !== before || starts.size === 0) starts.add(line.line);
        before = key;
    }
    return starts;
}
