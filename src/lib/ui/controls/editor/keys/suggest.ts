// Layer 3, primitive. Show Suggestions and the description panel of the suggest list.
//
// Show Suggestions is Monaco's own action `editor.action.triggerSuggest` (Ctrl+Space, and on macOS
// Option+Esc and Cmd+I beside it). Monaco binds its keys and lists it nowhere; a parent that hands
// the editor its label gets it in the editor's right-click menu, through Monaco's menu registry so
// the menu draws the action's key beside it and greys the item by the action's own precondition
// (a read-only text, a file with no completion), and in the palette with its key as the hint.
//
// Whether the suggest list shows its side panel of descriptions is a value Monaco's suggest widget
// keeps in the page's storage service under one key, which Ctrl+Space or Cmd+I toggles while the
// list shows. The standalone editor's storage lives in memory, so the parent holds the value: the
// kit sets it into the storage when the parent's value changes and tells the parent when the
// reader toggles it. The storage is the page's, so every editor of the page reads the one value.
//
// Monaco's menu registry, its registry of editor actions, its context keys and its storage service
// are internal modules, loaded once Monaco has started its services (`loadSuggest`, kit/load.ts).

import type * as Monaco from 'monaco-editor';
import { chordHint } from '../chords';
import type { EditorAction, EditorSuggest, KeyPress } from '../types';

/** Monaco's action that opens the suggest list (suggestController.js `TriggerSuggestAction`). */
const TRIGGER_SUGGEST = 'editor.action.triggerSuggest';

/** The key the suggest widget keeps whether its description panel is shown under. */
const DETAILS_KEY = 'expandSuggestionDocs';

/** The storage scope and target the suggest widget reads and writes the key with: the profile's. */
const PROFILE = 0;
const USER = 0;

/** The right-click menu's group the item is drawn in, with the editing actions. */
const MENU_GROUP = '1_modification';

/** What the editors of the page share of Show Suggestions and the description panel. */
export type SuggestKit = {
    /**
     * Add Show Suggestions to one editor's right-click menu under `title`; the answer takes it
     * away.
     */
    menuItem: (editorId: string, title: string) => Monaco.IDisposable;
    /** Show or close the description panel of every editor's suggest list. */
    setDetails: (shown: boolean) => void;
    /** Be told whether the panel is shown each time the reader toggles it. */
    onDetails: (listener: (shown: boolean) => void) => Monaco.IDisposable;
};

/** Load the parts of Monaco Show Suggestions and the panel use, after its services started. */
export async function loadSuggest(): Promise<SuggestKit> {
    const [actions, extensions, contextkey, storage, standalone] = await Promise.all([
        import('monaco-editor/platform/actions/common/actions'),
        import('monaco-editor/editor/browser/editorExtensions'),
        import('monaco-editor/platform/contextkey/common/contextkey'),
        import('monaco-editor/platform/storage/common/storage'),
        import('monaco-editor/editor/standalone/browser/standaloneServices')
    ]);
    const precondition = extensions.EditorExtensionsRegistry.getEditorActions().find(
        (action) => action.id === TRIGGER_SUGGEST
    )?.precondition;
    const store = standalone.StandaloneServices.get(storage.IStorageService);
    return {
        menuItem: (editorId, title) =>
            actions.MenuRegistry.appendMenuItem(actions.MenuId.EditorContext, {
                command: { id: TRIGGER_SUGGEST, title, precondition },
                when: contextkey.ContextKeyExpr.equals('editorId', editorId),
                group: MENU_GROUP,
                order: 0
            }),
        setDetails: (shown) => {
            if (store.getBoolean(DETAILS_KEY, PROFILE, false) !== shown) {
                store.store(DETAILS_KEY, shown, PROFILE, USER);
            }
        },
        onDetails: (listener) =>
            store.onDidChangeValue(
                PROFILE,
                DETAILS_KEY,
                undefined
            )(() => {
                listener(store.getBoolean(DETAILS_KEY, PROFILE, false));
            })
    };
}

/** Show Suggestions' key as the palette writes it: Ctrl+Space, on every platform. */
function suggestPress(mac: boolean): KeyPress {
    return mac ? { code: 'Space', ctrl: true } : { code: 'Space', cmd: true };
}

/** Show Suggestions as the palette lists it, when the parent handed its label. */
export function suggestListing(suggest: EditorSuggest | undefined, mac: boolean): EditorAction[] {
    if (suggest === undefined) return [];
    return [
        { id: TRIGGER_SUGGEST, label: suggest.label, hint: chordHint([suggestPress(mac)], mac) }
    ];
}

/**
 * Follow what the parent hands one editor: Show Suggestions in its right-click menu, the panel
 * set to the parent's value, and the parent told of each toggle. The answer takes it all away.
 */
export function followSuggest(
    kit: SuggestKit,
    editorId: string,
    suggest: EditorSuggest | undefined
): Monaco.IDisposable {
    if (suggest === undefined) return { dispose: () => undefined };
    const item = kit.menuItem(editorId, suggest.label);
    kit.setDetails(suggest.details);
    const told = kit.onDetails(suggest.ondetails);
    return {
        dispose: () => {
            item.dispose();
            told.dispose();
        }
    };
}
