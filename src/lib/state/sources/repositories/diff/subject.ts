// Layer 2, client state. The identity of a diff pane: what it is over (a file under a root, a
// worktree, a commit's change to a file, a stash, a change group, the files between two refs, a
// file of a linked worktree against the main worktree's, a comparison of two files, a source tab's
// save conflict, an app source control's original, a pending Refactor Preview), the state the pane
// keeps in its tab and reads back, and the address its text is read from. The addresses of the
// reads themselves are repositories.ts's.

import { z } from 'zod';
import { compareUrl, savedUrl, type ReplacePreview } from '../../../../data/file-ops.ts';
import { fileBytesUrl } from '../../../../data/helpers/files/address.ts';
import { anyNumberShape, readAs } from '../../../../data/shapes/shapes.ts';
import { replacePreviewShape } from '../replace-preview.ts';
import { commitUrl, fileDiffUrl, stashUrl, worktreeDiffUrl } from '../repositories.ts';
import { refCompareUrl, workspaceUrl } from './compare.ts';
import { refactorShape, type RefactorSubject } from './refactor-subject.ts';

/**
 * What one diff pane is over: a file under a root, staged or not; a whole worktree; one commit's
 * change to a file (`commit`); a whole stash (`stash`); every path of a change group (`group`); the
 * files between a ref and a commit (`compare`); or one file of a linked worktree against the main
 * worktree's (`workspace`). `against` is the file selected for compare, which makes the pane the
 * comparison of two files: the file at `root` and `path` on the right and `against` on the left.
 * `unsaved` is the instance id of a source tab, which makes the pane the comparison of that tab's
 * file as the disk holds it (left) with the tab's own text (right, editable): the tab's save
 * conflict. `original` names a source control of an app whose quick diff gives the file's original,
 * which makes the pane the comparison of the file as the disk holds it (right) with the text the
 * control gives as its original (left). `refactor` names the pending Refactor Preview, which makes
 * the pane the comparison of one of its files with the file as the checked edits would leave it.
 * `line` is the line of the new side the pane opens at, 0 for its top. `session` is the id of the
 * session record the pane was opened for, empty or absent for a pane opened from the Repositories
 * view.
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
    /** The original an app's source control gives the file, for the pane over the file and it. */
    original?: { app: string; id: string };
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
    if (subject.original !== undefined)
        return `source@${subject.original.app}:${subject.original.id}`;
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

/** The source control of an app whose original the pane shows: the app and the control. */
const originalShape = z.object({ app: z.string().min(1), id: z.string().min(1) });

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
        original: originalShape.optional().catch(undefined),
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
            original: undefined,
            line: 0,
            session: ''
        }
    );
}

/**
 * The address one diff pane reads, by what it is over. A Replace Preview is no address: it is read
 * by the POST `diffRequest` of answers.ts makes. A save conflict's address is the file route's,
 * which answers the left side's text; the right side is the source tab's draft. The comparison
 * with an app's original reads the file from the same route, as its right side.
 */
export function diffUrl(state: DiffSubject): string {
    if ((state.unsaved ?? '') !== '' || state.original !== undefined) {
        return fileBytesUrl(state.root, state.path);
    }
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
        state.original === undefined &&
        state.against === undefined
    );
}
