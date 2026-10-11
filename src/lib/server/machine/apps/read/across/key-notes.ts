// Layer 2, server. The keybindings of the apps that are not bound, as findings that leave the app
// offered. A binding is not bound when its first chord is a key oculus takes or when an earlier app
// binds the same chords under the same `when` (data/helpers/files/apps/bound-keys.ts, which the
// page resolves keys with too). The bindings are judged on each platform, and a binding that is
// left out on several is told once.

import { join } from 'node:path';
import { appActive } from '../../../../../data/helpers/files/apps/apps.ts';
import { boundKeys, type KeyNote } from '../../../../../data/helpers/keys/bound-keys.ts';
import type { KeyPlatform } from '../../../../../data/helpers/keys/keys.ts';
import { railChordLetters } from '../../../../../data/helpers/keys/oculus/rail-letters.ts';
import { findingText, type TextCatalog } from '../../../../../data/helpers/finding-text.ts';
import type { AppsHeld } from '../held.ts';
import { findingKey } from '../manifest.ts';

const PLATFORMS: readonly KeyPlatform[] = ['mac', 'linux', 'win'];

/** The words an oculus key is taken by, as the finding names them. */
const TAKERS = {
    workbench: 'the workbench',
    palette: 'the palette',
    editor: 'the editor',
    desktop: 'the desktop app'
} as const;

/** Add a finding to `held` for each binding of an active app that is not bound. */
export function noteUnboundKeys(
    held: AppsHeld,
    catalog: TextCatalog,
    config: Record<string, unknown>
): void {
    const apps = held.apps
        .filter((app) => appActive(app.row))
        .map((app) => ({
            id: app.id,
            title: app.row.title,
            keybindings: app.row.contributes.keybindings
        }));
    const letters = railChordLetters(config);
    const told = new Set<string>();
    for (const platform of PLATFORMS) {
        for (const note of boundKeys(apps, platform, letters).notes) {
            const text = noteText(catalog, note);
            const once = `${note.app}\n${text}`;
            if (told.has(once)) continue;
            told.add(once);
            const app = held.apps.find((one) => one.id === note.app);
            if (app === undefined) continue;
            held.findings.push({
                file: join(app.row.folder, 'app.yml'),
                key: findingKey(app.row.root, app.row.name),
                message: text
            });
        }
    }
}

/** The finding that says why a binding is not bound. */
function noteText(catalog: TextCatalog, note: KeyNote): string {
    if (typeof note.by === 'string') {
        return findingText(
            catalog,
            'findings.apps.key_oculus',
            note.text,
            note.binding.command,
            TAKERS[note.by]
        );
    }
    return findingText(
        catalog,
        'findings.apps.key_app',
        note.text,
        note.binding.command,
        note.by.title
    );
}
