// Layer 1, data. The schemas of oculus's own files: the config files (`behavior.yml` and the
// others, from their sections of the options catalog), the catalogs and text files (from their
// whole-file zod shapes), the schema files of config/schemas/ and a repository's
// `.oculus/settings.yml`. A config file is served from the engine's config folder and also as
// `tools/oculus/config/` of the hub; `local.yml` is the machine's own and has no schema.
//
// These schemas serve the editor. The readers of their files report their own findings.

import type { z } from 'zod';
import { codeThemeIds, CODE_TOKENS } from '../../../../helpers/editor/code-themes.ts';
import { ENGINE_IN_HUB } from '../../../../helpers/hub-names.ts';
import type { PortfolioConfig, RawPortfolio } from '../../../../model/index.ts';
import { registered } from '../../../../prose/languages.ts';
import { hubLists } from '../../../../snapshot/schema/lists.ts';
import {
    CATALOG_FILES,
    manifestSchemaFileShape,
    textFileShape
} from '../../../../shapes/catalog-files.ts';
import { LOCAL_NAME } from '../../local.ts';
import { catalogOf, configItems, type Source } from '../options.ts';
import { shapeSchema, type JsonSchema } from '../../../../snapshot/schema/json.ts';
import { SCHEMA_BLOCK, SCHEMA_DEFINITIONS } from '../../../../snapshot/schema/record.ts';
import { APP_SETTINGS_KEY } from '../../../../helpers/files/apps/settings.ts';
import { appSettingsSchema, optionsSchema, type OptionLists } from './options.ts';
import { settingsSchema } from './settings.ts';
import type { NamedSchema } from '../../../../snapshot/schema/set.ts';
import { SCHEMA_FILES } from '../../../../snapshot/schema/static.ts';

/** The globs of a file of the engine's config folder: in its own root and inside the hub. */
function configRule(...globs: string[]): NamedSchema['rule'] {
    return { engine: globs, hub: globs.map((glob) => `${ENGINE_IN_HUB}/${glob}`) };
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

/** The schemas of the config folder's files and of the repository settings file. */
export function engineSchemas(raw: RawPortfolio, config: PortfolioConfig): NamedSchema[] {
    const merged = config.merged;
    const lists: OptionLists = { merged, items: optionSource(raw, config) };
    const catalog = catalogOf(merged);
    const found: NamedSchema[] = [];
    for (const [file, entries] of Object.entries(catalog)) {
        if (file === LOCAL_NAME) continue;
        const extra: Record<string, JsonSchema> =
            file === 'behavior.yml' ? { [APP_SETTINGS_KEY]: appSettingsSchema() } : {};
        found.push({
            name: `config/${file.replace(/\.yml$/, '')}`,
            schema: optionsSchema(entries, lists, extra),
            rule: configRule(file)
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
