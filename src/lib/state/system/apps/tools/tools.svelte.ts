// Layer 2, client state. What the apps' hosts registered with the tools, as the page uses it: the
// file decorations of the Files view (decorations.svelte.ts), the source controls of the
// Repositories view (scm.svelte.ts), the languages the editor is given (languages.svelte.ts), and
// the terminal this page shows, which the page reports to the host that made it so
// `window.activeTerminal` follows. The `app-tools` channel carries the hosts' registrations; every
// act of the reader goes back through `POST /api/app-host`.

import type { LanguageMap } from '../../../../data/helpers/files/languages.ts';
import type { AppRow, AppToolsHost, AppToolsPayload } from '../../../../data/model/index.ts';
import type { WritesStore } from '../../../shared/stores/shapes.ts';
import { createDecorations } from './decorations.svelte.ts';
import { createLanguages } from './languages.svelte.ts';
import { createScm } from './scm.svelte.ts';

/** What the store reads of the rest of the client. */
export type AppToolsDeps = {
    payload: () => AppToolsPayload | null;
    /** The apps found, whose manifests name the editor's languages. */
    rows: () => AppRow[];
    /** The map of file names to languages with the apps' rules joined. */
    languageMap: () => LanguageMap;
    post: WritesStore['postCommand'];
    /** Tell the reader a line. */
    say: (message: string) => void;
    frame: (run: () => void) => void;
    /** The terminal an app made that this page shows in a Terminal tab, or null. */
    activeTerminal: () => { app: string; id: string } | null;
};

export type AppToolsStore = ReturnType<typeof createAppTools>;

export function createAppTools(deps: AppToolsDeps) {
    const decorations = createDecorations({
        payload: deps.payload,
        post: deps.post,
        frame: deps.frame
    });
    const scm = createScm({ payload: deps.payload, post: deps.post, say: deps.say });
    const languages = createLanguages({
        rows: deps.rows,
        hosts: () => deps.payload()?.hosts ?? [],
        map: deps.languageMap,
        post: deps.post
    });
    let reported = '';

    $effect.root(() => {
        $effect(() => {
            const shown = deps.activeTerminal();
            const key = shown === null ? '' : `${shown.app}\u0000${shown.id}`;
            if (key === reported) return;
            reported = key;
            if (shown !== null) {
                void deps.post('/api/app-host', {
                    action: 'terminal',
                    app: shown.app,
                    id: shown.id
                });
            }
        });
    });

    return {
        decorations,
        scm,
        languages,
        /** What each running host registered. */
        hosts: (): AppToolsHost[] => deps.payload()?.hosts ?? []
    };
}
