// Layer 2, client state. What a tab of an app keeps in its saved instance state: the one JSON value
// `getState` and `setState` read and write, the real folder of the app a root app's tab was drawn
// for, and the content hash the tab last ran, which is how a tab tells an app it never ran from one
// that changed.
//
// A root key is per workspace, so after a workspace switch the same key can name another folder.
// The tab therefore draws a root app only while the registered app of its view id has the folder
// the tab holds; any other folder draws the unknown view and keeps the state.

import { fields } from '../../../data/helpers/guards.ts';

export type AppTab = {
    /** The value of `getState`, null before the app sets one. */
    value: unknown;
    /** The real folder of the root app the tab was drawn for, empty until it is drawn once. */
    folder: string;
    /** The content hash the tab last ran, empty until it runs. */
    seen: string;
};

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** A tab's saved state as the three fields, each its empty value when missing or of another type.
 * */
export function appTab(raw: unknown): AppTab {
    const held = fields(raw);
    return { value: held.value ?? null, folder: text(held.folder), seen: text(held.seen) };
}

/**
 * The state to save after a change, with the fields that are empty left out. A tab that was opened
 * with fields of its own (a panel's, a custom editor's) keeps them: `base` is the state held now.
 */
export function appTabState(tab: AppTab, base: unknown = null): Record<string, unknown> {
    const kept = Object.fromEntries(
        Object.entries(fields(base)).filter(([key]) => !['value', 'folder', 'seen'].includes(key))
    );
    return {
        ...kept,
        value: tab.value,
        ...(tab.folder === '' ? {} : { folder: tab.folder }),
        ...(tab.seen === '' ? {} : { seen: tab.seen })
    };
}

/** Whether a tab holding this state may draw the app of this folder: a new tab draws any. */
export function drawsFolder(tab: AppTab, root: string, folder: string): boolean {
    return root === '' || tab.folder === '' || tab.folder === folder;
}
