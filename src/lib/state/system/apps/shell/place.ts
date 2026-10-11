// Layer 2, client state. The context parts of the tab on screen: the file a source, file or
// document tab shows with its language, the `viewType` of the custom editor or panel a tab draws,
// and the declared id of the app view a tab draws. They are what a `when` clause reads where no
// menu or key names its own place (Cmd-K, a key pressed outside any menu).

import {
    EDITOR_VIEW,
    PANEL_VIEW,
    splitContributedView
} from '../../../../data/helpers/files/apps/views.ts';
import { fields } from '../../../../data/helpers/guards.ts';
import type { ContextParts } from './context.ts';

/** The tab on screen as the page holds it, and what its editor last said. */
export type PlaceTab = { id: string; view: string; state: unknown };

const text = (value: unknown): string => (typeof value === 'string' ? value : '');

/** The file a tab shows, as the page reads it from the tab's view and state, or null. */
export type FileOfTab = (tab: PlaceTab) => { root: string; path: string } | null;

/**
 * The parts of the place a tab is, with whether a text editor holds the keyboard. `fileOf` says
 * which file a tab shows.
 */
export function placeOf(
    tab: PlaceTab | null,
    status: { language: string } | null,
    textFocus: boolean,
    fileOf: FileOfTab
): ContextParts {
    if (tab === null) return {};
    const held = fields(tab.state);
    if (tab.view === PANEL_VIEW) return { activeWebviewPanelId: text(held.viewType) };
    if (tab.view === EDITOR_VIEW) {
        const root = text(held.root);
        const path = text(held.path);
        return {
            activeCustomEditorId: text(held.viewType),
            ...(root === '' || path === '' ? {} : { resource: { root, path, language: '' } })
        };
    }
    const contributed = splitContributedView(tab.view);
    if (contributed !== null) return { focusedView: contributed.view };
    const file = fileOf(tab);
    if (file === null) return {};
    const language = status?.language ?? '';
    return {
        resource: { root: file.root, path: file.path, language },
        ...(tab.view === 'source' ? { editorLangId: language, editorTextFocus: textFocus } : {})
    };
}
