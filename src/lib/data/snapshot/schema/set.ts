// Layer 1, data. The set of generated schemas one snapshot build produces: each schema's text under
// its name, and the rules that say which file of which served root each one governs. The set is
// JSON-safe and carries no function, so the relay can hold the latest one and compare two of them
// by their texts.
//
// A file is matched by its path inside a served root and nothing else, with `node:path`'s
// `matchesGlob`. A schema is generated for a hub's files (`hub`) and for oculus's own config folder
// (`engine`), and `resolvedSchemas` turns those into the globs of the workspace folders that hold
// them, so a rule that reaches `schemaFor` names roots by their workspace names. A file no rule
// matches has no schema.

import { matchesGlob } from 'node:path';
import { schemaText, type JsonSchema } from './json.ts';

/**
 * One schema's reach: the globs, relative to a served root, of the files it governs. `hub` applies
 * in the hub the schema was generated for, `engine` in oculus's own config folder, `roots` in the
 * workspace folder of that name (the globs by the folder's name) and `every` in any root. `within`
 * narrows the rule to files that also match one of its globs, which is how a path condition of a
 * schema gives a variant its own reach.
 */
export type SchemaRule = {
    name: string;
    hub?: string[];
    engine?: string[];
    roots?: Record<string, string[]>;
    every?: string[];
    within?: string[];
};

/** The schemas of one build: their texts by name, and the rules in the order they are tried. */
export type SchemaSet = { rules: SchemaRule[]; texts: Record<string, string> };

/** One schema with the rule that matches it to files. */
export type NamedSchema = { name: string; schema: JsonSchema; rule: Omit<SchemaRule, 'name'> };

/** A set with the schemas added to it, their rules after the rules the set holds. */
export function withSchemas(set: SchemaSet, added: NamedSchema[]): SchemaSet {
    const rules = [...set.rules];
    const texts = { ...set.texts };
    for (const one of added) {
        texts[one.name] = schemaText(one.schema);
        rules.push({ name: one.name, ...one.rule });
    }
    return { rules, texts };
}

/**
 * Where oculus's own config folder lies in the workspace: the folder holding it and the path in it.
 */
export type EngineConfigAt = { root: string; path: string };

/**
 * The set with its `hub` globs as the globs of the workspace folder `root` that holds the hub, and
 * its `engine` globs as the globs of each folder that holds oculus's own config folder, written
 * below the path of the config folder in it. A rule left with no root to govern is dropped.
 */
export function resolvedSchemas(
    set: SchemaSet,
    root: string,
    engine: readonly EngineConfigAt[]
): SchemaSet {
    const rules: SchemaRule[] = [];
    for (const { hub, engine: own, ...rule } of set.rules) {
        const roots: Record<string, string[]> = { ...rule.roots };
        const add = (key: string, globs: string[]): void => {
            roots[key] = [...(roots[key] ?? []), ...globs];
        };
        if (hub !== undefined) add(root, hub);
        if (own !== undefined) {
            for (const at of engine) {
                add(at.root, at.path === '' ? own : own.map((glob) => `${at.path}/${glob}`));
            }
        }
        if (Object.keys(roots).length === 0 && rule.every === undefined) continue;
        rules.push({ ...rule, ...(Object.keys(roots).length === 0 ? {} : { roots }) });
    }
    return { rules, texts: set.texts };
}

/**
 * The schemas of a hub other than the primary, as rules for the files of its root alone: each rule
 * that governs files of the hub keeps its globs for the root `key`, and each name gets the key in
 * front so it cannot meet a schema of another hub. The rules for oculus's own config folder and for
 * any root are the primary's set to hold.
 */
export function scopedSchemas(key: string, set: SchemaSet): SchemaSet {
    const rules: SchemaRule[] = [];
    const texts: Record<string, string> = {};
    for (const rule of set.rules) {
        const globs = rule.roots?.[key];
        if (globs === undefined || !Object.hasOwn(set.texts, rule.name)) continue;
        const name = `${key}:${rule.name}`;
        texts[name] = set.texts[rule.name];
        rules.push({
            name,
            roots: { [key]: globs },
            ...(rule.within === undefined ? {} : { within: rule.within })
        });
    }
    return { rules, texts };
}

/** The sets as one: the rules of each in order, and the texts of all. */
export function joinedSchemas(sets: readonly SchemaSet[]): SchemaSet {
    return {
        rules: sets.flatMap((one) => one.rules),
        texts: Object.assign({}, ...sets.map((one) => one.texts)) as Record<string, string>
    };
}

/** The set that governs nothing. */
export function emptySchemaSet(): SchemaSet {
    return { rules: [], texts: {} };
}

/** The scheme and folder a schema's address is written under. */
const ADDRESS = 'oculus-schema:/';

/** The address a schema is sent to the YAML server under. */
export function schemaAddress(name: string): string {
    return `${ADDRESS}${name}.json`;
}

/** The name an address was made from, or undefined for an address that is not one of ours. */
function schemaNameOf(address: string): string | undefined {
    if (!address.startsWith(ADDRESS) || !address.endsWith('.json')) return undefined;
    return address.slice(ADDRESS.length, -'.json'.length);
}

/** Whether any glob of the list matches the path. */
function matches(globs: string[] | undefined, path: string): boolean {
    return globs?.some((glob) => matchesGlob(path, glob)) ?? false;
}

/**
 * The name of the schema that governs a file, given the key of the root it is served under and its
 * path inside it, or undefined when none does.
 */
export function schemaFor(set: SchemaSet, root: string, path: string): string | undefined {
    for (const rule of set.rules) {
        if (!matches(rule.roots?.[root], path) && !matches(rule.every, path)) continue;
        if (rule.within !== undefined && !matches(rule.within, path)) continue;
        if (Object.hasOwn(set.texts, rule.name)) return rule.name;
    }
    return undefined;
}

/** The text of one schema, by the address it was asked for under. */
export function schemaTextAt(set: SchemaSet, address: string): string | undefined {
    const name = schemaNameOf(address);
    return name !== undefined && Object.hasOwn(set.texts, name) ? set.texts[name] : undefined;
}
