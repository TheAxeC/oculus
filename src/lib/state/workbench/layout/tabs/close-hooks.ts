// Layer 2, client state. What the stores holding a tab's work register so that a close, the save
// key and the Save of a close question can ask about a tab by its instance id alone: whether it
// holds unsaved text, whether its file is deleted on disk, what saves it, and which running
// terminals it owns. The shell asks these and never a view's own store, so a view that gains such
// work later registers the same way and the pane that closes tabs is not edited for it.
//
// The ui store (state/workbench/ui.svelte.ts) holds one set per client and hands its members on as
// its own; nothing here is reactive, since what is registered is asked at the moment of a close.

import type { BusyTerminal } from '../../../sessions/terminal/pty/pty-io.ts';

/** An instance as a terminal owner reads it: its identity, its view and the state it holds. */
export type OwnedInstance = { id: string; view: string; state?: unknown };

/**
 * What the store owning terminals registers, in the shape of `registerUnsaved`: which running
 * terminals a set of instances owns, a fresh read of which of them run a program, and ending them.
 * The shell asks the instance list and never the terminals store, which it may not read.
 */
export type TerminalOwner = {
    running: (instances: readonly OwnedInstance[]) => string[];
    busy: (ids: string[]) => Promise<BusyTerminal[]>;
    end: (ids: string[]) => void;
};

/** The registrations of one client, and the questions a close asks of them. */
export type CloseHooks = {
    /**
     * Register what answers whether one instance holds text no save has taken; the answer takes it
     * out again, for a view that registers while it is drawn.
     */
    registerUnsaved: (reports: (id: string) => boolean) => () => void;
    /** Whether the instance holds unsaved text, which is what a close asks a confirmation about. */
    unsaved: (id: string) => boolean;
    /** Register what answers whether a file is deleted on disk under a tab that holds it. */
    registerGone: (reports: (root: string, path: string) => boolean) => void;
    /** Whether a tab over this file holds it as deleted on disk. */
    fileGone: (root: string, path: string) => boolean;
    /** Register what saves the tabs a close may save instead of asking about them. */
    registerSaveBeforeClose: (save: (ids: string[]) => Promise<void>) => void;
    /**
     * Save the tabs among these that the autosave mode saves on a close, and answer the ids that
     * hold unsaved text afterwards, which are the ones the close asks about.
     */
    saveBeforeClose: (ids: string[]) => Promise<string[]>;
    /**
     * Register what the save key does on one tab, which the view drawing the tab hands in while it
     * holds work a save takes (a Settings tab's rail list, an editor draft or a typed field text);
     * the answer takes it out again. The save answers whether the work was written, true when it
     * held nothing to write.
     */
    registerTabSave: (id: string, save: () => Promise<boolean>) => () => void;
    /** Run what the tab's views registered for the save key; false when none registered any. */
    saveTab: (id: string) => boolean;
    /**
     * Register what saves a tab a store holds the text of (a source tab, an app's custom editor),
     * for the Save of a close question: null for a tab it does not hold, else whether the save
     * wrote it.
     */
    registerCloseSave: (save: (id: string) => Promise<boolean> | null) => void;
    /**
     * Save each of these tabs that holds unsaved text, as the Save of a close question does: what
     * the tab's views registered for the save key, else the store that holds its text. Answers the
     * tabs left holding unsaved text: those whose save failed and those with no save at all (an
     * untitled tab, a typed line no save takes).
     */
    saveForClose: (ids: string[]) => Promise<string[]>;
    /** Register a store that owns terminals, at the point the client is wired. */
    registerTerminalOwner: (owner: TerminalOwner) => void;
    /**
     * A fresh read of which running terminals the instances own are running a program other than
     * their shell. Nothing is read for instances owning no running terminal.
     */
    busyTerminals: (instances: readonly OwnedInstance[]) => Promise<BusyTerminal[]>;
    /** End the running terminals the instances own. The instances are the ones being removed. */
    endTerminals: (instances: readonly OwnedInstance[]) => void;
};

/** One client's registrations, empty until the stores holding work register. */
export function createCloseHooks(): CloseHooks {
    const unsavedReports: ((id: string) => boolean)[] = [];
    const goneReports: ((root: string, path: string) => boolean)[] = [];
    const closeSavers: ((ids: string[]) => Promise<void>)[] = [];
    /** What the views of each tab registered for the save key, by the tab's instance id. */
    const tabSaves = new Map<string, Set<() => Promise<boolean>>>();
    const closeSaves: ((id: string) => Promise<boolean> | null)[] = [];
    const terminalOwners: TerminalOwner[] = [];

    function unsaved(id: string): boolean {
        return unsavedReports.some((reports) => reports(id));
    }

    async function saveBeforeClose(ids: string[]): Promise<string[]> {
        for (const save of closeSavers) await save(ids);
        return ids.filter(unsaved);
    }

    function registerTabSave(id: string, save: () => Promise<boolean>): () => void {
        const saves = tabSaves.get(id) ?? new Set<() => Promise<boolean>>();
        saves.add(save);
        tabSaves.set(id, saves);
        return () => {
            saves.delete(save);
            if (saves.size === 0 && tabSaves.get(id) === saves) tabSaves.delete(id);
        };
    }

    function saveTab(id: string): boolean {
        const saves = [...(tabSaves.get(id) ?? [])];
        for (const save of saves) void save();
        return saves.length > 0;
    }

    /** Whether the save of one tab wrote its work; false for a tab nothing saves. */
    function savedForClose(id: string): Promise<boolean> {
        const registered = [...(tabSaves.get(id) ?? [])];
        let saving: Promise<boolean> | null = null;
        if (registered.length > 0) {
            saving = Promise.all(registered.map((save) => save())).then((all) =>
                all.every(Boolean)
            );
        }
        for (const save of closeSaves) saving ??= save(id);
        return (saving ?? Promise.resolve(false)).catch(() => false);
    }

    async function saveForClose(ids: string[]): Promise<string[]> {
        const dirty = ids.filter(unsaved);
        const saved = await Promise.all(dirty.map(savedForClose));
        return dirty.filter((_, at) => !saved[at]);
    }

    async function busyTerminals(instances: readonly OwnedInstance[]): Promise<BusyTerminal[]> {
        const found = await Promise.all(
            terminalOwners.map((owner) => {
                const ids = owner.running(instances);
                return ids.length === 0 ? Promise.resolve([]) : owner.busy(ids);
            })
        );
        return found.flat();
    }

    function endTerminals(instances: readonly OwnedInstance[]): void {
        for (const owner of terminalOwners) {
            const ids = owner.running(instances);
            if (ids.length > 0) owner.end(ids);
        }
    }

    return {
        registerUnsaved: (reports) => {
            unsavedReports.push(reports);
            return () => {
                const at = unsavedReports.indexOf(reports);
                if (at >= 0) unsavedReports.splice(at, 1);
            };
        },
        unsaved,
        registerGone: (reports) => {
            goneReports.push(reports);
        },
        fileGone: (root, path) => goneReports.some((reports) => reports(root, path)),
        registerSaveBeforeClose: (save) => {
            closeSavers.push(save);
        },
        saveBeforeClose,
        registerTabSave,
        saveTab,
        registerCloseSave: (save) => {
            closeSaves.push(save);
        },
        saveForClose,
        registerTerminalOwner: (owner) => {
            terminalOwners.push(owner);
        },
        busyTerminals,
        endTerminals
    };
}
