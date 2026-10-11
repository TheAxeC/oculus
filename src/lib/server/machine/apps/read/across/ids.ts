// Layer 2, server. The ids two apps may not both declare. An id an app adds to the shell (a
// command, a view container, a view, a custom editor's `viewType`, a setting key) starts with the
// app's name and a dot, so two apps of different names never meet; two apps may share a name (a
// machine app and a root app, or the root apps of two roots). The app that comes later in the Views
// list's order, which is the order the apps are read in, is refused when it declares an id an
// earlier one already declares, with a finding that names both apps. An app that is refused here
// declares no id for the apps after it.

import { join } from 'node:path';
import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import type { Finding } from '../../../../../data/model/index.ts';
import type { AppsHeld } from '../held.ts';
import { declaredIds } from '../contributes/reader.ts';
import { findingKey } from '../manifest.ts';

/** Refuse, in place, each app that declares an id an earlier app of the read declares. */
export function dropTakenIds(held: AppsHeld, catalog: TextCatalog): void {
    const owner = new Map<string, string>();
    const kept: AppsHeld['apps'] = [];
    for (const app of held.apps) {
        const ids = declaredIds(app.row.contributes).all;
        const taken = ids.find((id) => owner.has(id));
        if (taken !== undefined) {
            const message = findingText(
                catalog,
                'findings.apps.id_taken',
                app.id,
                taken,
                owner.get(taken) ?? ''
            );
            held.findings.push({
                file: join(app.row.folder, 'app.yml'),
                key: findingKey(app.row.root, app.row.name),
                message
            } satisfies Finding);
            continue;
        }
        for (const id of ids) owner.set(id, app.id);
        kept.push(app);
    }
    held.apps = kept;
}
