// Layer 1, data. The schemas that do not describe a hub data file: the decks, a repository's
// `.oculus/cpp.yml`, and the files of oculus's own configuration. Each is made from a schema file
// under config/schemas/ (written in the hub's `schema:` vocabulary) or from the reader of the file,
// and each is matched to files by a rule: the globs of the files it governs, relative to the root
// they are served from.
//
// These schemas serve the editor. The readers of their files report their own findings, so the gate
// of the snapshot does not check these files again.

import type { PortfolioConfig, SchemaField } from '../../model/index.ts';
import { PROJECTS_TARGET, VOCAB_PREFIX, collectionFiles } from '../../helpers/hub-names.ts';
import { fieldsOf } from './field.ts';
import { fileSchema } from './hub.ts';
import type { JsonSchema } from './json.ts';
import { VOCAB_FILE_KEYS } from '../../shapes/catalog-files/vocab.ts';
import { vocabLists } from './lists.ts';
import { manifestGroupProblems, manifestSchema } from './manifest.ts';
import type { Context, Lists, SchemaProblem } from './record.ts';
import type { NamedSchema } from './set.ts';

/** The folder of a repository that holds oculus's own files. */
const OCULUS = '.oculus';

/** The schema of a file whose top-level keys are the fields of a schema file, or none. */
function sections(value: unknown, lists: Lists, problems: SchemaProblem[] = []): JsonSchema | null {
    const fields: SchemaField[] | undefined = fieldsOf(value);
    if (fields === undefined) return null;
    const ctx: Context = { lists, problems, at: '' };
    return fileSchema(fields, { kind: 'sections', list: '', written: [], own: false }, ctx);
}

/** The schema files of config/schemas/, each with the merged key its content is read under. */
export const SCHEMA_FILES = [
    { key: 'manifest_schema', file: 'manifest-schema.yml' },
    { key: 'deck_schema', file: 'deck-schema.yml' },
    { key: 'cpp_schema', file: 'cpp-schema.yml' }
] as const;

/**
 * Whether a `foreign_key:` target names a list: `projects`, a key of the merged `collections:`
 * list, or `vocab.<name>` where `<name>` is a list `vocabLists` reads from the merged
 * configuration, so `vocab.<key>` for a key of config/catalogs/vocab.yml set there and
 * `vocab.<key>.<field>` for a field a row of that key carries as `true`. An empty target names no
 * list. Which keys a list holds on disk does not matter here.
 */
export function namesList(target: string, merged: Record<string, unknown>): boolean {
    if (target === PROJECTS_TARGET) return true;
    if (!target.startsWith(VOCAB_PREFIX)) {
        return collectionFiles(merged.collections).some((one) => one.key === target);
    }
    return Object.hasOwn(vocabLists(merged, VOCAB_FILE_KEYS), target.slice(VOCAB_PREFIX.length));
}

/**
 * What is wrong with the schema files themselves: a `foreign_key` that names no collection,
 * `projects` or vocab list, a `when` that names a field its record does not declare, and in the
 * manifest schema file a map of dotted fields with no help line in `groups:` or a line for no such
 * map. Which keys a target holds on disk does not matter here, so the check needs the merged
 * configuration alone.
 */
export function schemaFileProblems(
    merged: Record<string, unknown>
): { file: string; problems: SchemaProblem[] }[] {
    const lists: Lists = (source) => (namesList(source, merged) ? [] : undefined);
    return SCHEMA_FILES.map(({ key, file }) => {
        const problems: SchemaProblem[] = [];
        const ctx: Context = { lists, problems, at: '' };
        if (key === 'manifest_schema') {
            manifestSchema(merged[key], ctx);
            problems.push(...manifestGroupProblems(merged[key], merged.groups));
        } else sections(merged[key], lists, problems);
        return { file, problems };
    });
}

/** The schemas of the decks and the C++ file. */
export function projectFileSchemas(config: PortfolioConfig, lists: Lists): NamedSchema[] {
    const found: NamedSchema[] = [];
    const scans = config.scan.map((rule) => rule.dir.replace(/\/+$/, ''));
    const deck = sections(config.merged.deck_schema, lists);
    if (deck !== null) {
        const decks = scans.map((dir) => `${dir}/**/present/present.yml`);
        if (config.portfolioDeck !== null) decks.push(`${config.portfolioDeck}/present.yml`);
        found.push({ name: 'deck', schema: deck, rule: { hub: decks } });
    }
    const cpp = sections(config.merged.cpp_schema, lists);
    if (cpp !== null) {
        found.push({ name: 'cpp', schema: cpp, rule: { every: [`${OCULUS}/cpp.yml`] } });
    }
    return found;
}
