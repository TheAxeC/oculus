// Layer 1, data. The JSON Schema of a repository's `.oculus/settings.yml`, which is what
// `parseRepoSettings` reads: one top-level key, `languages`, a map from a language the editor
// registers to a record of the fields of the `editor.languages` entry of the options catalog. Any
// other top-level key is a skipped entry of the Languages row, so the schema marks it, and so does
// a language name or a field the editor does not have.

import type { CatalogEntry, Source } from '../options.ts';
import type { JsonSchema } from '../../../../snapshot/schema/json.ts';
import {
    definitionsOf,
    recordSchema,
    withoutKey,
    type Definitions,
    type OptionLists
} from './options.ts';

/** The path of the entry that describes a language's record in the options catalog. */
const LANGUAGES_ENTRY = 'editor.languages';

/** The source whose items name the languages. */
const LANGUAGES_SOURCE: Source = 'languages';

/** The schema of `.oculus/settings.yml`, or null while the catalog holds no `editor.languages`. */
export function settingsSchema(
    behavior: Record<string, CatalogEntry> | undefined,
    lists: OptionLists
): JsonSchema | null {
    const entry = behavior === undefined ? undefined : behavior[LANGUAGES_ENTRY];
    if (entry?.fields === undefined) return null;
    const names = lists.items(LANGUAGES_SOURCE) ?? [];
    const defs: Definitions = new Map();
    const record = recordSchema(withoutKey(entry.fields), lists, defs);
    const properties: Record<string, JsonSchema> = {};
    for (const name of names) properties[name] = { $ref: '#/definitions/language' };
    return {
        type: 'object',
        properties: {
            languages: {
                type: ['object', 'null'],
                properties,
                additionalProperties: false,
                description: entry.help
            }
        },
        additionalProperties: false,
        definitions: {
            ...definitionsOf(defs),
            language: {
                ...record,
                type: ['object', 'null'],
                description:
                    'The editor options of one language for the files of this repository, with the fields of the editor.languages option.'
            }
        }
    };
}
