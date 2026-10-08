// Layer 1, data. The set of generated schemas one snapshot build produces: each schema's text under
// its name, and the rules that say which file of which served root each one governs. The set is
// JSON-safe and carries no function, so the relay can hold the latest one and compare two of them
// by their texts.
//
// A file is matched by its path inside a served root and nothing else, with `node:path`'s
// `matchesGlob`. The hub root, the engine's config root and every other root are told apart: a rule
// names the globs of each kind of root it governs. A file no rule matches has no schema.

import { matchesGlob } from 'node:path';
import { ENGINE_ROOT, HUB_ROOT } from '../../helpers/hub-names.ts';
import { schemaText, type JsonSchema } from './json.ts';

/**
 * One schema's reach: the globs, relative to a served root, of the files it governs. `hub` applies
 * in the hub root, `engine` in the engine's config folder and `every` in any root. `within` narrows
 * the rule to files that also match one of its globs, which is how a path condition of a schema
 * gives a variant its own reach.
 */
export type SchemaRule = {
    name: string;
    hub?: string[];
    engine?: string[];
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
        const kind = root === HUB_ROOT ? rule.hub : root === ENGINE_ROOT ? rule.engine : [];
        if (!matches(kind, path) && !matches(rule.every, path)) continue;
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
