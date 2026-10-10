// Layer 1, data. The schemas that do not describe a hub data file: the side projects' manifest, the
// decks, a repository's `.oculus/cpp.yml`, and the files of oculus's own configuration. Each is
// made from a schema file under config/schemas/ (written in the hub's `schema:` vocabulary) or from
// the reader of the file, and each is matched to files by a rule: the globs of the files it
// governs, relative to the root they are served from. The side projects' manifest is made through
// the translation the research manifest's schema goes through (schema/manifest.ts).
//
// These schemas serve the editor. The readers of their files report their own findings, so the gate
// of the snapshot does not check these files again.

import { isSideTier, MANIFEST } from '../../helpers/hub-names.ts';
import type { PortfolioConfig, RegistryName, SchemaField } from '../../model/index.ts';
import { fieldsOf } from './field.ts';
import { fileSchema } from './hub.ts';
import type { JsonSchema } from './json.ts';
import { VOCAB_FILE_KEYS } from '../../shapes/catalog-files.ts';
import { REGISTRIES, VOCAB_PREFIX } from './lists.ts';
import { manifestSchema, sideSchema } from './manifest.ts';
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
    { key: 'side_project_schema', file: 'side-project-schema.yml' },
    { key: 'deck_schema', file: 'deck-schema.yml' },
    { key: 'cpp_schema', file: 'cpp-schema.yml' }
] as const;

/**
 * What is wrong with the schema files themselves: a `from` that names no registry, `projects` or
 * vocab list, and a `when` that names a field its record does not declare. Which keys a source
 * holds on disk does not matter here, so the check needs the merged configuration alone.
 */
export function schemaFileProblems(
    merged: Record<string, unknown>
): { file: string; problems: SchemaProblem[] }[] {
    const lists: Lists = (source) => {
        if (source === 'projects' || REGISTRIES.includes(source as RegistryName)) return [];
        const key = source.startsWith(VOCAB_PREFIX) ? source.slice(VOCAB_PREFIX.length) : '';
        return VOCAB_FILE_KEYS.includes(key) && merged[key] !== undefined ? [] : undefined;
    };
    return SCHEMA_FILES.map(({ key, file }) => {
        const problems: SchemaProblem[] = [];
        const ctx: Context = { lists, problems, at: '' };
        if (key === 'manifest_schema') manifestSchema(merged[key], ctx);
        else if (key === 'side_project_schema') sideSchema(merged[key], ctx);
        else sections(merged[key], lists, problems);
        return { file, problems };
    });
}

/** The schemas of the side projects, the decks and the C++ file. */
export function projectFileSchemas(config: PortfolioConfig, lists: Lists): NamedSchema[] {
    const found: NamedSchema[] = [];
    const scans = config.scan
        .filter((rule) => !isSideTier(rule))
        .map((rule) => rule.dir.replace(/\/+$/, ''));
    const side = config.scan.filter(isSideTier).map((rule) => rule.dir.replace(/\/+$/, ''));
    const sideProject = sideSchema(config.merged.side_project_schema, {
        lists,
        problems: [],
        at: ''
    });
    if (sideProject !== null) {
        // The manifest of a repository read as a research project is governed by the manifest
        // schema (run.ts, repositoryReach), whose rule comes first.
        found.push({
            name: 'side-project',
            schema: sideProject,
            rule: {
                hub: side.map((dir) => `${dir}/*/${MANIFEST}`),
                every: [`${OCULUS}/${MANIFEST}`]
            }
        });
    }
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
