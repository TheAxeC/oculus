// Layer 2, client state. Showing a view: where a view asked for lands, which instance it lands in,
// and what it does to the tab a single click opened.
//
// A view already open is activated where it is rather than opened twice, so opening a view never
// leaves two copies of it behind. A unique view (a registration marked `unique`) is held once for
// every page and float: it is looked for in the pages drawn on the page on screen, then in the
// floats, then in every other page, and the first instance found is shown where it is, by showing
// the page that holds it when that page is not drawn on screen. Where a new tool view lands is the
// pane the reader was last in, or a new pane beside it when the caller asked for one; a view opened
// for something (one registered with no catalogue group) lands where layout/open/landing.ts says,
// whichever of the two was asked, since a page keeps its documents apart from its tools. A pane
// hidden inside a folded child is expanded first, since opening a view into something invisible
// would look like nothing happening.

import {
    activePath,
    findInstance,
    findView,
    isInstanceOf,
    newInstance,
    stateId
} from '../instance.ts';
import type { LayoutAccess } from '../access.ts';
import type { Attention } from './attention.ts';
import {
    floatHost,
    isPage,
    samePath,
    type Focus,
    type Host,
    type Instance,
    type Page,
    type Pane,
    type ViewId
} from '../model.ts';
import { drawnBy } from '../nested.ts';
import { landingFor } from './landing.ts';
import { heldView, type UniqueRule } from './float/pages.ts';
import { asPreview, isPreview, previewIn, retarget } from './preview.ts';
import {
    activate,
    expandTo,
    openInstance,
    pageLeaves,
    paneAt,
    restate,
    splitPane
} from '../tree.ts';
import { focusedPane, restore } from '../workbench.ts';

/** What an opener may ask for beyond the view and its state. */
export type OpenOptions = {
    /**
     * Open as the pane's preview tab: the preview tab it already holds is pointed at this view and
     * state instead, and a pane holding none gains one.
     */
    preview?: boolean;
    /**
     * Land as a view opened for something lands (landing.ts), whatever the view is: in the page's
     * documents pane and never over its tool panes. A Terminal tab and a Transcript opened from a
     * workbench's sessions list take it.
     */
    document?: boolean;
    /**
     * Show the instance of this view that names the state's `id` and that any page or float holds,
     * as a unique view is shown, and open a new one only when none does. The document rows of the
     * Views catalogue take it, so a document is one tab wherever it is held.
     */
    held?: boolean;
};

export type Opening = {
    openView: (view: ViewId, state?: unknown, page?: string, options?: OpenOptions) => string;
    /**
     * `asker` is the instance of the tool view the view is opened for: a view opened for something
     * lands outside that instance's pane (landing.ts), so the asked view opens beside the one that
     * asked and never over it. Of `options` it reads `preview` alone, as openView reads it.
     */
    openBeside: (
        view: ViewId,
        state?: unknown,
        page?: string,
        asker?: string,
        options?: OpenOptions
    ) => string;
    /**
     * Open a new instance of a view as a tab of the pane at a path of a page, whatever the page
     * already holds; answers its id, or the empty string for a page or pane that is not there.
     */
    openInPane: (view: ViewId, state: unknown, page: string, path: number[]) => string;
    /**
     * The id of the instance that openView would show where a page or float holds one, or null when
     * nothing does. Without `id` it answers for a unique view and is null for any other; with the
     * `id` a state names it answers for the instance of that record, which `options.held` shows. It
     * changes nothing.
     */
    heldInstance: (view: ViewId, id?: string) => string | null;
    /**
     * The page or float holding the instance of a unique view that openView would show, or null
     * when nothing holds one or the view is no unique view. It reads the same order openView
     * searches, so a caller naming the holder names the one a later openView goes to. It changes
     * nothing.
     */
    heldHost: (view: ViewId) => Host | null;
};

/** A unique view's instance with the page or float holding it, and whether the screen draws it. */
type Holder = { host: Host; instance: Instance; drawn: boolean };

/** Whether a path of a page lies inside the maximised pane, or nothing is maximised. */
function shownAt(focus: Focus | null, path: number[]): boolean {
    return focus === null || path.every((step, index) => focus.path[index] === step);
}

/**
 * The page leaves, outermost first, that lead from the page `from` to the page `to` it draws: in
 * each page on the way, the path of the leaf that holds the next page. Empty when `from` is `to`
 * or draws it nowhere.
 */
function leavesTo(
    pages: readonly Page[],
    from: string,
    to: string
): { page: string; path: number[] }[] {
    const seen = new Set<string>();
    const walk = (at: string): { page: string; path: number[] }[] | null => {
        if (seen.has(at)) return null;
        seen.add(at);
        const page = pages.find((one) => one.id === at);
        if (page === undefined) return null;
        for (const leaf of pageLeaves(page.workbench.root)) {
            if (leaf.page === to) return [{ page: at, path: leaf.path }];
            const rest = walk(leaf.page);
            if (rest !== null) return [{ page: at, path: leaf.path }, ...rest];
        }
        return null;
    };
    return walk(from) ?? [];
}

/**
 * `opened` says whether a view is one opened for something, which the registry answers: a
 * registration with no catalogue group. `unique` says whether a view is held once, which the
 * registry answers too: a registration marked `unique`.
 */
export function createOpening(
    access: LayoutAccess,
    attention: Attention,
    keepPreview: (id: string) => void,
    opened: (view: ViewId) => boolean,
    unique: UniqueRule
): Opening {
    /**
     * Show a view: the instance already open is activated, so no opener makes a second copy of the
     * same view, and otherwise a new instance opens in the pane holding the instance activated
     * last. A pane hidden inside a folded child is expanded first, since opening a view into
     * something invisible would look like nothing happening. An instance of a unique view is
     * activated wherever any page or float holds it (`showHeld`), whatever page the opener names.
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
        return openInto(
            view,
            state,
            false,
            page,
            options?.preview === true,
            undefined,
            options?.document === true,
            options?.held === true
        );
    }

    /**
     * Show a view in a new pane to the right of the pane holding the instance activated last, which
     * is what a view asked for beside the one being read means. The pane the last one made takes
     * the next one as a tab while it is still open, so opening the editor from five cards is one
     * pane of five tabs. A view already open is activated where it is, exactly as openView
     * activates it, and a maximised pane takes the view itself, since a new pane beside it would be
     * one nobody can see. The pane being read never takes the view: a view opened for something
     * lands where landingFor puts a view the tab being read asked for, beside that tab's pane.
     * `preview` is the one option of `options` it reads: with it, the view lands as the preview tab
     * of the pane it lands in, as openView's preview does.
     */
    function openBeside(
        view: ViewId,
        state?: unknown,
        page?: string,
        asker?: string,
        options?: OpenOptions
    ): string {
        return openInto(view, state, true, page, options?.preview === true, asker);
    }

    /**
     * A new tab in the pane at `path` of a page: a pane hidden inside a folded child is expanded
     * first, and the tab is the pane's active one. A pane the page does not hold opens nothing.
     */
    function openInPane(view: ViewId, state: unknown, page: string, path: number[]): string {
        const held = access.at(page);
        if (held === null || paneAt(access.layout(held.id), path) === null) return '';
        const instance = newInstance(view, state ?? {});
        attention.remembered(instance.id, held.id);
        access.change((current) => openInstance(expandTo(current, path), path, instance), held.id);
        return instance.id;
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
        preview = false,
        asker?: string,
        document = false,
        anywhere = false
    ): string {
        const held = page === undefined ? attention.touched() : access.at(page);
        if (held === null) return '';
        const host = held.id;
        const wanted = stateId(state);
        const holder = unique(view)
            ? holderOf(view)
            : anywhere && wanted !== null
              ? holderOf(view, wanted)
              : null;
        if (holder !== null) return showHeld(holder, state, preview);
        // A view open in a float is activated there when the host holds none of its own.
        const floated = findInFloats(view, stateId(state));
        if (
            floated !== null &&
            (floated.host === host || findView(access.layout(host), view, stateId(state)) === null)
        ) {
            return activateFloated(floated, state, preview);
        }
        // A float is one pane: a view opened for something lands in it as a tool view does, and a
        // view asked for beside another is a tab of it, since a float takes no split. A view opened
        // for something and asked for beside the one being read is asked by that one, so it lands
        // beside its pane and never in it (landingFor's `away`), as Open Preview to the Side does.
        if ((document || opened(view)) && isPage(held)) {
            const by = asker ?? (beside ? (attention.active(host) ?? undefined) : undefined);
            return openOpened(view, state, host, preview, by);
        }
        const focus = focusedPane(access.workbench(host));
        const tree = access.layout(host);
        const into = focus === null ? null : focus.path;
        const inside = into === null ? null : paneAt(tree, into);
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
            // path that holds when both clicks reach the tree before the first read returns. When
            // the first click has already taken the tree off the screen, the second press lands on
            // the tab the tree opened, and the keep armed for that tab (armed-keep.svelte.ts) takes
            // it.
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
        const aside = beside && inside === null && isPage(held);
        // The pane the last open beside made takes the view as a tab, unless it is the pane being
        // read, which a view asked for beside it never lands in.
        const last = aside ? attention.besidePath(tree, host) : null;
        const stack = last !== null && !samePath(last, path) ? last : null;
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
    function openOpened(
        view: ViewId,
        state: unknown,
        host: string,
        preview: boolean,
        asker?: string
    ): string {
        const bench = access.workbench(host);
        const tree = bench.root;
        const focus = focusedPane(bench);
        const existing = findView(tree, view, stateId(state));
        if (existing !== null) {
            const at = activePath(tree, existing.id);
            attention.remembered(existing.id, host);
            attention.rememberReceived(host, existing.id, tree);
            access.apply(
                {
                    ...(shownAt(focus, at) ? bench : restore(bench)),
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
        const away = asker === undefined ? null : (findInstance(tree, asker)?.path ?? null);
        const workbench = access
            .held()
            .pages.some((page) => page.id === host && page.folder !== undefined);
        const landing = landingFor(tree, opened, attention.received(host), reader, away, workbench);
        const base =
            landing.kind === 'pane' && shownAt(focus, landing.path) ? bench : restore(bench);
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
     * Where a unique view is held, in the order the reader meets it: the pages drawn on the page on
     * screen (that page first, then the pages it draws), the floats, which are drawn over every
     * page, and then every other page in the page list's order. The instance is the first one in
     * that order, whatever record its state names, or the one naming `id` when it is given.
     */
    function holderOf(view: ViewId, id?: string): Holder | null {
        const { pages, floats } = access.held();
        const drawn = drawnBy(pages, access.currentPage().id);
        const shown = [...drawn].flatMap((id) => pages.filter((page) => page.id === id));
        const apart = pages.filter((page) => !drawn.has(page.id));
        const found = heldView([...shown, ...floats.map(floatHost), ...apart], view, id);
        return found === null ? null : { ...found, drawn: drawn.has(found.host.id) };
    }

    function heldInstance(view: ViewId, id?: string): string | null {
        if (id !== undefined) return holderOf(view, id)?.instance.id ?? null;
        return unique(view) ? (holderOf(view)?.instance.id ?? null) : null;
    }

    function heldHost(view: ViewId): Host | null {
        return unique(view) ? (holderOf(view)?.host ?? null) : null;
    }

    /**
     * Show the leaf at `path` of a page: a maximised pane that does not hold it is given back and a
     * folded child holding it is expanded, so the page drawn in the leaf is on screen.
     */
    function showLeaf(page: string, path: number[]): void {
        const bench = access.workbench(page);
        const base = shownAt(focusedPane(bench), path) ? bench : restore(bench);
        const root = expandTo(base.root, path);
        if (base !== bench || root !== bench.root) access.apply({ ...base, root }, page);
    }

    /**
     * Show the instance of a unique view where it is held, pointing it at `state` when the opener
     * has one. A float's tab is activated in the float. On a page the tab is activated where it is,
     * a pane hidden in a folded child is expanded and a maximised pane that is not the one holding
     * it is given back, so the tab shows; this holds for the holder page and, when the screen draws
     * the holder in a page leaf, for each page between the page on screen and the holder. A page
     * the screen does not draw is then put on screen.
     */
    function showHeld(holder: Holder, state: unknown, preview: boolean): string {
        const { host, instance } = holder;
        if (!isPage(host)) return activateFloated({ host: host.id, instance }, state, preview);
        if (holder.drawn) {
            const screen = access.currentPage().id;
            for (const hop of leavesTo(access.held().pages, screen, host.id)) {
                showLeaf(hop.page, hop.path);
            }
        }
        const bench = access.workbench(host.id);
        const at = activePath(bench.root, instance.id);
        const stated = state === undefined ? bench.root : restate(bench.root, instance.id, state);
        const base = shownAt(focusedPane(bench), at) ? bench : restore(bench);
        attention.remembered(instance.id, host.id);
        access.apply({ ...base, root: activate(expandTo(stated, at), instance.id) }, host.id);
        if (!holder.drawn) {
            attention.forgetTouched();
            access.save({ ...access.held(), current: host.id });
        }
        if (preview && isPreview(instance)) keepPreview(instance.id);
        return instance.id;
    }

    /** A float's instance of a view, with the float holding it, or null when no float has one. */
    function findInFloats(
        view: ViewId,
        id: string | null
    ): { host: string; instance: Instance } | null {
        for (const float of access.held().floats) {
            const found = float.pane.tabs.find((tab) => isInstanceOf(tab, view, id));
            if (found !== undefined) return { host: float.id, instance: found };
        }
        return null;
    }

    /**
     * Activate an instance where a float holds it, pointing it at `state` when the opener has one.
     */
    function activateFloated(
        found: { host: string; instance: Instance },
        state: unknown,
        preview: boolean
    ): string {
        attention.remembered(found.instance.id, found.host);
        access.change(
            (current) =>
                activate(
                    state === undefined ? current : restate(current, found.instance.id, state),
                    found.instance.id
                ),
            found.host
        );
        if (preview && isPreview(found.instance)) keepPreview(found.instance.id);
        return found.instance.id;
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

    return { openView, openBeside, openInPane, heldInstance, heldHost };
}
