// Layer 1, data. The schemas of oculus's own files: the defaults files (`defaults/behavior.yml`
// and the others, from their options files), the options files, catalogs and text files (from
// their whole-file zod shapes), the schema files of config/schemas/, a hub's `local.yml`, a
// workspace file and a repository's `.oculus/settings.yml`. A file of the config folder is governed
// in each workspace folder that holds oculus's own config folder, below the path of that folder in
// it; `local.yml` is governed in the `.oculus` folder of each hub.
//
// A hub's own settings file, `.oculus/config.yml`, is governed in the hub: its keys are those of
// the hub list (data/helpers/hub-names.ts), each as its option gives it, or, for a key of a catalog
// file such as the career words of catalogs/vocab.yml, as that file's whole-file shape gives it;
// any other key is not declared. A workspace file's `settings:` takes every option of the defaults
// files but the keys of the hub list, with the rows and keys that take oculus's entries out.
//
// A group of dotted options is described by its help line in the options file's `groups:`.
//
// These schemas serve the editor. The readers of their files report their own findings.

import type { z } from 'zod';
import { codeThemeIds, CODE_TOKENS } from '../../../../helpers/editor/code-themes.ts';
import type { PortfolioConfig, RawPortfolio } from '../../../../model/index.ts';
import { vscodeRuleIds } from '../../../../places/code-rules.ts';
import { registered } from '../../../../prose/languages.ts';
import { hubLists } from '../../../../snapshot/schema/lists.ts';
import { CATALOG_FILES } from '../../../../shapes/catalog-files.ts';
import { manifestSchemaFileShape } from '../../../../shapes/catalog-files/manifest.ts';
import { textFileShape } from '../../../../shapes/catalog-files/text.ts';
import { DEFAULTS_DIR } from '../../folder.ts';
import { LOCAL_NAME } from '../../local.ts';
import { SETTINGS_KEY } from '../../merge/workspace-layer.ts';
import { workspaceFileShape } from '../../merge/workspace-file.ts';
import {
    configItems,
    readCatalog,
    type Catalog,
    type CatalogEntry,
    type Groups,
    type Source
} from '../options.ts';
import { HUB_FILE, ROOT_FOLDER, hubFileOf, hubKeys } from '../../../../helpers/hub-names.ts';
import { shapeSchema, type JsonSchema } from '../../../../snapshot/schema/json.ts';
import { SCHEMA_BLOCK, SCHEMA_DEFINITIONS } from '../../../../snapshot/schema/record.ts';
import { APP_SETTINGS_KEY } from '../../../../helpers/files/apps/settings.ts';
import { appSettingsSchema, optionsSchema, type OptionLists } from './options.ts';
import { settingsSchema } from './settings.ts';
import type { NamedSchema } from '../../../../snapshot/schema/set.ts';
import { SCHEMA_FILES } from '../../../../snapshot/schema/static.ts';

/** The globs of a file of oculus's own config folder, in whichever workspace folder holds it. */
function configRule(...globs: string[]): NamedSchema['rule'] {
    return { engine: globs };
}

/** The rule of a hub's own `local.yml`: the `.oculus` folder at the top of any served root. */
function localRule(): NamedSchema['rule'] {
    return { every: [`${ROOT_FOLDER}/${LOCAL_NAME}`] };
}

/** The schema of a file whose top-level key holds a `schema:` block of the hub's vocabulary. */
function blockFileSchema(key: string, description: string): JsonSchema {
    return {
        type: 'object',
        properties: { [key]: { ...SCHEMA_BLOCK, description } },
        additionalProperties: false,
        definitions: SCHEMA_DEFINITIONS
    };
}

/** What the top key of each schema file of config/schemas/ but the manifest's holds. */
const BLOCK_HELP: Record<string, string> = {
    deck_schema:
        "The keys a deck's present.yml may hold, each a field with its type, its words and the values it takes, which the editor completes and checks.",
    cpp_schema:
        "The keys a repository's .oculus/cpp.yml may hold, each a field with its type, its words and the values it takes, which the editor completes and checks."
};

/** A schema made of a zod shape, as a named schema; none when the shape has no schema. */
function fromShape(name: string, shape: z.ZodType, rule: NamedSchema['rule']): NamedSchema[] {
    const schema = shapeSchema(shape);
    return schema === null ? [] : [{ name, schema, rule }];
}

/** The items of an options source this build holds: the config's, the languages, the registries. */
function optionSource(
    raw: RawPortfolio,
    config: PortfolioConfig
): (source: Source) => string[] | null {
    const hub = hubLists(raw);
    return (source) => {
        const derived = configItems(source, config.merged);
        if (derived !== null) return derived;
        switch (source) {
            case 'languages':
                return registered();
            case 'code_themes':
                return [CODE_TOKENS, ...codeThemeIds(config.merged, new Set(vscodeRuleIds()))];
            case 'domains':
                return hub.domains;
            case 'people':
                return hub.people;
            case 'clusters':
                return raw.registries.resources.entries
                    .filter((entry) => entry.kind === 'cluster' && entry.key !== '')
                    .map((entry) => entry.key);
            default:
                return null;
        }
    };
}

/** The schema a catalog file's whole-file shape gives one of its top-level keys, or none. */
function catalogKeySchema(file: string, key: string): JsonSchema | undefined {
    const shape = CATALOG_FILES.find((one) => one.file === file)?.shape;
    const schema = shape === undefined ? null : shapeSchema(shape);
    const properties = schema?.properties as Record<string, JsonSchema> | undefined;
    return properties !== undefined && Object.hasOwn(properties, key) ? properties[key] : undefined;
}

/** The help lines of the groups on the way to a dotted key, from its file's `groups:`. */
function groupsOf(lines: Record<string, string>, key: string): Record<string, string> {
    const steps = key.split('.');
    const found: Record<string, string> = {};
    for (let at = 1; at < steps.length; at += 1) {
        const group = steps.slice(0, at).join('.');
        if (Object.hasOwn(lines, group)) found[group] = lines[group];
    }
    return found;
}

/**
 * The schema of a hub's `.oculus/config.yml`: each key of the hub list as its option describes it
 * in its defaults file, under the groups that file describes, `app_settings` as the apps declare
 * it, and a key of a catalog file as that file's shape gives it.
 */
function hubConfigSchema(catalog: Catalog, groups: Groups, lists: OptionLists): JsonSchema {
    const entries: Record<string, CatalogEntry> = {};
    const extra: Record<string, JsonSchema> = {};
    let lines: Record<string, string> = {};
    for (const key of hubKeys()) {
        const file = hubFileOf(key) ?? '';
        const ofFile: Partial<Record<string, CatalogEntry>> = catalog[file] ?? {};
        const entry = ofFile[key];
        if (key === APP_SETTINGS_KEY) extra[key] = appSettingsSchema();
        else if (entry !== undefined) {
            entries[key] = entry;
            lines = { ...lines, ...groupsOf(groups[file] ?? {}, key) };
        } else {
            const schema = catalogKeySchema(file, key);
            if (schema !== undefined) extra[key] = schema;
        }
    }
    return optionsSchema(entries, lists, extra, lines);
}

/**
 * The schema of a workspace file: its folders and primary as its shape gives them, and under
 * `settings:` every option of the defaults files but the keys of the hub list, each group under
 * its help line, a keyed list taking `removed: true` and a map family a null key.
 */
function workspaceSchema(catalog: Catalog, groups: Groups, lists: OptionLists): JsonSchema | null {
    const schema = shapeSchema(workspaceFileShape);
    if (schema === null) return null;
    const hub = hubKeys();
    const entries: Record<string, CatalogEntry> = {};
    let lines: Record<string, string> = {};
    for (const [file, ofFile] of Object.entries(catalog)) {
        if (file === LOCAL_NAME) continue;
        for (const [key, entry] of Object.entries(ofFile)) {
            if (hub.includes(key)) continue;
            entries[key] = entry;
            lines = { ...lines, ...groupsOf(groups[file] ?? {}, key) };
        }
    }
    const properties = schema.properties as Record<string, JsonSchema>;
    const settings = optionsSchema(entries, { ...lists, overrides: true }, {}, lines);
    const { description } = properties[SETTINGS_KEY] as { description?: string };
    properties[SETTINGS_KEY] = { ...settings, type: ['object', 'null'], description };
    return schema;
}

/** The schemas of the config folder's files, the hub's own files and the repository settings. */
export function engineSchemas(raw: RawPortfolio, config: PortfolioConfig): NamedSchema[] {
    const merged = config.merged;
    const lists: OptionLists = { merged, items: optionSource(raw, config) };
    const { catalog, groups } = readCatalog(merged);
    const found: NamedSchema[] = [];
    for (const [file, entries] of Object.entries(catalog)) {
        const extra: Record<string, JsonSchema> =
            file === 'behavior.yml' ? { [APP_SETTINGS_KEY]: appSettingsSchema() } : {};
        found.push({
            name: `config/${file.replace(/\.yml$/, '')}`,
            schema: optionsSchema(entries, lists, extra, groups[file] ?? {}),
            rule: file === LOCAL_NAME ? localRule() : configRule(`${DEFAULTS_DIR}/${file}`)
        });
    }
    for (const one of CATALOG_FILES)
        found.push(...fromShape(one.name, one.shape, configRule(one.file)));
    found.push(...fromShape('text', textFileShape, configRule('text/**/*.yml')));
    found.push(
        ...fromShape(
            'schemas/manifest-schema',
            manifestSchemaFileShape,
            configRule('schemas/manifest-schema.yml')
        )
    );
    for (const { key, file } of SCHEMA_FILES) {
        if (key === 'manifest_schema') continue;
        found.push({
            name: `schemas/${file.replace(/\.yml$/, '')}`,
            schema: blockFileSchema(key, BLOCK_HELP[key] ?? ''),
            rule: configRule(`schemas/${file}`)
        });
    }
    found.push({
        name: 'hub-config',
        schema: hubConfigSchema(catalog, groups, lists),
        rule: { hub: [HUB_FILE] }
    });
    const workspace = workspaceSchema(catalog, groups, lists);
    if (workspace !== null) {
        found.push({
            name: 'workspace',
            schema: workspace,
            rule: { every: [`${ROOT_FOLDER}/workspaces/*.yml`] }
        });
    }
    const settings = settingsSchema(catalog['behavior.yml'], lists);
    if (settings !== null) {
        found.push({
            name: 'repo-settings',
            schema: settings,
            rule: { every: ['.oculus/settings.yml'] }
        });
    }
    return found;
}
