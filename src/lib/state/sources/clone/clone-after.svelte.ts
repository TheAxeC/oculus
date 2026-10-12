// Layer 2, client state. What the reader is asked after a repository was cloned, and what each
// answer does, as VS Code asks after its Clone (`git.openAfterClone`):
//
// - Open: the clone becomes the only folder of the unsaved workspace. When a workspace file is
//   open it is closed as `:workspace-close` closes it, the file untouched. When the unsaved
//   workspace holds folders, the reader is asked first, as VS Code asks when it leaves an untitled
//   workspace: Save asks for a name and saves the folders as that workspace file as
//   `:workspace-save` does, then opens the clone; Don't Save opens the clone and drops the folders;
//   Cancel changes nothing. A name the reader cancels cancels the whole Open. An unsaved workspace
//   with no folder opens the clone without asking.
// - Add to Workspace: the folder is added as Add Folder to Workspace adds one, by the same write,
//   so it is one entry of the History and its Undo takes the folder back.
//
// There is no Open in New Window: oculus keeps one workspace that every window shows. Closing the
// question without an answer does nothing, and the clone stays on disk.

import { t } from '../../shared/words/text.ts';
import type { NoticeSink } from '../../shared/stores/shapes.ts';
import { refusal } from '../explorer/acts/refusal.ts';
import { foldersToAdd } from '../explorer/acts/folders.ts';
import type { FsStore } from '../fs.svelte.ts';

/** The question in front of the reader: which step of the answer it is. */
type CloneAsk =
    /** The folder was cloned: Open or Add to Workspace. */
    | { step: 'after'; dir: string }
    /** Open would leave an unsaved workspace holding folders: Save, Don't Save or Cancel. */
    | { step: 'leave'; dir: string }
    /** Save was chosen: the name of the workspace file, with the refusal of the last one. */
    | { step: 'name'; dir: string; said: string };

export type CloneAfter = {
    /** The question in front of the reader, or null. */
    asking: () => CloneAsk | null;
    /** Ask what to do with the folder that was cloned. */
    ask: (dir: string) => void;
    /** The answer Open. */
    open: () => Promise<void>;
    /** The answer Add to Workspace. */
    add: () => Promise<void>;
    /** The answer Save of the question that asks about the unsaved folders. */
    save: () => void;
    /** The answer Don't Save of that question. */
    dontSave: () => Promise<void>;
    /** A name for the workspace file; the folders are saved under it and the clone is opened. */
    named: (name: string) => Promise<void>;
    /** Close the question without an answer: nothing changes. */
    cancel: () => void;
};

/** What the question reads of the file store. */
export type CloneAfterFs = Pick<
    FsStore,
    'addRoot' | 'closeWorkspace' | 'saveWorkspace' | 'workspacesNow'
>;

export function createCloneAfter(fs: CloneAfterFs, notices: Pick<NoticeSink, 'post'>): CloneAfter {
    let asking = $state<CloneAsk | null>(null);

    function said(message: string): void {
        notices.post(message, { tone: 'error' });
    }

    /** Make the folder the only one of the unsaved workspace. */
    async function openAlone(dir: string): Promise<void> {
        const closed = await fs.closeWorkspace();
        if (!closed.ok) {
            said(refusal(closed.error ?? '', closed.reason));
            return;
        }
        const added = await fs.addRoot(dir);
        if (!added.ok) said(refusal(added.error ?? '', added.reason));
    }

    async function open(): Promise<void> {
        const held = asking;
        if (held?.step !== 'after') return;
        const now = await fs.workspacesNow();
        if (now.open === null && now.folders.length > 0) {
            asking = { step: 'leave', dir: held.dir };
            return;
        }
        asking = null;
        if (now.open === null) {
            const added = await fs.addRoot(held.dir);
            if (!added.ok) said(refusal(added.error ?? '', added.reason));
            return;
        }
        await openAlone(held.dir);
    }

    async function add(): Promise<void> {
        const held = asking;
        if (held?.step !== 'after') return;
        asking = null;
        const now = await fs.workspacesNow();
        const { add: fresh, skipped } = foldersToAdd([held.dir], now.folders);
        if (fresh.length === 0) {
            notices.post(t('files.add_skipped', skipped.join(', ')));
            return;
        }
        const added = await fs.addRoot(held.dir);
        if (!added.ok) said(refusal(added.error ?? '', added.reason));
    }

    function save(): void {
        const held = asking;
        if (held?.step !== 'leave') return;
        asking = { step: 'name', dir: held.dir, said: '' };
    }

    async function dontSave(): Promise<void> {
        const held = asking;
        if (held?.step !== 'leave') return;
        asking = null;
        await openAlone(held.dir);
    }

    async function named(name: string): Promise<void> {
        const held = asking;
        if (held?.step !== 'name') return;
        const saved = await fs.saveWorkspace(name);
        if (!saved.ok) {
            asking = { ...held, said: refusal(saved.error ?? '', saved.reason) };
            return;
        }
        asking = null;
        await openAlone(held.dir);
    }

    return {
        asking: () => asking,
        ask: (dir) => {
            asking = { step: 'after', dir };
        },
        open,
        add,
        save,
        dontSave,
        named,
        cancel: () => {
            asking = null;
        }
    };
}
