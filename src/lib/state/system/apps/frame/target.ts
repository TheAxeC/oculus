// Layer 2, client state. What a tab drawing an app's page shows: the app's own view, a webview view
// the app declares, a panel opened for it, or a custom editor on a file. Each is a frame of one
// `.html` file of the app; the view id and the tab's saved state say which app and which file, and
// whether the tab is a panel or an editor.

import {
    EDITOR_VIEW,
    PANEL_VIEW,
    splitContributedView
} from '../../../../data/helpers/files/apps/views.ts';
import { fields } from '../../../../data/helpers/guards.ts';
import type { AppRow, AppViewEntry } from '../../../../data/model/index.ts';

/** The kinds of tab that draw an app's page. */
type PageKind = 'app' | 'view' | 'panel' | 'editor';

/** The page a tab draws. */
export type FrameTarget = {
    kind: PageKind;
    /** The view id of the app the page belongs to. */
    app: string;
    /** The `.html` file of the app, or empty for the app's own entry. */
    entry: string;
    /** The id a host knows a panel's tab by; empty for any other tab. */
    name: string;
    /** The id the app declared for the view a contributed view's tab draws; empty otherwise. */
    view: string;
    /** The `when` clause of a contributed view, empty for any other tab. */
    when: string;
    /** Whether the panel was opened by the app's host, which ends it when the host stops. */
    host: boolean;
    /** The file a custom editor was opened on. */
    document: { root: string; path: string } | null;
};

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/**
 * The page the tab of a view draws, or null for a view that draws none: a tree view, and a view
 * of an app that declares no such entry. `rowOf` finds the app's row by its view id.
 */
export function frameTarget(
    view: string,
    state: unknown,
    rowOf: (app: string) => AppRow | undefined
): FrameTarget | null {
    const held = fields(state);
    if (view === PANEL_VIEW) {
        return {
            kind: 'panel',
            app: text(held.app),
            entry: text(held.entry),
            name: text(held.name),
            view: '',
            when: '',
            host: held.host === true,
            document: null
        };
    }
    if (view === EDITOR_VIEW) {
        const app = text(held.app);
        const editor = rowOf(app)?.contributes.customEditors.find(
            (one) => one.viewType === held.viewType
        );
        if (editor === undefined) return null;
        return {
            kind: 'editor',
            app,
            entry: editor.entry,
            name: '',
            view: '',
            when: '',
            host: false,
            document: { root: text(held.root), path: text(held.path) }
        };
    }
    const split = splitContributedView(view);
    if (split !== null) {
        const entry = Object.values(rowOf(split.app)?.contributes.views ?? {})
            .flat()
            .find((one) => one.id === split.view);
        if (entry?.type !== 'webview') return null;
        return {
            kind: 'view',
            app: split.app,
            entry: entry.entry,
            name: '',
            view: split.view,
            when: entry.when,
            host: false,
            document: null
        };
    }
    return {
        kind: 'app',
        app: view,
        entry: '',
        name: '',
        view: '',
        when: '',
        host: false,
        document: null
    };
}

/** The tree view of an app a tab draws: the app's view id and the view as the app declared it. */
export function treeTarget(
    view: string,
    rowOf: (app: string) => AppRow | undefined
): { app: string; entry: AppViewEntry } | null {
    const split = splitContributedView(view);
    if (split === null) return null;
    const entry = Object.values(rowOf(split.app)?.contributes.views ?? {})
        .flat()
        .find((one) => one.id === split.view);
    return entry?.type === 'tree' ? { app: split.app, entry } : null;
}
