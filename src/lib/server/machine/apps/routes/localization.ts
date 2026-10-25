// Layer 2, server. The display languages the held apps contribute, as the source loadConfig reads
// the language `locale` names from (data/sources/config/merge/language.ts). A language is the
// `localizations` entry of an approved, enabled app whose `languageId` is the locale; its words are
// the `.yml` files of the app's recorded files under the entry's folder for oculus, read as
// theme.ts reads a theme's file, inside the app's own files only. The first such app, in the Views
// list's order, gives the language.
//
// The stamp says what the languages are made of: every active app's display languages with the
// size and times of each file of their folders. The config cache keeps a parse while it is the
// same, and the apps watcher republishes the config when it moves (watch/apps.ts).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
    Language,
    LanguageFile,
    LanguageSource
} from '../../../../data/sources/config/merge/language.ts';
import { activeApps, type AppsHeld, type HeldApp } from '../read/held.ts';

/** The suffix of a file of a display language's folder. */
const YML = '.yml';

/** The recorded files of one display language's folder of an app, in path order. */
function folderFiles(app: HeldApp, folder: string): HeldApp['files'] {
    return app.files.filter((one) => one.path.startsWith(`${folder}/`) && one.path.endsWith(YML));
}

/** The display language `locale` an active app of `held` contributes, or null for none. */
function languageOf(held: AppsHeld, locale: string): Language | null {
    for (const app of activeApps(held)) {
        const entry = app.row.contributes.localizations.find((one) => one.languageId === locale);
        if (entry === undefined) continue;
        const files = folderFiles(app, entry.path).map((one): LanguageFile => {
            const file = join(app.row.folder, one.path);
            try {
                return { file, text: readFileSync(file, 'utf8') };
            } catch (error) {
                return { file, why: error instanceof Error ? error.message : String(error) };
            }
        });
        return { app: app.row.title, files };
    }
    return null;
}

/** The source of display languages over the apps the watcher holds at each read. */
export function languageSource(held: () => AppsHeld): LanguageSource {
    return (locale) => languageOf(held(), locale);
}

/** What the display languages of `held` are made of, which moves when one of them changes. */
export function languageStamp(held: AppsHeld): string {
    return activeApps(held)
        .flatMap((app) =>
            app.row.contributes.localizations.map((entry) => {
                const files = folderFiles(app, entry.path)
                    .map((one) => `${one.path}:${one.size}:${one.mtimeMs}:${one.ctimeMs}`)
                    .join(',');
                return `${app.id}:${entry.languageId}:${entry.path}:${files}`;
            })
        )
        .join('\n');
}
