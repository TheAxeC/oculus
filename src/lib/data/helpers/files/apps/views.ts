// Layer 1, data. The ids of the views an app's contributions are drawn in. A view the app declares
// under `contributes.views` is `appview:<app view id, percent-encoded>#<the declared id>`; the
// panels apps open and the custom editors share one view each, which a tab's state tells apart.

/** The view every web view panel of an app is drawn in; its state names the app and the panel. */
export const PANEL_VIEW = 'app-panel';

/** The view every custom editor of an app is drawn in; its state names the app and the file. */
export const EDITOR_VIEW = 'app-editor';

const PREFIX = 'appview:';

/** The view id of a view an app declares, from the app's view id and the declared id. */
export function contributedViewId(app: string, view: string): string {
    return `${PREFIX}${encodeURIComponent(app)}#${view}`;
}

/** The app's view id and the declared id a contributed view id carries, or null. */
export function splitContributedView(id: string): { app: string; view: string } | null {
    if (!id.startsWith(PREFIX)) return null;
    const rest = id.slice(PREFIX.length);
    const at = rest.indexOf('#');
    if (at <= 0) return null;
    try {
        return { app: decodeURIComponent(rest.slice(0, at)), view: rest.slice(at + 1) };
    } catch {
        return null;
    }
}
