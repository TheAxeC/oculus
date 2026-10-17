// Layer 2, client state. What the Repositories view computes rather than draws: the addresses of
// the reads it asks for on demand (a diff, a Replace Preview, a page of the graph, a commit's
// files, a blame, the gutter marks, the three versions of a conflict), which repository one view
// shows with which of its sections closed and in which mode, the rows its keyboard moves along, the
// colour and word of a status letter both change lists draw, what the commit box's one button is,
// and the words of the questions the sync, pull, push and publish controls ask.
//
// The worktrees' names, planned paths and Open Worktree are worktrees.ts's, and the identity of a
// diff pane is diff/subject.ts's. Nothing here fetches: the view owns its own requests, and these
// are the strings they are made from.
//
// `repoShape` answers which of six shapes a root is (`unplaced`, `reading`, `missing`, `none`,
// `failed`, `readable`) for the Changes panel and the Repositories view alike. The Repositories
// list holds repositories only, one row each (`repositoryGroups`): the roots of the workspace that
// are repositories (the file browser's roots, the repositories below them down to
// `repository_scan_depth` levels, the cloned folders), identified by their top folder, so a folder
// inside another repository is not a second row. A session's workspace has no row of its own.

import type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
    GitGraphRange,
    GitLineMark,
    GitMergeSides,
    GitStash,
    GitState,
    GitTag
} from '../../../data/model/index.ts';
import { z } from 'zod';
import { fieldItemsShape, mapOfShape, mapShape, readAs } from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';

export { validName, worktreePath } from '../../../data/helpers/worktrees.ts';

export type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
    GitGraphRange,
    GitLineMark,
    GitMergeSides,
    GitStash,
    GitTag
};

/** An address on /api/git, from its parameters in order. */
function gitUrl(parameters: Record<string, string>): string {
    return `/api/git?${new URLSearchParams(parameters).toString()}`;
}

/** The endpoint a page of the graph is read from, `skip` commits in. */
export function graphUrl(root: string, skip: number): string {
    return gitUrl({ graph: root, skip: String(skip) });
}

/** The endpoint one commit's changed files are read from, or its diff of one of them. */
export function commitUrl(root: string, hash: string, path = ''): string {
    return gitUrl(path === '' ? { commit: hash, root } : { commit: hash, root, path });
}

/** The endpoint a stash's diff is read from. */
export function stashUrl(root: string, ref: string): string {
    return gitUrl({ stash: ref, root });
}

/**
 * The endpoint a file's blame is read from: the worktree's file, or with `stage` the last commit's
 * version (`head`) or the staged text (`index`).
 */
export function blameUrl(root: string, path: string, stage?: 'head' | 'index'): string {
    return gitUrl(stage === undefined ? { blame: root, path } : { blame: root, path, stage });
}

/**
 * The endpoint a tracked file is read from as HEAD or the index holds it: `stage` is `head` for the
 * last commit's version and `index` for the staged one. The path is read literally.
 */
export function headUrl(root: string, path: string, stage: 'head' | 'index'): string {
    return gitUrl({ head: root, path, stage });
}

/** The endpoint the refs a picker lists (branches, remote branches, tags) are read from. */
export function refsUrl(root: string): string {
    return gitUrl({ refs: root });
}

/** The endpoint a file's gutter marks are read from. */
export function marksUrl(root: string, path: string): string {
    return gitUrl({ marks: root, path });
}

/** The endpoint the three versions of a conflicted path are read from. */
export function sidesUrl(root: string, path: string): string {
    return gitUrl({ sides: root, path });
}

/** The endpoint one file's diff is read from, staged or from the worktree. */
export function fileDiffUrl(root: string, path: string, staged: boolean): string {
    const parameters = new URLSearchParams({
        diff: root,
        path,
        staged: staged ? '1' : '0'
    });
    return `/api/git?${parameters.toString()}`;
}

/**
 * The endpoint a worktree's diff against its repository's branch is read from. The repository is
 * named beside the worktree: a worktree of the hub is a root of its own on the `git` channel, so
 * the server never works the repository out from the path.
 */
export function worktreeDiffUrl(root: string, path: string): string {
    return `/api/git?${new URLSearchParams({ worktree: path, root }).toString()}`;
}

/** The paths a change group holds, as the git state lists them, for the group's diff pane. */
export function groupPaths(git: GitState, group: 'staged' | 'changed'): string[] {
    return (group === 'staged' ? git.staged : git.unstaged).map((entry) => entry.path);
}

/**
 * The old path of a renamed or copied file of a change group, as the git state lists the entry, or
 * the empty string: a group's diff reads each path alone, which shows a renamed file as created.
 */
export function groupFrom(git: GitState | null, group: 'staged' | 'changed', path: string): string {
    if (git === null) return '';
    const entries = group === 'staged' ? git.staged : git.unstaged;
    return entries.find((entry) => entry.path === path)?.from ?? '';
}

/**
 * Whether a group's diff has to wait for the `git` channel: a pane restored with the layout
 * mounts before the channel's first payload, when no repository is known yet and its paths are
 * not either.
 */
export function groupWaits(git: GitState | null, roots: readonly string[]): boolean {
    return git === null && roots.length === 0;
}

/**
 * The answers of `read` over `items`, in the order of the items, with at most `limit` reads
 * running at once.
 */
export async function readAll<T, R>(
    items: readonly T[],
    limit: number,
    read: (item: T) => Promise<R>
): Promise<R[]> {
    const answers = new Array<R>(items.length);
    let next = 0;
    const worker = async (): Promise<void> => {
        while (next < items.length) {
            const at = next;
            next += 1;
            answers[at] = await read(items[at]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return answers;
}

/** How a diff pane lays its two sides out, kept per pane. */
export type DiffMode = 'side' | 'inline';

/**
 * A diff pane's own remembered choices: its layout; whether the unchanged runs of every file are
 * folded; the files folded to their header, by the key `fileKeys` gives; and each file's diff
 * editor view state (the unchanged runs the reader revealed and the scroll), by the file's path,
 * as Monaco's `saveViewState` gives it and `restoreViewState` takes it back.
 */
export type DiffView = {
    mode: DiffMode;
    views: Record<string, object>;
    unchanged: 'folded' | 'shown';
    folded: string[];
};

/** A diff pane's remembered choices as the instance state stores them, each one repaired alone. */
const diffViewShape = z.object({
    mode: z.enum(['side', 'inline']).catch('side'),
    views: mapOfShape(mapShape).catch(() => ({})),
    unchanged: z.enum(['folded', 'shown']).catch('folded'),
    folded: fieldItemsShape
});

/**
 * A diff pane's remembered choices, every field defaulted: side by side, the unchanged runs
 * folded, no file folded, no view state. A view state that is not an object is dropped, and so is
 * one keyed to a path not among `paths`, the files of the diff, when they are given; a folded file
 * not among them is dropped the same way.
 */
export function diffViewOf(state: unknown, paths?: readonly string[]): DiffView {
    const held = readAs(diffViewShape, state) ?? {
        mode: 'side' as const,
        views: {},
        unchanged: 'folded' as const,
        folded: []
    };
    const among = (path: string): boolean => paths === undefined || paths.includes(path);
    return {
        ...held,
        views: Object.fromEntries(Object.entries(held.views).filter(([path]) => among(path))),
        folded: held.folded.filter(among)
    };
}

/** The folded files with `key` folded if it was open and opened if it was folded. */
export function toggleFolded(folded: readonly string[], key: string): string[] {
    return folded.includes(key) ? folded.filter((one) => one !== key) : [...folded, key];
}

/** The folded files without `key`, which a step onto its change opens. */
export function unfolded(folded: readonly string[], key: string): string[] {
    return folded.filter((one) => one !== key);
}

/** The mode git's head lines give after `prefix`, or null where no line starts with it. */
function modeAfter(file: Pick<DiffSides, 'head'>, prefix: string): string | null {
    const line = file.head.find((one) => one.startsWith(prefix));
    return line === undefined ? null : line.slice(prefix.length).trim();
}

/** The words a side of a git mode is: a symbolic link (120000), a submodule (160000), a file. */
function typeWords(mode: string): string {
    if (mode === '120000') return t('repositories.diff_type_link');
    if (mode === '160000') return t('repositories.diff_type_submodule');
    return t('repositories.diff_type_file');
}

/**
 * What a file whose type changed says above its diff: which side is the old type and which the
 * new, read from the modes of the deletion and the creation the server joins it from (a file
 * turned into a symbolic link reads `the file's text` on the left and `the symbolic link's target`
 * on the right). The inline diff has no left and right, so there the old type is in the removed
 * lines and the new one in the added lines. The empty string for a file whose type stayed.
 */
export function typeChangeWords(file: Pick<DiffSides, 'head'>, mode: DiffMode): string {
    const from = modeAfter(file, 'deleted file mode ');
    const to = modeAfter(file, 'new file mode ');
    if (from === null || to === null) return '';
    return mode === 'inline'
        ? t('repositories.diff_type_changed_inline', typeWords(from), typeWords(to))
        : t('repositories.diff_type_changed', typeWords(from), typeWords(to));
}

/**
 * Whether git's head lines for a file say the diff deletes it, so it is not on disk to open; a
 * path whose type changed is deleted and created again, and is on disk.
 */
export function fileDeleted(file: Pick<DiffSides, 'head'>): boolean {
    return (
        modeAfter(file, 'deleted file mode ') !== null && modeAfter(file, 'new file mode ') === null
    );
}

/**
 * The key of each file of a diff, for its section, its view state and its models: its path (the
 * old one for a deleted file), and for a path the diff lists again, the path, a NUL and its place
 * among that path's entries (`x`, then `x` NUL `2`), so no two sections share a key. No git path
 * holds a NUL, so the key of an entry listed again never equals another file's path.
 */
export function fileKeys(files: readonly DiffSides[]): string[] {
    const seen = new Map<string, number>();
    return files.map((file) => {
        const path = file.newPath === '' ? file.oldPath : file.newPath;
        const place = (seen.get(path) ?? 0) + 1;
        seen.set(path, place);
        return place === 1 ? path : `${path}\0${String(place)}`;
    });
}

/**
 * What keeps a diff pane's view states: `viewed` says one, `keep` writes those said so far, and
 * `close` ends the keeping when the pane is torn down, told whether its tab is still open.
 */
export type ViewKeeper = {
    viewed: (key: string, state: object) => void;
    keep: () => void;
    close: (open: () => boolean) => void;
};

/**
 * The keeping of a diff pane's view states: those its editors say within `after` milliseconds
 * are written in one write over what `read` gives, through `write`. At `close`, a pane whose tab
 * is still open (a page switch, a tab moved, a split changed) writes what is pending, and each
 * view state its editors say as they are torn down after it is written at once, so the reopened
 * pane shows the last scroll and caret. A pane whose tab has closed writes nothing again: its
 * instance state is gone with the tab, and an editor torn down after it would write it back.
 */
export function viewKeeper(
    read: () => unknown,
    write: (state: DiffView) => void,
    after: number
): ViewKeeper {
    let pending: Record<string, object> = {};
    let timer: ReturnType<typeof setTimeout> | null = null;
    // Open while the pane is drawn; `torn` once it is torn down with its tab open, `gone` with it
    // closed.
    let phase: 'open' | 'torn' | 'gone' = 'open';
    function keep(): void {
        if (phase === 'gone') return;
        if (timer !== null) clearTimeout(timer);
        timer = null;
        if (Object.keys(pending).length === 0) return;
        const now = diffViewOf(read());
        write({ ...now, views: { ...now.views, ...pending } });
        pending = {};
    }
    return {
        viewed(key, state) {
            if (phase === 'gone') return;
            pending = { ...pending, [key]: state };
            if (phase === 'torn') keep();
            else timer ??= setTimeout(keep, after);
        },
        keep,
        close(open) {
            if (open()) {
                keep();
                phase = 'torn';
                return;
            }
            phase = 'gone';
            if (timer !== null) clearTimeout(timer);
            timer = null;
            pending = {};
        }
    };
}

/** Whether two lists of git's line changes are the same changes, both absent included. */
function sameChanges(a: DiffSides['changes'], b: DiffSides['changes']): boolean {
    if (a === undefined || b === undefined) return a === b;
    const numbers = (changes: NonNullable<DiffSides['changes']>): string =>
        changes
            .map((one) =>
                [
                    one.originalStartLineNumber,
                    one.originalEndLineNumber,
                    one.modifiedStartLineNumber,
                    one.modifiedEndLineNumber
                ].join(',')
            )
            .join(' ');
    return numbers(a) === numbers(b);
}

/** Whether two answers of a diff read hold the same files, so a re-read keeps the view state. */
export function sameFiles(a: readonly DiffSides[], b: readonly DiffSides[]): boolean {
    return (
        a.length === b.length &&
        a.every(
            (file, at) =>
                file.oldPath === b[at].oldPath &&
                file.newPath === b[at].newPath &&
                file.binary === b[at].binary &&
                file.encoded === b[at].encoded &&
                file.original === b[at].original &&
                file.modified === b[at].modified &&
                file.head.join('\n') === b[at].head.join('\n') &&
                sameChanges(file.changes, b[at].changes)
        )
    );
}

/**
 * What one Repositories view keeps about itself across a tab switch and a saved page: the
 * repository it shows, the sections and folders the reader closed, the commit of the graph whose
 * files are open (the empty string for none), whether the change groups are lists or trees, a
 * request to open the Branches section, which the repository answers and clears, and the roots the
 * reader closed (Close Repository), which this view's list leaves out and Reopen Closed
 * Repositories brings back, and the change rows the reader selected, whose controls act on them
 * together.
 */
export type RepositoriesView = {
    root: string;
    collapsed: string[];
    commit: string;
    mode: 'list' | 'tree';
    reveal: '' | 'branches';
    closed: string[];
    /** The ids of the change rows selected, `change:<group>:<path>`. */
    picked: string[];
    /** The key of the app source control the view shows in place of a repository, or empty. */
    source: string;
};

const repositoriesViewShape = z.object({
    root: z.string().catch(''),
    collapsed: fieldItemsShape,
    commit: z.string().catch(''),
    mode: z.enum(['list', 'tree']).catch('list'),
    reveal: z.enum(['', 'branches']).catch(''),
    closed: fieldItemsShape,
    picked: fieldItemsShape,
    source: z.string().catch('')
}) satisfies z.ZodType<RepositoriesView>;

/**
 * The Repositories view's instance state, every field defaulted, so a state from any source draws.
 */
export function repositoriesViewOf(state: unknown): RepositoriesView {
    return (
        readAs(repositoriesViewShape, state) ?? {
            root: '',
            collapsed: [],
            commit: '',
            mode: 'list',
            reveal: '',
            closed: [],
            picked: [],
            source: ''
        }
    );
}

/** The roots a view draws: the channel's, in its order, without the ones the view has closed. */
export function visibleRoots(roots: readonly string[], closed: readonly string[]): string[] {
    return roots.filter((root) => !closed.includes(root));
}

/** The view with one more root closed; a root closed already stays closed once. */
export function closeRepository(view: RepositoriesView, root: string): RepositoriesView {
    return view.closed.includes(root) ? view : { ...view, closed: [...view.closed, root] };
}

/** The view with every root of `roots` but `root` closed, those it had closed already included. */
export function closeOthers(
    view: RepositoriesView,
    roots: readonly string[],
    root: string
): RepositoriesView {
    const closed = new Set([...view.closed, ...roots.filter((one) => one !== root)]);
    closed.delete(root);
    return { ...view, closed: [...closed] };
}

/** The view with one closed root reopened, or with every one for `*`. */
export function reopenRepositories(view: RepositoriesView, root: string): RepositoriesView {
    return { ...view, closed: root === '*' ? [] : view.closed.filter((one) => one !== root) };
}

/**
 * One repository of the list: its top folder (the real path git prints, or the root itself for a
 * root whose read gave none), the root that shows it, and every root of the `git` channel that is
 * the same repository, in the channel's order.
 */
export type RepositoryGroup = {
    top: string;
    shown: string;
    /**
     * The top folder in the spelling of the roots, the folder the repository's state paths join.
     */
    base: string;
    roots: string[];
    listed: boolean;
};

/**
 * The folder with every symbolic link resolved, for a root that lies in a served root: the served
 * root's real folder in place of its configured one. A root outside every served root is as it is.
 */
export function realRoot(root: string, served: readonly { dir: string; real?: string }[]): string {
    for (const one of served) {
        const real = one.real ?? one.dir;
        if (root === one.dir) return real;
        if (root.startsWith(`${one.dir}/`)) return real + root.slice(one.dir.length);
    }
    return root;
}

/**
 * The top folder in the spelling of the root that shows the repository: the root itself when it is
 * the top, else the root with the folders below the top taken off, and the root when its real path
 * does not lie under the top.
 */
function baseOf(shown: string, top: string, real: (root: string) => string): string {
    const whole = real(shown);
    if (whole === top || top === shown) return shown;
    if (!whole.startsWith(`${top}/`)) return shown;
    return shown.slice(0, shown.length - (whole.length - top.length));
}

/**
 * The repositories the list holds, in the channel's order. A repository is identified by its top
 * folder, so roots with one top are one repository (a folder inside a repository that is a
 * workspace folder of its own, a root spelled through a link), shown by the root whose real path is
 * the top when there is one and by the first of them otherwise. A root whose read gave no top is a
 * repository of its own. A root that is no repository or is gone has no row, and neither has a
 * repository only a session's workspace names: the server marks the roots of the workspace
 * (`inWorkspace`), and a repository is listed when one of its roots is marked. A linked worktree of
 * a listed repository (an agent's worktree under the hub) has no row either, since it is shown in
 * that repository's Worktrees section, as VS Code's Source Control shows it. A repository whose
 * read failed keeps its row, and a root the channel names with no state at all is dropped. With
 * `which` set to `all` the repositories only a session names are returned too (`listed` false),
 * shown by the same rule, for a reader that follows a file into whatever repository holds it.
 */
export function repositoryGroups(
    roots: readonly string[],
    stateOf: (root: string) => GitState | null,
    real: (root: string) => string,
    which: 'listed' | 'all' = 'listed'
): RepositoryGroup[] {
    const groups: {
        top: string;
        shown: string;
        roots: string[];
        listed: boolean;
        topped: boolean;
    }[] = [];
    for (const root of roots) {
        const state = stateOf(root);
        const shape = repoShape(root, state);
        if (state === null || (shape !== 'readable' && shape !== 'failed')) continue;
        const top = state.top === '' ? root : state.top;
        const held = groups.find((one) => one.topped && one.top === state.top);
        if (held === undefined) {
            groups.push({
                top,
                shown: root,
                roots: [root],
                listed: state.inWorkspace,
                topped: state.top !== ''
            });
            continue;
        }
        held.roots.push(root);
        held.listed ||= state.inWorkspace;
    }
    // A linked worktree names its main worktree in its own list; it is that repository's
    // worktree, so it leaves the list when that repository is listed.
    const listedTops = new Set(groups.filter((group) => group.listed).map((group) => group.top));
    for (const group of groups) {
        const main = stateOf(group.roots[0])?.worktrees.find((one) => one.main);
        if (main !== undefined && real(main.path) !== group.top && listedTops.has(real(main.path)))
            group.listed = false;
    }
    return groups
        .filter((group) => group.listed || which === 'all')
        .map(({ top, roots: members, listed }) => {
            const own = listed
                ? members.filter((one) => stateOf(one)?.inWorkspace === true)
                : members;
            const shown = own.find((one) => real(one) === top) ?? own[0];
            return { top, shown, base: baseOf(shown, top, real), roots: members, listed };
        });
}

/**
 * The root that shows the repository a root belongs to, or null when the root is none of the list's
 * repositories: what a saved root of a Repositories tab, a file's root and a counted root come to.
 */
export function shownFor(groups: readonly RepositoryGroup[], root: string): string | null {
    return groups.find((group) => group.roots.includes(root))?.shown ?? null;
}

/**
 * A Repositories tab's instance state over the repositories of the list: every root it names, the
 * one it shows and the ones it closed, as the root that shows its repository. A root that has no
 * row of its own (a folder inside a repository, a session's workspace) stands for the repository
 * it belongs to when one is listed; a closed name that is none is dropped, and a shown root that is
 * none is left for `shownRoot`, which hands the view to the first repository.
 */
export function listedView(
    saved: RepositoriesView,
    groups: readonly RepositoryGroup[]
): RepositoriesView {
    const closed = saved.closed
        .map((root) => shownFor(groups, root))
        .filter((root) => root !== null);
    return {
        ...saved,
        root: shownFor(groups, saved.root) ?? saved.root,
        closed: [...new Set(closed)]
    };
}

/**
 * The roots a file is looked up in: the root that shows each repository git read without an error,
 * the ones only a session names included. A file inside a second root of one repository is then a
 * file of that repository under the root that shows it, with its path from there, which is how the
 * Repositories list and the file browser's marks name it.
 */
export function readableRepositoryRoots(
    groups: readonly RepositoryGroup[],
    stateOf: (root: string) => GitState | null
): string[] {
    return groups.flatMap(({ shown }) => {
        const held = stateOf(shown);
        return held !== null && held.repository && held.error === null ? [shown] : [];
    });
}

/**
 * The root the view draws: the one it keeps while the picker offers it, and the first one the
 * picker offers otherwise, so a root the channel has dropped hands the view to another one rather
 * than to nothing. A root whose folder was deleted and one whose read failed are both still
 * offered, so the reader's pick survives either. The empty string while there is none.
 */
export function shownRoot(roots: string[], kept: string): string {
    return roots.includes(kept) ? kept : (roots[0] ?? '');
}

/**
 * The name each root is picked by: the last folder of its repository's top, and as many folders
 * more as tell it from every other root's. Roots whose tops are the same folder, such as two
 * folders inside one repository, are told apart the same way by their own paths, so no row is
 * named by a whole path its pane cuts to the start every path shares. A root with no top is named
 * by its own path.
 */
export function repositoryLabels(
    roots: string[],
    stateOf: (root: string) => GitState | null
): Record<string, string> {
    const placeOf = (root: string): string => {
        const top = stateOf(root)?.top ?? '';
        return top === '' ? root : top;
    };
    const parts = (path: string): string[] => path.split('/').filter((part) => part !== '');
    const tail = (path: string, count: number): string =>
        parts(path).slice(-count).join('/') || path;
    /** The shortest tail of `path` no other path of `paths` ends in, or the whole path. */
    const shortest = (path: string, paths: string[]): string => {
        for (let count = 1; count <= parts(path).length; count += 1) {
            const mine = tail(path, count);
            if (paths.every((other) => other === path || tail(other, count) !== mine)) return mine;
        }
        return path;
    };
    const tops = roots.map(placeOf);
    const labels: Record<string, string> = {};
    roots.forEach((root, at) => {
        const top = tops[at];
        const sharing = roots.filter((_, other) => tops[other] === top);
        labels[root] =
            sharing.length > 1
                ? shortest(root, sharing)
                : shortest(
                      top,
                      tops.filter((other) => other !== top)
                  );
    });
    return labels;
}

/**
 * Whether the repository has no commit yet: a branch is checked out, git read it without an error,
 * and neither the log nor the branch listing names anything. Both are asked, since a listing that
 * failed also comes back empty on a repository with commits, while its log does not.
 */
export function noCommitYet(git: GitState): boolean {
    return (
        git.error === null &&
        git.branch !== '' &&
        !git.detached &&
        git.log.length === 0 &&
        git.branches.length === 0
    );
}

/**
 * The message git prepared for the commit that ends the operation in progress: a merge's or a
 * cherry pick's, and the empty string for any other state, a rebase's included.
 */
export function preparedMessage(git: GitState): string {
    return git.sequence === 'merging' || git.sequence === 'cherry-picking' ? git.mergeMessage : '';
}

/**
 * The change groups whose list was cut to its first 200 entries: those holding more than the
 * state shows, in the order they are drawn.
 */
export function cutGroups(git: GitState): string[] {
    const shown = {
        merge: [git.conflicted.length, git.held.merge],
        staged: [git.staged.length, git.held.staged],
        changed: [git.unstaged.length, git.held.changes],
        untracked: [git.untracked.length, git.held.untracked]
    };
    return Object.entries(shown)
        .filter(([, [drawn, held]]) => held > drawn)
        .map(([group]) => group);
}

/**
 * The colour token each git status letter is drawn in: the Source Control tokens for an added, a
 * modified and a deleted path, which every theme defines, and a hue for the rest.
 */
const STATUS_TONES: Record<string, string> = {
    M: 'scm-modified',
    T: 'scm-modified',
    A: 'scm-added',
    D: 'scm-deleted',
    R: 'violet',
    C: 'violet',
    '?': 'slate'
};

/** The word each git status letter stands for, the last part of its catalog key. */
const STATUS_WORDS: Record<string, string> = {
    M: 'modified',
    A: 'added',
    D: 'deleted',
    R: 'renamed',
    C: 'copied',
    T: 'type_changed',
    '?': 'untracked'
};

/**
 * The word each unmerged pair stands for, VS Code's: both sides modified it, both added it, both
 * deleted it, or one side added or deleted what the other did not.
 */
const CONFLICT_WORDS: Record<string, string> = {
    UU: 'both_modified',
    AA: 'both_added',
    DD: 'both_deleted',
    AU: 'added_by_us',
    UA: 'added_by_them',
    DU: 'deleted_by_us',
    UD: 'deleted_by_them'
};

/** Whether a status is an unmerged pair, which is a conflict. */
export function isConflict(status: string): boolean {
    return status in CONFLICT_WORDS;
}

/** The catalog key of the word one git status stands for, `changed` for any other letter. */
export function statusWordKey(status: string): string {
    const conflict = CONFLICT_WORDS[status] as string | undefined;
    if (conflict !== undefined) return `repositories.conflict_${conflict}`;
    return `repositories.status_${STATUS_WORDS[status] ?? 'changed'}`;
}

/** Git's status code of a renamed file, which a diff's file header draws beside its old path. */
export const RENAMED = 'R';

/** The inline style that colours one git status: its token's text colour. */
export function statusStyle(status: string): string {
    const tone = isConflict(status) ? 'scm-conflict' : (STATUS_TONES[status] ?? 'grey');
    return `--tone-txt: var(--c-${tone}-txt)`;
}

/** How many workspaces the `git` channel's payload names. */
export function workspaceCount(git: Record<string, GitState> | null | undefined): number {
    return Object.keys(git ?? {}).length;
}

/** How many files a repository's state lists as conflicted, staged, changed or untracked. */
export function changeCount(git: GitState): number {
    return git.conflicted.length + git.staged.length + git.unstaged.length + git.untracked.length;
}

/** The upstream the checked-out branch tracks, by name, or the empty string. */
export function upstreamOf(git: GitState): string {
    return git.branches.find((branch) => branch.current)?.upstream ?? '';
}

/**
 * Whether the checked-out branch tracks an upstream that the branch listing has named, which is
 * when Sync has something to sync against. A detached HEAD tracks none.
 */
export function tracksUpstream(git: GitState): boolean {
    return !git.detached && git.upstream === true && upstreamOf(git) !== '';
}

/**
 * Whether Publish Branch is offered: a branch is checked out, git says it tracks nothing, and the
 * repository has a remote to publish it to.
 */
export function canPublish(git: GitState): boolean {
    return (
        !git.detached &&
        git.branch !== '' &&
        git.branch !== 'HEAD' &&
        git.upstream === false &&
        git.remotes.length > 0
    );
}

/**
 * The six things a root's git state comes to on screen, which both git views draw and the Changes
 * panel's branch listing decides on. `readable` is the repository with its branch, its groups and
 * its commit box, a repository with no commit yet among them; the other five are one sentence
 * each. The branch listing is fetched for `readable` and for nothing else.
 *
 * `present`, `repository` and `error` are separate facts on the `git` channel. `present` is false
 * for a folder that is not there and for nothing else, so a workspace whose folder has gone is told
 * from one that is no repository, which both carry `repository` false for. A repository whose read
 * failed carries `error` with `repository` true, so `error` alone does not say a root is no
 * repository, and a workspace the channel has no state for yet says none of it. A session with no
 * workspace names no folder for git to be asked about, which is a sixth thing to say.
 */
export type RepoShape = 'unplaced' | 'reading' | 'missing' | 'none' | 'failed' | 'readable';

/** Which of the six a root and the state the channel carries for it come to. */
export function repoShape(root: string, state: GitState | null): RepoShape {
    if (root === '') return 'unplaced';
    if (state === null) return 'reading';
    if (!state.present) return 'missing';
    if (!state.repository) return 'none';
    return state.error === null ? 'readable' : 'failed';
}

/** The branch a listing marks as checked out, or null where none is (a detached head). */
export function currentBranch<T extends { current: boolean }>(branches: readonly T[]): T | null {
    return branches.find((one) => one.current) ?? null;
}

/**
 * How many lines the commit message field is drawn with: one while it is empty, otherwise its
 * lines, a trailing newline counting the empty line after it, and ten at most. A long line that
 * wraps grows the field further through its own sizing, not through this number.
 */
export function messageRows(message: string): number {
    if (message === '') return 1;
    return Math.min(10, message.split('\n').length);
}

/** The branch a commit would land on, or the empty string for a detached or unnamed head. */
export function checkedOutBranch(git: GitState): string {
    return git.detached || git.branch === 'HEAD' ? '' : git.branch;
}

/**
 * What the commit box's one button is: Commit, Sync Changes, Publish Branch, or Commit disabled.
 */
export type ActionButton = 'commit' | 'sync' | 'publish' | 'none';

/**
 * Which button the commit box draws under its message field. Commit while anything is staged,
 * changed, untracked or unmerged or a merge or rebase is in progress; else Sync Changes when the
 * branch has an upstream it is ahead of or behind; else Publish Branch where the branch can be
 * published; else Commit, disabled.
 */
export function actionButton(git: GitState): ActionButton {
    const anything =
        git.staged.length + git.unstaged.length + git.untracked.length + git.conflicted.length > 0;
    if (anything || git.sequence !== '') return 'commit';
    if (tracksUpstream(git) && git.ahead + git.behind > 0) return 'sync';
    return canPublish(git) ? 'publish' : 'none';
}

/** The question and the sentence under it that a control asks before it writes. */
export type Words = { message: string; detail: string };

/** The Sync question: pull then push the checked-out branch against its upstream. */
export function syncWords(git: GitState): Words {
    return {
        message: t('repositories.sync_confirm', git.branch, upstreamOf(git)),
        detail:
            git.behind === 1
                ? t('repositories.sync_detail_one', git.ahead)
                : t('repositories.sync_detail', git.behind, git.ahead)
    };
}

/** The Pull question. */
export function pullWords(git: GitState): Words {
    return {
        message: t('repositories.pull_confirm', git.branch, upstreamOf(git)),
        detail: t('repositories.pull_detail')
    };
}

/** The Push question. */
export function pushWords(git: GitState): Words {
    return {
        message: t('git.push_confirm', git.branch, upstreamOf(git)),
        detail: git.ahead === 1 ? t('git.push_detail_one') : t('git.push_detail', git.ahead)
    };
}

/** The Publish Branch question, for one remote. */
export function publishWords(git: GitState, remote: string): Words {
    return {
        message: t('repositories.publish_confirm', git.branch, remote),
        detail: t('repositories.publish_detail')
    };
}
