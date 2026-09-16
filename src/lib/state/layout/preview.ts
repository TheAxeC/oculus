// Layer 2, client state. The preview tab: which instance a preview open replaces, and the two
// rewrites that replace it and that keep it.
//
// A pane holds at most one preview tab, so a reader walking a tree with single clicks reads one file
// after another in one tab instead of leaving a strip of them behind. Keeping the tab is the flag
// going away rather than a second field, since a tab is either the one that is replaced next or it
// is not.

import { findInstance } from '../instance.ts';
import { rewrite } from './tree.ts';
import type { Instance, Layout, Pane, ViewId } from './model.ts';

/** Whether a tab is the one the next preview open replaces. */
export function isPreview(instance: Instance): boolean {
    return instance.preview === true;
}

/** The preview tab of a pane, or null when it holds none. */
export function previewIn(pane: Pane | null): Instance | null {
    return pane?.tabs.find(isPreview) ?? null;
}

/** A fresh instance marked as the tab the next preview open replaces. */
export function asPreview(instance: Instance): Instance {
    return { ...instance, preview: true };
}

/**
 * The tree with one instance pointed at another view and state, in place: the tab keeps its id and
 * its position in the strip, which is what makes a preview read as one tab the reader is moving
 * through rather than as a tab closing and another opening.
 */
export function retarget(layout: Layout, id: string, view: ViewId, state: unknown): Layout {
    const found = findInstance(layout, id);
    if (found === null) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const tabs = node.tabs.map((tab) => (tab.id === id ? { ...tab, view, state } : tab));
        return { kind: 'pane', tabs, active: id };
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/** The tree with one instance kept: the flag goes, and nothing else about the tab changes. */
export function keepInstance(layout: Layout, id: string): Layout {
    const found = findInstance(layout, id);
    if (found === null || !isPreview(found.instance)) return layout;
    const edit = (node: Layout): Layout => {
        if (node.kind !== 'pane') return node;
        const tabs = node.tabs.map((tab) => (tab.id === id ? kept(tab) : tab));
        return { kind: 'pane', tabs, active: node.active };
    };
    return rewrite(layout, found.path, edit) ?? layout;
}

/** One instance without the flag, which is the whole of what keeping a tab is. */
function kept(instance: Instance): Instance {
    if (instance.preview === undefined) return instance;
    return { id: instance.id, view: instance.view, state: instance.state };
}
