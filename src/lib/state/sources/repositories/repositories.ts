// Layer 2, client state. What the Repositories view computes rather than draws: the addresses of
// the reads it asks for on demand (a diff, a Replace Preview, a page of the graph, a commit's
// files, a blame, the gutter marks, the three versions of a conflict), the identity of a diff pane,
// which repository one view shows with which of its sections closed and in which mode, the rows its
// keyboard moves along, the colour and word of a status letter both change lists draw, what the
// commit box's one button is, and the words of the questions the sync, pull, push and publish
// controls ask.
//
// The worktrees' names, planned paths and Open Worktree are worktrees.ts's. Nothing here fetches:
// the view owns its own requests, and these are the strings they are made from.
//
// `repoShape` answers which of six shapes a root is (`unplaced`, `reading`, `missing`, `none`,
// `failed`, `readable`) for the Changes panel and the Repositories view alike. The Repositories
// list is over every root the `git` channel carries a state for (`pickerRoots`), the file browser's
// roots, the repositories below them down to `repository_scan_depth` levels and every session's
// workspace, not only the repositories among them.

import type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
    GitLineMark,
    GitMergeSides,
    GitStash,
    GitState,
    GitTag
} from '../../../data/model/index.ts';
import { z } from 'zod';
import { compareUrl, savedUrl, type ReplacePreview } from '../../../data/file-ops.ts';
import { fileBytesUrl } from '../../../data/helpers/files/address.ts';
import {
    anyNumberShape,
    fieldItemsShape,
    mapOfShape,
    mapShape,
    readAs
} from '../../../data/shapes/shapes.ts';
import { t } from '../../shared/words/text.ts';
import { refCompareUrl, workspaceUrl } from './diff/compare.ts';
import { refactorShape, type RefactorSubject } from './diff/refactor-subject.ts';
import { replacePreviewShape } from './replace-preview.ts';

export { validName, worktreePath } from '../../../data/helpers/worktrees.ts';

export type {
    DiffAttributes,
    DiffSides,
    GitBlameLine,
    GitCommitFile,
    GitGraphCommit,
    GitGraphPage,
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

/**
 * What one diff pane is over: a file under a root, staged or not; a whole worktree; one commit's
 * change to a file (`commit`); a whole stash (`stash`); every path of a change group (`group`); the
 * files between a ref and a commit (`compare`); or one file of a linked worktree against the main
 * worktree's (`workspace`). `against` is the file selected for compare, which makes the pane the
 * comparison of two files: the file at `root` and `path` on the right and `against` on the left.
 * `unsaved` is the instance id of a source tab, which makes the pane the comparison of that tab's
 * file as the disk holds it (left) with the tab's own text (right, editable): the tab's save
 * conflict. `refactor` names the pending Refactor Preview, which makes the pane the comparison of
 * one of its files with the file as the checked edits would leave it. `line` is the line of the new
 * side the pane opens at, 0 for its top. `session` is the
 * id of the session record the pane was opened for, empty or absent for a pane opened from the
 * Repositories view.
 */
export type DiffSubject = {
    root: string;
    path: string;
    staged: boolean;
    worktree: boolean;
    commit?: string;
    /** The commit as git abbreviates it (`%h`), which the sentence for a failed read names. */
    short?: string;
    stash?: string;
    /** Every path of a change group, for the diff pane a group head opens; the path is empty. */
    group?: 'staged' | 'changed';
    /** A ref and a commit hash, for the pane over `git diff <from> <to>`; the path is empty. */
    compare?: { from: string; to: string };
    /** The file is read from the main worktree (left) and this worktree (right), both on disk. */
    workspace?: true;
    /** The file selected for compare, for the pane over two files. */
    against?: { root: string; path: string };
    /** The id of a copy in the file's local history, for the pane over the file and that copy. */
    save?: string;
    /** The replacements of a Search tab, for the pane previewing them in the file. */
    replace?: ReplacePreview;
    /** The pending Refactor Preview, for the pane over one of its files. */
    refactor?: RefactorSubject;
    /** The source tab whose unsaved text is the right side, for the pane over a save conflict. */
    unsaved?: string;
    line?: number;
    session?: string;
};

/**
 * One diff pane's state, as the instance carries it. `id` is what makes two panes two instances.
 */
export type DiffState = DiffSubject & { id: string; label: string };

/** Which diff a subject is, the part of its id that is not the root and the path. */
function sideOf(subject: DiffSubject): string {
    if (subject.compare !== undefined) return `ref@${subject.compare.from}...${subject.compare.to}`;
    if (subject.workspace === true) return 'workspace';
    if (subject.against !== undefined)
        return `compare@${subject.against.root}:${subject.against.path}`;
    if ((subject.save ?? '') !== '') return `save@${subject.save ?? ''}`;
    if (subject.replace !== undefined) return 'replace';
    if (subject.refactor !== undefined) return 'refactor';
    if ((subject.unsaved ?? '') !== '') return `unsaved@${subject.unsaved ?? ''}`;
    if ((subject.group ?? '') !== '') return `group@${subject.group ?? ''}`;
    if (subject.worktree) return 'worktree';
    if ((subject.commit ?? '') !== '') return `commit@${subject.commit ?? ''}`;
    if ((subject.stash ?? '') !== '') return `stash@${subject.stash ?? ''}`;
    return subject.staged ? 'staged' : 'changed';
}

/**
 * The instance state a diff pane is opened with. The id names which diff, root and path and, for
 * a file's own diff opened for a session, that session after the side (`changed@<session>:...`),
 * and not the line, so the same file opened twice activates the pane that is already there and
 * points it at the new line, and two files, or one file for two sessions, are two panes. The
 * other diffs (a commit, a stash, a worktree, a compare, a group) take no session, and the
 * session sits in a position no path can reach, so a path that ends in `:<session>` is another id.
 */
export function diffState(subject: DiffSubject, label: string): DiffState {
    const side = sideOf(subject);
    const session = subject.session ?? '';
    const own = side === 'changed' || side === 'staged';
    const place = `${subject.root}:${subject.path}`;
    const id = session !== '' && own ? `${side}@${session}:${place}` : `${side}:${place}`;
    return { ...subject, id, label };
}

/** The file selected for compare: a named root and a path, both filled. */
const againstShape = z.object({ root: z.string().min(1), path: z.string().min(1) });

/** The two sides of a ref compare: a ref and a commit hash, both filled. */
const compareShape = z.object({ from: z.string().min(1), to: z.string().min(1) });

/** The fields of a diff pane's state, each read as itself and otherwise as its empty value. */
const heldDiffShape = z
    .object({
        id: z.string().catch(''),
        label: z.string().catch(''),
        root: z.string().catch(''),
        path: z.string().catch(''),
        staged: z.boolean().catch(false),
        worktree: z.boolean().catch(false),
        commit: z.string().catch(''),
        short: z.string().catch(''),
        save: z.string().catch(''),
        stash: z.string().catch(''),
        group: z.enum(['staged', 'changed']).optional().catch(undefined),
        against: againstShape.optional().catch(undefined),
        compare: compareShape.optional().catch(undefined),
        workspace: z.literal(true).optional().catch(undefined),
        replace: replacePreviewShape.optional().catch(undefined),
        refactor: refactorShape.optional().catch(undefined),
        unsaved: z.string().optional().catch(undefined),
        line: anyNumberShape.catch(0),
        session: z.string().catch('')
    })
    .transform((held): DiffState => held);

/** The diff pane's state out of what an instance carries, each field read defensively. */
export function heldDiff(state: unknown): DiffState {
    return (
        readAs(heldDiffShape, state) ?? {
            id: '',
            label: '',
            root: '',
            path: '',
            staged: false,
            worktree: false,
            commit: '',
            short: '',
            save: '',
            stash: '',
            group: undefined,
            against: undefined,
            compare: undefined,
            workspace: undefined,
            replace: undefined,
            refactor: undefined,
            unsaved: undefined,
            line: 0,
            session: ''
        }
    );
}

/**
 * The address one diff pane reads, by what it is over. A Replace Preview is no address: it is read
 * by the POST `diffRequest` of answers.ts makes. A save conflict's address is the file route's,
 * which answers the left side's text; the right side is the source tab's draft.
 */
export function diffUrl(state: DiffSubject): string {
    if ((state.unsaved ?? '') !== '') return fileBytesUrl(state.root, state.path);
    if (state.against !== undefined) return compareUrl(state, state.against);
    if ((state.save ?? '') !== '') return savedUrl(state, state.save ?? '');
    if (state.compare !== undefined)
        return refCompareUrl(state.root, state.compare.from, state.compare.to);
    if (state.workspace === true) return workspaceUrl(state.root, state.path);
    if (state.worktree) return worktreeDiffUrl(state.root, state.path);
    if ((state.commit ?? '') !== '') return commitUrl(state.root, state.commit ?? '', state.path);
    if ((state.stash ?? '') !== '') return stashUrl(state.root, state.stash ?? '');
    return fileDiffUrl(state.root, state.path, state.staged);
}

/**
 * Whether a diff pane's hunks can be staged, unstaged or reverted: a file's own diff, staged or
 * not, and nothing a commit, a stash, a worktree or a whole group holds.
 */
export function diffActs(state: DiffSubject): boolean {
    return (
        !state.worktree &&
        (state.commit ?? '') === '' &&
        (state.stash ?? '') === '' &&
        (state.group ?? '') === '' &&
        (state.save ?? '') === '' &&
        state.compare === undefined &&
        state.workspace !== true &&
        state.replace === undefined &&
        state.refactor === undefined &&
        (state.unsaved ?? '') === '' &&
        state.against === undefined
    );
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

/** Whether git's head lines for a file say the diff deletes it, so it is not on disk to open. */
export function fileDeleted(file: Pick<DiffSides, 'head'>): boolean {
    return file.head.some((line) => line.startsWith('deleted file mode '));
}

/**
 * The key of each file of a diff, for its section, its view state and its models: its path (the
 * old one for a deleted file), and for a path git lists again, as it does for a type change, the
 * path, a NUL and its place among that path's entries (`x`, then `x` NUL `2`). No git path holds a
 * NUL, so the key of an entry listed again never equals another file's path.
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
                file.head.join('\n') === b[at].head.join('\n')
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
};

const repositoriesViewShape = z.object({
    root: z.string().catch(''),
    collapsed: fieldItemsShape,
    commit: z.string().catch(''),
    mode: z.enum(['list', 'tree']).catch('list'),
    reveal: z.enum(['', 'branches']).catch(''),
    closed: fieldItemsShape,
    picked: fieldItemsShape
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
            picked: []
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
 * The roots the picker offers: every root the `git` channel carries a state for, in the channel's
 * order. A folder of notes, a data folder and a repository whose read failed are offered, each row
 * saying what its state is, so a root never leaves the picker for being quiet and the reader is
 * told why rather than handed another repository. A root that is gone or is no repository is
 * offered only while it is a served root's folder (`served`, the `dir` of each root the server
 * serves): a session's workspace that was deleted or never was a repository is not listed. A root
 * the channel names with no state at all is dropped: there is nothing for a row to say.
 */
export function pickerRoots(
    roots: string[],
    stateOf: (root: string) => GitState | null,
    served: readonly string[]
): string[] {
    return roots.filter((root) => {
        const shape = repoShape(root, stateOf(root));
        if (shape === 'reading') return false;
        return (shape !== 'missing' && shape !== 'none') || served.includes(root);
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
 * The name each root is picked by: its last folder, and the last two where two roots share the last
 * one, and the whole path where they share both.
 */
export function repositoryLabels(roots: string[]): Record<string, string> {
    const tail = (root: string, count: number): string =>
        root
            .split('/')
            .filter((part) => part !== '')
            .slice(-count)
            .join('/') || root;
    const labels: Record<string, string> = {};
    for (const root of roots) {
        const one = tail(root, 1);
        const two = tail(root, 2);
        const sameOne = roots.filter((other) => tail(other, 1) === one).length > 1;
        const sameTwo = roots.filter((other) => tail(other, 2) === two).length > 1;
        labels[root] = !sameOne ? one : !sameTwo ? two : root;
    }
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
        detail: t('repositories.sync_detail', git.behind, git.ahead)
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
        detail: t('git.push_detail', git.ahead)
    };
}

/** The Publish Branch question, for one remote. */
export function publishWords(git: GitState, remote: string): Words {
    return {
        message: t('repositories.publish_confirm', git.branch, remote),
        detail: t('repositories.publish_detail')
    };
}
