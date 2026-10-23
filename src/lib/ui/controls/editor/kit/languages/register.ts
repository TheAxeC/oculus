// Layer 3, primitive. The acting apps' languages put into Monaco: each language an app adds is
// registered (an id Monaco has not seen is made, one it knows is kept), its configuration file
// given through Monaco's language configuration service, its snippets offered by completion, and
// the JSON schemas the apps bring given to Monaco's JSON support beside the schemas the editor
// already holds. A configuration is given at a rank above the settings the editor gives at start
// (rite/settings.ts), so an app's settings of a language win over oculus's and Monaco's for every
// field they hold. The kit calls `applyAppLanguages` once the page loaded the editor and again for
// every change of what the apps give; what an earlier call put in is taken away first, so a
// language an app stopped adding keeps its id (Monaco cannot unregister one) and loses its
// configuration, snippets and schemas.
//
// A schema's `fileMatch` is matched by Monaco against the address of the model, whose path is
// `/<tab instance>/<path from the root>`, so an entry that is not already rooted or started with
// `**` is given a `**/` in front (`schemaGlob`).

import type * as Monaco from 'monaco-editor';
import { schemaGlob } from '$lib/data/helpers/files/apps/tools/language-kit';
import type { AppLanguageKit } from '$lib/data/helpers/files/apps/tools/language-kit';
import { languageConfiguration } from './configuration';
import { OCULUS_RANK, type Registry } from '../rite/settings';
import { registerSnippets } from './snippets';

/** What an earlier call put in, to take away at the next one. */
export type Applied = { dispose(): void };

/** The rank an app's settings of a language are given at, above oculus's own. */
const APP_RANK = OCULUS_RANK + 1;

/**
 * Put the kit into Monaco, taking away what `before` put in; the languages' settings go to
 * `settings`, Monaco's language configuration service.
 */
export function applyAppLanguages(
    monaco: typeof Monaco,
    settings: Registry,
    kit: AppLanguageKit,
    before: Applied | null
): Applied {
    before?.dispose();
    const known = new Set(monaco.languages.getLanguages().map((language) => language.id));
    const owned: { dispose(): void }[] = [];
    for (const language of kit.languages) {
        if (!known.has(language.id)) {
            monaco.languages.register({ id: language.id, aliases: [language.label] });
            known.add(language.id);
        }
        if (language.configuration !== null) {
            owned.push(
                settings.register(
                    language.id,
                    languageConfiguration(language.configuration),
                    APP_RANK
                )
            );
        }
    }
    owned.push(registerSnippets(monaco, kit.snippets));
    monaco.json.jsonDefaults.setDiagnosticsOptions({
        ...monaco.json.jsonDefaults.diagnosticsOptions,
        schemas: kit.schemas.map((one) => ({
            uri: `oculus-app:///${encodeURI(one.url)}`,
            fileMatch: one.fileMatch.map(schemaGlob),
            schema: one.schema as object
        }))
    });
    return { dispose: () => owned.forEach((one) => one.dispose()) };
}
