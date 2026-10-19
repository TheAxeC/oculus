// Layer 1, data. The schemas of oculus's own files: the config files (`behavior.yml` and the
// others, from their sections of the options catalog), the catalogs and text files (from their
// whole-file zod shapes), the schema files of config/schemas/ and a repository's
// `.oculus/settings.yml`. A config file is governed in each workspace folder that holds oculus's
// own config folder, below the path of that folder in it; `local.yml` is governed in the `.oculus`
// folder of each hub and in the config folder.
//
// A hub's own settings file, `.oculus/config.yml`, is governed in the hub: its keys are those of
// the hub list (data/helpers/hub-names.ts), each as its options-catalog entry gives it, or, for a
// key of a catalog file such as the career words of catalogs/vocab.yml, as that file's whole-file
// shape gives it; any other key is not declared.
//
// These schemas serve the editor. The readers of their files report their own findings.

import type { z } from 'zod';
import { codeThemeIds, CODE_TOKENS } from '../../../../helpers/editor/code-themes.ts';
import type { PortfolioConfig, RawPortfolio } from '../../../../model/index.ts';
import { registered } from '../../../../prose/languages.ts';
import { hubLists } from '../../../../snapshot/schema/lists.ts';
import {
    CATALOG_FILES,
    manifestSchemaFileShape,
    textFileShape
} from '../../../../shapes/catalog-files.ts';
import { LOCAL_NAME } from '../../local.ts';
import {
    catalogOf,
    configItems,
    type Catalog,
    type CatalogEntry,
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

/**
 * The globs of the machine's own file: the `.oculus` folder at the top of any served root, which is
 * where a hub keeps it, and oculus's own config folder.
 */
function localRule(): NamedSchema['rule'] {
    return { every: [`${ROOT_FOLDER}/${LOCAL_NAME}`], engine: [LOCAL_NAME] };
}

/** The schema of a file whose top-level key holds a `schema:` block of the hub's vocabulary. */
function blockFileSchema(key: string): JsonSchema {
    return {
        type: 'object',
        properties: { [key]: SCHEMA_BLOCK },
        additionalProperties: false,
        definitions: SCHEMA_DEFINITIONS
    };
}

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
                return [CODE_TOKENS, ...codeThemeIds()];
            case 'domains':
                return hub.domains;
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

/**
 * The schema of a hub's `.oculus/config.yml`: each key of the hub list as the options catalog
 * describes it in its config file, `app_settings` as config/behavior.yml's, and a key of a catalog
 * file as that file's shape gives it.
 */
function hubConfigSchema(catalog: Catalog, lists: OptionLists): JsonSchema {
    const entries: Record<string, CatalogEntry> = {};
    const extra: Record<string, JsonSchema> = {};
    for (const key of hubKeys()) {
        const file = hubFileOf(key) ?? '';
        const ofFile: Partial<Record<string, CatalogEntry>> = catalog[file] ?? {};
        const entry = ofFile[key];
        if (key === APP_SETTINGS_KEY) extra[key] = appSettingsSchema();
        else if (entry !== undefined) entries[key] = entry;
        else {
            const schema = catalogKeySchema(file, key);
            if (schema !== undefined) extra[key] = schema;
        }
    }
    return optionsSchema(entries, lists, extra);
}

/** The schemas of the config folder's files and of the repository settings file. */
export function engineSchemas(raw: RawPortfolio, config: PortfolioConfig): NamedSchema[] {
    const merged = config.merged;
    const lists: OptionLists = { merged, items: optionSource(raw, config) };
    const catalog = catalogOf(merged);
    const found: NamedSchema[] = [];
    for (const [file, entries] of Object.entries(catalog)) {
        const extra: Record<string, JsonSchema> =
            file === 'behavior.yml' ? { [APP_SETTINGS_KEY]: appSettingsSchema() } : {};
        found.push({
            name: `config/${file.replace(/\.yml$/, '')}`,
            schema: optionsSchema(entries, lists, extra),
            rule: file === LOCAL_NAME ? localRule() : configRule(file)
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
            schema: blockFileSchema(key),
            rule: configRule(`schemas/${file}`)
        });
    }
    found.push({
        name: 'hub-config',
        schema: hubConfigSchema(catalog, lists),
        rule: { hub: [HUB_FILE] }
    });
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
