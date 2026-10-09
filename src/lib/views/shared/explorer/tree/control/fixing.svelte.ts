// Layer 3, view partial of tree/Tree.svelte. The folder Fix All of the writing rules: the plan the
// server makes for the files under a folder (POST /api/lint, action `folder`), the boxes the
// reader ticks in ../../WritingFixDialog.svelte, and the write of the ticked files (POST /api/ops
// `writing-fix`), which the server runs all or nothing.
//
// A file the page holds with unsaved text is listed unticked and locked, since the plan was made
// from the file on disk; a file the plan could not check is listed locked with the plan's reason. A
// write the server refuses names the first file that failed its checks: that file is unticked and
// locked with the refusal's sentence, and the reader confirms again. A write that stopped part way
// is told in a notice that names the file it stopped at and how many were written before it;
// History undoes them.

import type { ClientState } from '$lib/state/client/context';
import type { LintFolderFile } from '$lib/state/system/machine/lint/lint-model';
import { refusalSentence, unreachableAnswer } from '$lib/state/shared/answers/answers';
import { nameOf, type TreeRow } from '$lib/state/sources/fs';
import { t } from '$lib/state/shared/words/text';

/** The files a write of the ticked rows posts. */
type WrittenFiles = Parameters<ClientState['explorer']['writingFix']>[0];

/** One file of the dialog: the plan's entry, the box and the sentence beside it. */
export type FixRow = {
    file: LintFolderFile;
    ticked: boolean;
    /** The box cannot be pressed: the file has unsaved text, or the plan or write refused it. */
    locked: boolean;
    /** Why the file is locked, or the empty text. */
    note: string;
};

/** What the dialog draws: planning, a refused folder, or the plan's files. */
export type FixView = {
    root: string;
    /** The folder's path under its root. */
    path: string;
    /** The folder's name, the root's name for a root. */
    label: string;
    phase: 'planning' | 'refused' | 'ready';
    /** The sentence of a refused plan or of a write that could not be made, or the empty text. */
    reason: string;
    rows: FixRow[];
    /** The write is in flight, so the buttons wait. */
    writing: boolean;
};

export type Fixing = {
    view: () => FixView | null;
    /** Read the plan for the folder a row is and open the dialog on it. */
    start: (row: TreeRow, rootName: string) => Promise<void>;
    tick: (path: string, on: boolean) => void;
    /** Write the ticked files. */
    confirm: () => Promise<void>;
    cancel: () => void;
};

/** The files the reader has ticked, in the plan's order. */
export function tickedRows(view: FixView): FixRow[] {
    return view.rows.filter((one) => one.ticked && !one.locked);
}

/** The write the ticked files make: each file's root, path, hash and edits. */
function writeOf(view: FixView): WrittenFiles {
    return tickedRows(view).map((one) => ({
        root: view.root,
        path: one.file.path,
        hash: one.file.hash,
        edits: one.file.edits
    }));
}

export function createFixing(client: ClientState): Fixing {
    let held: FixView | null = $state.raw(null);
    /** The dialog's state as it is now, which an await may have ended. */
    const current = (): FixView | null => held;
    /** The plan being read, so an answer for a dialog that was closed or replaced is dropped. */
    let reading = 0;

    function rowOf(root: string, file: LintFolderFile): FixRow {
        const reason = file.reason ?? '';
        if (reason !== '') return { file, ticked: false, locked: true, note: reason };
        if (client.explorer.unsaved({ root, path: file.path }, false)) {
            return { file, ticked: false, locked: true, note: t('files.writing_fix_unsaved') };
        }
        return { file, ticked: true, locked: false, note: '' };
    }

    async function start(row: TreeRow, rootName: string): Promise<void> {
        const mine = ++reading;
        const label = row.path === '' ? rootName : nameOf(row.path);
        held = {
            root: row.root,
            path: row.path,
            label,
            phase: 'planning',
            reason: '',
            rows: [],
            writing: false
        };
        const plan = await client.lint.folder(row.root, row.path);
        const open = current();
        if (mine !== reading || open === null) return;
        held = plan.ok
            ? { ...open, phase: 'ready', rows: plan.files.map((one) => rowOf(row.root, one)) }
            : {
                  ...open,
                  phase: 'refused',
                  reason: plan.reason === '' ? t('files.writing_fix_failed') : plan.reason
              };
    }

    function tick(path: string, on: boolean): void {
        if (held === null) return;
        held = {
            ...held,
            rows: held.rows.map((one) =>
                one.file.path === path && !one.locked ? { ...one, ticked: on } : one
            )
        };
    }

    function cancel(): void {
        reading += 1;
        held = null;
    }

    /** The sentence for a refusal the write answered. */
    function sentenceOf(error: Parameters<typeof refusalSentence>[0] | 'network'): string {
        if (error === 'network') return unreachableAnswer();
        return error === 'changed' ? t('files.writing_fix_changed') : refusalSentence(error);
    }

    async function confirm(): Promise<void> {
        const view = held;
        if (view === null || view.writing) return;
        const files = writeOf(view);
        if (files.length === 0) return;
        held = { ...view, writing: true, reason: '' };
        const outcome = await client.explorer.writingFix(files);
        const now = current();
        if (now === null) return;
        if (outcome.ok) {
            const count = outcome.paths.length;
            client.notices.post(
                count === 1
                    ? t('files.writing_fix_done_one')
                    : t('files.writing_fix_done', String(count))
            );
            held = null;
            return;
        }
        const done = outcome.done ?? [];
        if (done.length > 0) {
            const stopped = outcome.failed ?? '';
            client.notices.post(
                done.length === 1
                    ? t('files.writing_fix_partial_one', stopped)
                    : t('files.writing_fix_partial', stopped, String(done.length)),
                { tone: 'error' }
            );
            held = null;
            return;
        }
        const sentence = sentenceOf(outcome.error);
        const failed = outcome.failed ?? '';
        const nameOfRow = (one: FixRow): string => `${now.root}/${one.file.path}`;
        held = {
            ...now,
            writing: false,
            reason: now.rows.some((one) => nameOfRow(one) === failed) ? '' : sentence,
            rows: now.rows.map((one) =>
                nameOfRow(one) === failed
                    ? { ...one, ticked: false, locked: true, note: sentence }
                    : one
            )
        };
    }

    return { view: () => held, start, tick, confirm, cancel };
}
