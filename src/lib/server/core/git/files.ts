// Layer 2, server. The git forms the file browser and the Status view read a folder by: which
// entries of a listed folder the repository ignores, the paths it tracks under a folder, and the
// commits that touched one file. Every command goes through run.ts.

import type { GitFilePage } from '../../../data/model/index.ts';
import { FILE_LOG_FORMAT, parseFileLog } from './parse.ts';
import {
    HASH,
    NO_REPOSITORY,
    TIMEOUT_MS,
    milliseconds,
    pathInside,
    refused,
    run,
    type Read
} from './run.ts';

/** The most commits one page of the Timeline lists for one file. */
export const FILE_LOG_ENTRIES = 50;

/**
 * The names among `names` that git ignores in the folder, for the file browser's tree. git answers
 * 0 when it named at least one, 1 when it named none and 128 when the folder is in no repository;
 * only 0 carries names, so a folder in no repository, a git that is missing, a run that timed out
 * and one that failed all answer that nothing is ignored. A name is asked for bare: git reads for
 * itself whether it is a folder, so a pattern naming folders alone (`build/`) matches one, and a
 * trailing slash would make git refuse the whole run over a link to a folder. A tracked file is
 * never named, since git does not ignore what it already tracks.
 */
export function ignoredIn(
    root: string,
    names: string[],
    timeout: number = TIMEOUT_MS
): Set<string> {
    const none = new Set<string>();
    if (names.length === 0) return none;
    const input = names.map((name) => `${name}\0`).join('');
    const done = run(root, ['check-ignore', '--stdin', '-z'], milliseconds(timeout), input);
    if (!done.ok) return none;
    const said = new Set(done.text.split('\0').filter((one) => one !== ''));
    return new Set(names.filter((name) => said.has(name)));
}

/**
 * The paths the repository tracks under the folder, relative to it, for the Status view's line
 * counts. `-z` ends each path with a NUL and writes it unquoted, so a name with a space or an
 * accented letter comes back as it is on disk. A folder in no repository, a git that is missing and
 * a run that timed out answer why instead.
 */
export function trackedFiles(root: string, timeout: number = TIMEOUT_MS): Read<string[]> {
    const done = run(root, ['ls-files', '-z'], milliseconds(timeout));
    if (!done.ok) return refused(done.text);
    return { ok: true, value: done.text.split('\0').filter((path) => path !== '') };
}

/**
 * One page of the commits that touched one file, newest first and across its renames and copies
 * (`log --follow --relative -z --name-status --diff-merges=first-parent`), at most
 * FILE_LOG_ENTRIES. Every page is read from the repository's HEAD in git's own order, and the page
 * after the commit `before` is the rows that follow its row, so a merge's second parent and a
 * side-branch commit at a page boundary are listed once and in place. The first page asks git for
 * one row more than a page holds and the 51st only sets `more`; a later page reads the whole log,
 * since git counts a whole `--follow` walk when asked to skip commits and has no option to start
 * after a commit. `--relative` gives every row's `path` and `from` relative to `root`, so a served
 * root below its repository's top reads the paths the commit diff reads. The path follows `--` and
 * GIT_LITERAL_PATHSPECS makes git read it as a name, so a `*` or a `[` in a file name matches that
 * file alone. A `before` that is no hash, or is in no row of the log, is refused, and a hash is
 * checked before git runs so no value reaches git as an option. A folder in no repository and a
 * repository with no commit yet have no commits to list and answer an empty page; any other refusal
 * of git answers its reason.
 */
export function fileLog(
    root: string,
    path: string,
    before?: string,
    timeout: number = TIMEOUT_MS
): Read<GitFilePage> {
    if (!pathInside(root, path)) return refused(`the path ${path} is not inside the repository`);
    if (before !== undefined && !HASH.test(before)) return refused('that is not a commit');
    const done = run(
        root,
        [
            'log',
            '--follow',
            '--relative',
            '-z',
            '--name-status',
            '--diff-merges=first-parent',
            FILE_LOG_FORMAT,
            ...(before === undefined ? [`-${FILE_LOG_ENTRIES + 1}`] : []),
            '--',
            path
        ],
        milliseconds(timeout),
        undefined,
        { GIT_LITERAL_PATHSPECS: '1' }
    );
    if (done.ok) {
        const listed = parseFileLog(done.text, path);
        const at =
            before === undefined ? -1 : listed.findIndex((row) => row.hash.startsWith(before));
        if (before !== undefined && at < 0) return refused('that commit is not in the history');
        const rows = listed.slice(at + 1);
        return {
            ok: true,
            value: {
                commits: rows.slice(0, FILE_LOG_ENTRIES),
                more: rows.length > FILE_LOG_ENTRIES
            }
        };
    }
    const empty =
        done.text.includes(NO_REPOSITORY) || done.text.includes('does not have any commits');
    return empty
        ? { ok: true, value: { commits: [], more: false } }
        : refused(done.text || 'git log failed');
}
