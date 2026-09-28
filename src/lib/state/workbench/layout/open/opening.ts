// Layer 2, client state. Showing a view: where a view asked for lands, which instance it lands in,
// and what it does to the tab a single click opened.
//
// A view already open is activated where it is rather than opened twice, so opening a view never
// leaves two copies of it behind. Where a new tool view lands is the pane the reader was last in,
// or a new pane beside it when the caller asked for one; a view opened for something (one
// registered with no catalogue group) lands where layout/open/landing.ts says, whichever of the two
// was asked, since a page keeps its documents apart from its tools. A pane hidden inside a folded
// child is expanded first, since opening a view into something invisible would look like nothing
// happening.

import { activePath, findView, isInstanceOf, newInstance, stateId } from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import type { Instance, Pane, ViewId } from '../model.ts';
import { landingFor } from './landing.ts';
import { asPreview, isPreview, previewIn, retarget } from './preview.ts';
import { activate, expandTo, openInstance, paneAt, restate, splitPane } from '../tree.ts';
import { focusedPane, restore } from '../workbench.ts';

/** What an opener may ask for beyond the view and its state. */
export type OpenOptions = {
    /**
     * Open as the pane's preview tab: the preview tab it already holds is pointed at this view and
     * state instead, and a pane holding none gains one.
     */
    preview?: boolean;
};

export type Opening = {
    openView: (view: ViewId, state?: unknown, page?: string, options?: OpenOptions) => string;
    openBeside: (view: ViewId, state?: unknown, page?: string) => string;
};

/**
 * `opened` says whether a view is one opened for something, which the registry answers: a
 * registration with no catalogue group.
 */
export function createOpening(
    access: LayoutAccess,
    attention: Attention,
    keepPreview: (id: string) => void,
    opened: (view: ViewId) => boolean = () => false
): Opening {
    /**
     * Show a view: the instance already open is activated, so no opener makes a second copy of the
     * same view, and otherwise a new instance opens in the pane holding the instance activated
     * last. A pane hidden inside a folded child is expanded first, since opening a view into
     * something invisible would look like nothing happening.
     *
     * `state` is what the opener has to say to the view: the project a card wants opened or the
     * session a pane pins. A state carrying an `id` or `session` names which instance is wanted, so
     * opening one record twice activates its existing tab and opening a second record creates
     * another. A state carrying neither retargets the unpinned instance, while pinned instances
     * stay fixed. The returned id names the instance activated or created, so its separate UI state
     * can be updated by the caller.
     *
     * `options.preview` opens the view as the pane's preview tab, which is the one a single click
     * in the file browser opens: the pane's existing preview tab is pointed at this view and state
     * in place, so walking a tree with single clicks reads one file after another in one tab.
     */
    function openView(view: ViewId, state?: unknown, page?: string, options?: OpenOptions): string {
        return openInto(view, state, false, page, options?.preview === true);
    }

    /**
     * Show a view in a new pane to the right of the pane holding the instance activated last, which
     * is what a view asked for beside the one being read means. The pane the last one made takes
     * the next one as a tab while it is still open, so opening the editor from five cards is one
     * pane of five tabs. A view already open is activated where it is, exactly as openView
     * activates it, and a maximised pane takes the view itself, since a new pane beside it would be
     * one nobody can see.
     */
    function openBeside(view: ViewId, state?: unknown, page?: string): string {
        return openInto(view, state, true, page);
    }

    /**
     * Open or activate a view, in the pane a view lands in or in a new pane beside that one. The
     * page is the one the reader is in, which is the page shown at the pane holding the keyboard
     * focus and the page on screen when no pane holds it.
     */
    function openInto(
        view: ViewId,
        state: unknown,
        beside: boolean,
        page?: string,
        preview = false
    ): string {
        const held = page === undefined ? attention.touched() : access.at(page);
        if (held === null) return '';
        const host = held.id;
        if (opened(view)) return openOpened(view, state, host, preview);
        const focus = focusedPane(access.workbench(host));
        const tree = access.layout(host);
        const into = focus === null ? null : focus.path;
        const inside = into === null ? null : paneAt(tree, into);
        const wanted = stateId(state);
        const existing =
            inside === null ? findView(tree, view, wanted) : findIn(inside, view, wanted);
        if (existing !== null) {
            attention.remembered(existing.id, host);
            access.change((current) => {
                const stated = state === undefined ? current : restate(current, existing.id, state);
                return activate(expandTo(stated, activePath(stated, existing.id)), existing.id);
            }, host);
            // Asking for the file the preview tab already holds is asking for it a second time,
            // which is what the second click of a double click is. It keeps the tab, and it is the
            // path that holds when the first click has taken the tree off the screen and the second
            // one lands on the tab the tree opened.
            if (preview && isPreview(existing)) keepPreview(existing.id);
            return existing.id;
        }
        const path =
            into !== null && inside !== null ? into : activePath(tree, attention.active(host));
        // A preview open lands in the pane's preview tab when it holds one, wherever that tab came
        // from: the tab is pointed at the new view and keeps its place in the strip.
        const replaced = preview ? previewIn(paneAt(tree, path)) : null;
        if (replaced !== null) {
            attention.remembered(replaced.id, host);
            // The instance keeps its id, so what the view it was is holding under that id would be
            // read by the view it becomes: a draft of the file before this one, a cursor into a
            // list that is gone. A preview tab never holds an unsaved edit, since typing into one
            // keeps it, so there is nothing here to lose.
            access.ui.clearInstanceState(replaced.id);
            access.change(
                (current) =>
                    retarget(
                        expandTo(current, activePath(current, replaced.id)),
                        replaced.id,
                        view,
                        state ?? {}
                    ),
                host
            );
            return replaced.id;
        }
        const fresh = newInstance(view, state ?? {});
        const instance = preview ? asPreview(fresh) : fresh;
        const aside = beside && inside === null;
        const stack = aside ? attention.besidePath(tree, host) : null;
        if (aside) {
            // The pane split off keeps the tab that was being read as the one it sits beside; a tab
            // stacked into that pane keeps the memory the pane was made with.
            const made = attention.beside(host);
            const from =
                stack !== null && made !== undefined
                    ? made.from
                    : (paneAt(tree, path)?.active ?? null);
            attention.rememberBeside(host, { made: instance.id, from });
        }
        attention.remembered(instance.id, host);
        access.change((current) => {
            const shown = expandTo(current, stack ?? path);
            if (!aside) return openInstance(shown, path, instance);
            return stack === null
                ? splitPane(shown, path, 'row', instance)
                : openInstance(shown, stack, instance);
        }, host);
        return instance.id;
    }

    /**
     * Open or activate a view opened for something on a page. One already open anywhere on the page
     * is activated where it is; a new one lands where landingFor says. A maximised pane is given
     * back first when what is opened is not in it, since a tab opened or activated behind it would
     * look like nothing happening, and a maximised tool pane is no place for a document either.
     */
    function openOpened(view: ViewId, state: unknown, host: string, preview: boolean): string {
        const bench = access.workbench(host);
        const tree = bench.root;
        const focus = focusedPane(bench);
        const existing = findView(tree, view, stateId(state));
        const shows = (path: number[]): boolean =>
            focus === null || path.every((step, index) => focus.path[index] === step);
        if (existing !== null) {
            const at = activePath(tree, existing.id);
            attention.remembered(existing.id, host);
            attention.rememberReceived(host, existing.id, tree);
            access.apply(
                {
                    ...(shows(at) ? bench : restore(bench)),
                    root: activate(
                        expandTo(
                            state === undefined ? tree : restate(tree, existing.id, state),
                            at
                        ),
                        existing.id
                    )
                },
                host
            );
            if (preview && isPreview(existing)) keepPreview(existing.id);
            return existing.id;
        }
        const reader = activePath(tree, attention.active(host));
        const landing = landingFor(tree, opened, attention.received(host), reader);
        const base = landing.kind === 'pane' && shows(landing.path) ? bench : restore(bench);
        const replaced =
            preview && landing.kind === 'pane' ? previewIn(paneAt(tree, landing.path)) : null;
        if (replaced !== null) {
            attention.remembered(replaced.id, host);
            attention.rememberReceived(host, replaced.id, tree);
            access.ui.clearInstanceState(replaced.id);
            access.apply(
                {
                    ...base,
                    root: retarget(expandTo(tree, landing.path), replaced.id, view, state ?? {})
                },
                host
            );
            return replaced.id;
        }
        const fresh = newInstance(view, state ?? {});
        const instance = preview ? asPreview(fresh) : fresh;
        const shown = expandTo(tree, landing.path);
        const root =
            landing.kind === 'pane'
                ? openInstance(shown, landing.path, instance)
                : splitPane(shown, landing.path, 'row', instance);
        attention.remembered(instance.id, host);
        access.apply({ ...base, root }, host);
        attention.rememberReceived(host, instance.id, access.layout(host));
        return instance.id;
    }

    /**
     * The instance of a view in one pane, or null when it holds none. While a pane is maximised it
     * is the only pane a view can be opened into, so it is the only one an already-open instance
     * may be found in: activating a tab of a pane nobody can see would look like nothing happening.
     * A state identity narrows it the same way findView does.
     */
    function findIn(pane: Pane, view: ViewId, id: string | null): Instance | null {
        return pane.tabs.find((tab) => isInstanceOf(tab, view, id)) ?? null;
    }

    return { openView, openBeside };
}
