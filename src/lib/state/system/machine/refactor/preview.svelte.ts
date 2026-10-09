// Layer 2, client state. The Refactor Preview: an edit a language server answered that is shown
// before anything is written. The page holds one pending preview. Its files are the files the
// edit's plan read (state/system/machine/lsp/edits.ts), each with its edits and a check per edit,
// all checked at first. Apply makes the checked edits only, through the plan's commit, so a file
// with none checked is not written and the hashes posted are the ones read when the preview
// opened; Discard drops it. Nothing is written while a preview is pending, and no tab is edited.
//
// A second preview while one is pending is held as `incoming` and asked about (the view draws the
// question): Continue makes it the pending one and drops the first, Cancel drops it. A reload
// drops the pending preview with the page's state; nothing was written by it.
//
// Each file's two texts are computed here: the file as the plan read it, and the file with the
// checked edits applied (`sides`). The diff pane of a file reads them (its subject field is
// state/sources/repositories/diff/refactor-subject.ts), and `revision` is what makes it read again
// when a check moves.

import { applyTextEdits, type TextEdit } from '../../../../data/prose/text-edits.ts';
import type { EditPlan, LspEdits, LspEditOutcome, PlannedFile } from '../lsp/edits.ts';

/** The id of the view that draws the pending Refactor Preview. */
export const REFACTOR_VIEW = 'refactor-preview';

/** One file of a preview: the planned file and whether each of its edits is checked. */
export type PreviewFile = PlannedFile & { checked: boolean[] };

/** A preview of one edit. */
export type Preview = {
    /** The preview's identity, which a diff pane names it by. */
    id: string;
    /** The key a rename changes and what it becomes, for a rename of a hub key; else null. */
    rename: { from: string; to: string } | null;
    files: PreviewFile[];
    /** The words the view's title is, when the edit names its own; else null. */
    title: string | null;
};

/** The two texts of one file of a preview, as a diff pane draws them. */
export type PreviewSides = { original: string; modified: string };

/** What the store reads of the page. */
export type RefactorParts = {
    lspEdits: LspEdits;
    /** Show the Refactor Preview view. */
    show: () => void;
};

/** What the reader and the caller ask of an edit. */
type SubmitOptions = {
    /** The reader asked to see the edit before it is made. */
    preview: boolean;
    /** The title the preview is shown under; absent, the rename's or the plain one. */
    title?: string;
    /** Runs once the edit was made. */
    applied: () => Promise<void>;
    /** The sentence of a notice the edit may be refused with, in the catalog's words. */
    words: (notice: string, words: string[]) => string;
};

export type RefactorStore = {
    /** The preview whose edits are shown, or null. */
    pending: () => Preview | null;
    /** A second preview asked while one is pending, which waits for the reader's answer. */
    incoming: () => Preview | null;
    /** The sentence the last Apply was refused with, or the empty string. */
    failed: () => string;
    /** Whether an Apply is writing. */
    applying: () => boolean;
    /**
     * Make an edit a language server asked for. It is planned first, and a refusal of the plan is
     * the outcome. An edit that asks to be confirmed (a change annotation says so), or that the
     * reader asked to preview, is shown and nothing is written, and the outcome is applied at once;
     * any other is made. `applied` runs once the edit was made, here or at an Apply.
     */
    submit: (
        edit: unknown,
        held: ReadonlyMap<string, string>,
        options: SubmitOptions
    ) => Promise<LspEditOutcome>;
    /** Make the checked edits of the pending preview. */
    apply: () => Promise<void>;
    /** Drop the pending preview. */
    discard: () => void;
    /** Make the incoming preview the pending one, dropping the first. */
    continueIncoming: () => void;
    /** Drop the incoming preview and keep the pending one. */
    cancelIncoming: () => void;
    /** Set whether one edit of a file is checked. */
    setEdit: (name: string, index: number, checked: boolean) => void;
    /** Set every edit of a file checked or unchecked. */
    setFile: (name: string, checked: boolean) => void;
    /** A number that changes whenever the preview of that identity changes; 0 for none. */
    revision: (id: string) => number;
    /** The two texts of a file of the pending preview, or null when there is none. */
    sides: (id: string, root: string, path: string) => PreviewSides | null;
};

/** The edits of a file that are checked. */
function checkedEdits(file: PreviewFile): TextEdit[] {
    return file.edits.filter((_, at) => file.checked[at]);
}

type Held = {
    preview: Preview;
    plan: EditPlan;
    applied: () => Promise<void>;
    words: SubmitOptions['words'];
};

export function createRefactor(parts: RefactorParts): RefactorStore {
    let pending = $state.raw<Held | null>(null);
    let incoming = $state.raw<Held | null>(null);
    let failed = $state('');
    let applying = $state(false);
    let revisions = $state.raw<Record<string, number>>({});
    let made = 0;

    /** Note that a preview changed. */
    function touch(id: string): void {
        revisions = { ...revisions, [id]: (revisions[id] ?? 0) + 1 };
    }

    /** Replace the pending preview's files. */
    function mutate(change: (files: PreviewFile[]) => PreviewFile[]): void {
        if (pending === null) return;
        const files = change(pending.preview.files);
        pending = { ...pending, preview: { ...pending.preview, files } };
        touch(pending.preview.id);
    }

    function held(plan: EditPlan, options: SubmitOptions): Held {
        made += 1;
        const files = plan.files.map((file) => ({ ...file, checked: file.edits.map(() => true) }));
        return {
            preview: { id: String(made), rename: plan.rename, files, title: options.title ?? null },
            plan,
            applied: options.applied,
            words: options.words
        };
    }

    return {
        pending: () => pending?.preview ?? null,
        incoming: () => incoming?.preview ?? null,
        failed: () => failed,
        applying: () => applying,
        async submit(edit, heldTexts, options) {
            const planned = await parts.lspEdits.plan(edit, heldTexts);
            if (!planned.ok) return planned.outcome;
            if (!options.preview && !planned.plan.confirm) {
                const outcome = await parts.lspEdits.commit(planned.plan);
                if (outcome.applied) await options.applied();
                return outcome;
            }
            const next = held(planned.plan, options);
            if (pending === null) {
                pending = next;
                failed = '';
            } else incoming = next;
            parts.show();
            return { applied: true };
        },
        async apply() {
            const now = pending;
            if (now === null || applying) return;
            applying = true;
            failed = '';
            try {
                const keep = (name: string, at: number): boolean =>
                    now.preview.files.find((file) => file.name === name)?.checked[at] === true;
                const outcome = await parts.lspEdits.commit(now.plan, keep);
                if (!outcome.applied) {
                    failed = now.words(outcome.notice, outcome.words);
                    return;
                }
                if (pending === now) pending = null;
                await now.applied();
            } finally {
                applying = false;
            }
        },
        discard() {
            pending = null;
            failed = '';
        },
        continueIncoming() {
            if (incoming === null) return;
            pending = incoming;
            incoming = null;
            failed = '';
        },
        cancelIncoming() {
            incoming = null;
        },
        setEdit(name, index, checked) {
            mutate((files) =>
                files.map((file) =>
                    file.name === name
                        ? {
                              ...file,
                              checked: file.checked.map((one, at) => (at === index ? checked : one))
                          }
                        : file
                )
            );
        },
        setFile(name, checked) {
            mutate((files) =>
                files.map((file) =>
                    file.name === name
                        ? { ...file, checked: file.checked.map(() => checked) }
                        : file
                )
            );
        },
        revision: (id) => revisions[id] ?? 0,
        sides(id, root, path) {
            if (pending?.preview.id !== id) return null;
            const file = pending.preview.files.find(
                (one) => one.place.root === root && one.place.path === path
            );
            if (file === undefined) return null;
            const applied = applyTextEdits(file.text, checkedEdits(file));
            return { original: file.text, modified: applied.ok ? applied.text : file.text };
        }
    };
}
