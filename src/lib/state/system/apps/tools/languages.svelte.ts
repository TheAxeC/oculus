// Layer 2, client state. What the acting apps give the editor: the files their manifests name
// (grammars, language configurations, snippets, schemas) read from the server once each, and the
// kit the editor is given (data/helpers/files/apps/tools/language-kit.ts). A file is asked for the
// first time a row that names it acts, held under the app's content hash so a changed app asks
// again, and forgotten when no acting row names it. A file the server cannot give is held as
// missing, so it is asked for once per hash. The kit is empty of a file's part until the file
// arrives, and changes once it does.

import { untrack } from 'svelte';
import { appActive, appViewId } from '../../../../data/helpers/files/apps/apps.ts';
import {
    kitFiles,
    languageKit,
    type KitApp,
    type KitFileKind
} from '../../../../data/helpers/files/apps/tools/language-kit.ts';
import type { LanguageMap } from '../../../../data/helpers/files/languages.ts';
import type { AppLanguageKit, AppRow, AppToolsHost } from '../../../../data/model/index.ts';
import { SERVED_LANGUAGES } from '../../../../data/prose/lsp-servers.ts';
import type { WritesStore } from '../../../shared/stores/shapes.ts';

/** What the store reads of the rest of the client. */
export type LanguagesDeps = {
    rows: () => AppRow[];
    hosts: () => AppToolsHost[];
    /** The map of file names to languages with the apps' rules joined. */
    map: () => LanguageMap;
    post: WritesStore['postCommand'];
};

/** The key a file is held by. */
function keyOf(app: string, hash: string, kind: KitFileKind, path: string): string {
    return `${app}\u0000${hash}\u0000${kind}\u0000${path}`;
}

export function createLanguages(deps: LanguagesDeps) {
    /** The JSON of each file read, or null for one the server could not give. */
    const held = new Map<string, unknown>();
    const asked = new Set<string>();
    let version = $state(0);
    /** Read the counter, so the reader depends on every change of the kit. */
    const seen = (): number => version;

    const acting = $derived(deps.rows().filter((row) => appActive(row)));

    async function ask(key: string, app: string, kind: KitFileKind, path: string): Promise<void> {
        const posted = await deps.post('/api/app-host', { action: 'file', app, kind, path });
        if (!asked.has(key)) return;
        held.set(key, posted.ok && posted.body.ok === true ? (posted.body.value ?? null) : null);
        version += 1;
    }

    $effect.root(() => {
        $effect(() => {
            const rows = acting;
            untrack(() => {
                const wanted = new Set<string>();
                for (const row of rows) {
                    const app = appViewId(row.root, row.name);
                    for (const file of kitFiles(row.contributes)) {
                        const key = keyOf(app, row.hash, file.kind, file.path);
                        wanted.add(key);
                        if (asked.has(key)) continue;
                        asked.add(key);
                        void ask(key, app, file.kind, file.path);
                    }
                }
                let dropped = false;
                for (const key of [...asked]) {
                    if (wanted.has(key)) continue;
                    asked.delete(key);
                    held.delete(key);
                    dropped = true;
                }
                if (dropped) version += 1;
            });
        });
    });

    const kit = $derived.by((): AppLanguageKit => {
        void seen();
        const apps: KitApp[] = acting.map((row) => {
            const app = appViewId(row.root, row.name);
            return {
                app,
                contributes: row.contributes,
                read: (kind, path) => held.get(keyOf(app, row.hash, kind, path)) ?? undefined
            };
        });
        return languageKit(apps, SERVED_LANGUAGES, deps.hosts(), deps.map());
    });

    return {
        /** What the acting apps give the editor. */
        kit: (): AppLanguageKit => kit,
        /** The languages the apps add, as the language list names them. */
        names: (): { name: string; label: string }[] =>
            kit.languages.map((one) => ({ name: one.id, label: one.label }))
    };
}
