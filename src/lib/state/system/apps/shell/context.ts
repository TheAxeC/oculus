// Layer 2, client state. The context keys the page evaluates an app's `when` clauses against, in
// VS Code's names: what has the focus, the resource a menu or a key acts on, the view and the
// tree row, and the keys the apps set themselves with `executeCommand('setContext', key, value)`.
// A key nothing set is undefined, as in VS Code. The clause is read by monaco-editor's
// `ContextKeyExpr` (data/helpers/files/apps/when.ts), which is also the evaluator.

import { whenHolds, type IContext } from '../../../../data/helpers/files/apps/when.ts';
import type { KeyPlatform } from '../../../../data/helpers/keys/keys.ts';
import type { ContextValue } from '../../../../data/model/index.ts';

/** What the page knows about the place a menu is drawn or a key is pressed in. */
export type ContextParts = {
    /** Whether a text editor holds the keyboard. */
    editorTextFocus?: boolean;
    /** Whether an editor, a text field or the editor's widgets hold the keyboard. */
    editorFocus?: boolean;
    /** The Monaco language of the editor's file. */
    editorLangId?: string;
    /** The file the key or menu acts on. */
    resource?: { root: string; path: string; language: string } | null;
    /** Whether the resource is a folder. */
    folder?: boolean;
    /** The id of the view whose menu it is. */
    view?: string;
    /** The `contextValue` of the tree row. */
    viewItem?: string;
    /** The id of the app view that holds the focus. */
    focusedView?: string;
    /** The `viewType` of the custom editor on screen. */
    activeCustomEditorId?: string;
    /** The `viewType` of the web view panel on screen. */
    activeWebviewPanelId?: string;
};

/** The extension of a file name with its dot, or the empty string. */
function extname(name: string): string {
    const dot = name.lastIndexOf('.');
    return dot <= 0 ? '' : name.slice(dot);
}

/** The keys the parts stand for. */
function keysOf(parts: ContextParts, platform: KeyPlatform): Record<string, ContextValue> {
    const resource = parts.resource ?? null;
    const name = resource === null ? '' : (resource.path.split('/').at(-1) ?? '');
    return {
        isMac: platform === 'mac',
        isLinux: platform === 'linux',
        isWindows: platform === 'win',
        editorTextFocus: parts.editorTextFocus === true,
        editorFocus: parts.editorFocus === true || parts.editorTextFocus === true,
        ...(parts.editorLangId === undefined ? {} : { editorLangId: parts.editorLangId }),
        ...(resource === null
            ? {}
            : {
                  resourceExtname: extname(name),
                  resourceFilename: name,
                  resourceLangId: resource.language,
                  resourcePath: `${resource.root}/${resource.path}`
              }),
        explorerResourceIsFolder: parts.folder === true,
        ...(parts.view === undefined ? {} : { view: parts.view }),
        ...(parts.viewItem === undefined ? {} : { viewItem: parts.viewItem }),
        ...(parts.focusedView === undefined ? {} : { focusedView: parts.focusedView }),
        ...(parts.activeCustomEditorId === undefined
            ? {}
            : { activeCustomEditorId: parts.activeCustomEditorId }),
        ...(parts.activeWebviewPanelId === undefined
            ? {}
            : { activeWebviewPanelId: parts.activeWebviewPanelId })
    };
}

/** The context of a place on a platform, with the keys the apps set. */
export function contextOf(
    parts: ContextParts,
    platform: KeyPlatform,
    set: Readonly<Record<string, ContextValue>>
): IContext {
    const keys = { ...set, ...keysOf(parts, platform) };
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters -- IContext declares getValue with this signature
    return { getValue: <T>(key: string): T | undefined => keys[key] as T | undefined };
}

/** Whether a clause holds in a context; an empty clause holds. */
export function holds(when: string, context: IContext): boolean {
    return whenHolds(when, context);
}
