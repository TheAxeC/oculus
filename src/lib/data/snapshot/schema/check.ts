// Layer 1, data. The check of a hub document against its generated schema, and the findings an ajv
// error becomes. ajv does the checking; this module owns what ajv cannot say: which catalog
// sentence an error is, and which line of the file it is on. An ajv message is never shown.
//
// A validator is compiled once for each distinct schema text and kept by the checker it was asked
// of, so a rebuild whose schemas did not change compiles nothing. The checker is handed in, never
// held by this module.
//
// The line comes from the `yaml` document the file was parsed into: the error's path is walked in
// the document and the offset of the node it reaches is turned into a line. An error about a key
// that is not allowed is put on the key.

import Ajv from 'ajv';
import type { ErrorObject, ValidateFunction } from 'ajv';
import { LineCounter, isCollection, isMap, isPair, isScalar, parseDocument } from 'yaml';
import type { Document, Node } from 'yaml';
import { findingText, type TextCatalog } from '../../helpers/finding-text.ts';
import type { Finding } from '../../model/index.ts';
import { ISO_DATE } from '../../helpers/dates.ts';
import { ANNOTATIONS, type JsonSchema } from './json.ts';

/** A file read and parsed once, with the schema that governs it. */
export type SchemaDoc = {
    /** The name of the schema, a key of the set's texts. */
    name: string;
    /** Absolute path of the file. */
    file: string;
    text: string;
};

/** The compiled validators of the schemas seen so far, by the text of each schema. */
export type Checker = {
    /** The validator of a schema text, compiled on first use; undefined if it does not compile. */
    validator(text: string): ValidateFunction | undefined;
    /** Drop every validator whose schema text is not in `keep`. */
    keepOnly(keep: ReadonlySet<string>): void;
};

/** A checker with nothing compiled yet. */
export function createChecker(): Checker {
    const ajv = new Ajv({ allErrors: true, verbose: true, allowUnionTypes: true });
    for (const keyword of ANNOTATIONS) ajv.addKeyword({ keyword });
    const compiled = new Map<
        string,
        { validate: ValidateFunction | undefined; schema: JsonSchema }
    >();
    return {
        validator(text) {
            const held = compiled.get(text);
            if (held !== undefined) return held.validate;
            const schema = JSON.parse(text) as JsonSchema;
            let validate: ValidateFunction | undefined;
            try {
                validate = ajv.compile(schema);
            } catch {
                validate = undefined;
            }
            compiled.set(text, { validate, schema });
            return validate;
        },
        keepOnly(keep) {
            for (const [text, held] of compiled) {
                if (keep.has(text)) continue;
                if (held.validate !== undefined) ajv.removeSchema(held.schema);
                compiled.delete(text);
            }
        }
    };
}

/** The path of an ajv error as the segments of a JSON pointer. */
function segmentsOf(pointer: string): string[] {
    if (pointer === '') return [];
    return pointer
        .slice(1)
        .split('/')
        .map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

/** The key a path is written as in a finding: `entries[3].status`, `status.chips`. */
function keyOf(segments: string[]): string {
    return segments.reduce((key, part) => {
        if (/^\d+$/.test(part)) return `${key}[${part}]`;
        return key === '' ? part : `${key}.${part}`;
    }, '');
}

/** A value as the sentence names it: a text as it is, anything else as its JSON. */
function shown(value: unknown): string {
    return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The longest list of allowed words a sentence writes out before it stops. */
const WORDS_SHOWN = 10;

/** A list of allowed words, cut after the first few. */
function wordsOf(allowed: unknown[]): string {
    const words = allowed.filter((one) => one !== null).map(shown);
    return words.length <= WORDS_SHOWN
        ? words.join(', ')
        : `${words.slice(0, WORDS_SHOWN).join(', ')}, ...`;
}

/** A condition as the sentence names it: `role is present`, `role is present or attend`. */
function conditionOf(when: unknown): string {
    if (typeof when !== 'object' || when === null) return '';
    return Object.entries(when)
        .map(([name, value]) => `${name} is ${[value].flat().map(shown).join(' or ')}`)
        .join(' and ');
}

/** What a JSON type name is called in a sentence. */
function typeWords(catalog: TextCatalog, type: unknown): string {
    const names = [type].flat().filter((one) => one !== 'null');
    const words = names.map((name) => {
        switch (name) {
            case 'array':
                return findingText(catalog, 'findings.schema.is_list');
            case 'object':
                return findingText(catalog, 'findings.schema.is_map');
            case 'string':
                return findingText(catalog, 'findings.schema.is_text');
            case 'number':
                return findingText(catalog, 'findings.schema.is_number');
            case 'integer':
                return findingText(catalog, 'findings.words.whole');
            case 'boolean':
                return findingText(catalog, 'findings.schema.is_flag');
            default:
                return String(name);
        }
    });
    return words.join(` ${findingText(catalog, 'findings.schema.or')} `);
}

/** What a value is, in the words the shape messages use. */
export function isWords(catalog: TextCatalog, value: unknown): string {
    if (value === null) return findingText(catalog, 'findings.shape.is_null');
    if (Array.isArray(value)) return findingText(catalog, 'findings.shape.is_list');
    if (typeof value === 'object') return findingText(catalog, 'findings.shape.is_map');
    return findingText(catalog, 'findings.shape.is_other', typeof value);
}

/** The annotation of the schema an error was raised on, or undefined when it has none. */
function annotation(error: ErrorObject, keyword: string): unknown {
    const parent: Record<string, unknown> | undefined = error.parentSchema;
    return parent?.[keyword];
}

/** The sentence for a key of a map that the map's `propertyNames` schema refuses. */
function keyWords(
    error: ErrorObject,
    name: string,
    catalog: TextCatalog
): { key: string; message: string } {
    const key = keyOf([...segmentsOf(error.instancePath), name]);
    if (error.keyword === 'enum') {
        const allowed = (error.params as { allowedValues: unknown[] }).allowedValues;
        return {
            key,
            message: findingText(
                catalog,
                'findings.schema.not_allowed',
                key,
                name,
                wordsOf(allowed)
            )
        };
    }
    if (error.keyword === 'pattern') {
        const pattern = (error.params as { pattern: string }).pattern;
        return {
            key,
            message: findingText(catalog, 'findings.schema.not_form', key, name, pattern)
        };
    }
    return { key, message: findingText(catalog, 'findings.schema.invalid', key) };
}

/**
 * The errors of a validation that say something. A union reports the errors of every branch beside
 * its own: a union with one branch that is not null (an optional value) is worded by that branch's
 * errors alone, and any other union by its own error alone.
 */
function surfaced(errors: ErrorObject[]): ErrorObject[] {
    const dropped = new Set<ErrorObject>();
    const unions = errors
        .filter((one) => one.keyword === 'anyOf' || one.keyword === 'oneOf')
        .sort((a, b) => a.schemaPath.length - b.schemaPath.length);
    for (const union of unions) {
        if (dropped.has(union)) continue;
        const branches = union.schema as { type?: unknown }[];
        const real = branches.flatMap((one, at) => (one.type === 'null' ? [] : [at]));
        const keep = real.length === 1 ? `${union.schemaPath}/${real[0]}` : undefined;
        if (keep !== undefined) dropped.add(union);
        for (const one of errors) {
            if (one === union || !one.schemaPath.startsWith(`${union.schemaPath}/`)) continue;
            if (keep === undefined || !one.schemaPath.startsWith(`${keep}/`)) dropped.add(one);
        }
    }
    return errors.filter((one) => !dropped.has(one));
}

/** The key and sentence an ajv error is, or null for an error that says nothing of its own. */
function worded(error: ErrorObject, catalog: TextCatalog): { key: string; message: string } | null {
    const at = segmentsOf(error.instancePath);
    const here = keyOf(at);
    if (error.propertyName !== undefined) return keyWords(error, error.propertyName, catalog);
    switch (error.keyword) {
        case 'if':
        case 'propertyNames':
            return null;
        case 'additionalProperties': {
            const name = (error.params as { additionalProperty: string }).additionalProperty;
            const key = keyOf([...at, name]);
            return { key, message: findingText(catalog, 'findings.schema.not_declared', key) };
        }
        case 'required': {
            const name = (error.params as { missingProperty: string }).missingProperty;
            const key = keyOf([...at, name]);
            const when = annotation(error, 'x-required-when');
            return {
                key,
                message:
                    when === undefined
                        ? findingText(catalog, 'findings.schema.required', key)
                        : findingText(
                              catalog,
                              'findings.schema.required_when',
                              key,
                              conditionOf(when)
                          )
            };
        }
        case 'not': {
            const when = annotation(error, 'x-when');
            if (when === undefined) return null;
            return {
                key: here,
                message: findingText(catalog, 'findings.schema.only_when', here, conditionOf(when))
            };
        }
        case 'const':
            return {
                key: here,
                message: findingText(
                    catalog,
                    'findings.schema.not_allowed',
                    here,
                    shown(error.data),
                    shown((error.params as { allowedValue: unknown }).allowedValue)
                )
            };
        case 'enum': {
            const from = annotation(error, 'x-from');
            const allowed = (error.params as { allowedValues: unknown[] }).allowedValues;
            return {
                key: here,
                message:
                    typeof from === 'string'
                        ? findingText(
                              catalog,
                              'findings.schema.no_key',
                              here,
                              shown(error.data),
                              from
                          )
                        : findingText(
                              catalog,
                              'findings.schema.not_allowed',
                              here,
                              shown(error.data),
                              wordsOf(allowed)
                          )
            };
        }
        case 'pattern': {
            const pattern = (error.params as { pattern: string }).pattern;
            return {
                key: here,
                message:
                    pattern === ISO_DATE.source
                        ? findingText(
                              catalog,
                              'findings.schema.not_a_date',
                              here,
                              shown(error.data)
                          )
                        : findingText(
                              catalog,
                              'findings.schema.not_form',
                              here,
                              shown(error.data),
                              pattern
                          )
            };
        }
        case 'minimum':
        case 'maximum': {
            const limit = (error.params as { limit: number }).limit;
            const [data, bound] = [shown(error.data), String(limit)];
            return {
                key: here,
                message:
                    error.keyword === 'minimum'
                        ? findingText(catalog, 'findings.schema.below_min', here, data, bound)
                        : findingText(catalog, 'findings.schema.above_max', here, data, bound)
            };
        }
        case 'type':
            return {
                key: here,
                message: findingText(
                    catalog,
                    'findings.schema.type',
                    here,
                    typeWords(catalog, (error.params as { type: unknown }).type),
                    isWords(catalog, error.data)
                )
            };
        default:
            return { key: here, message: findingText(catalog, 'findings.schema.invalid', here) };
    }
}

/** The node a path reaches in a document, the nearest one that has a place when it is not there. */
function nodeAt(doc: Document.Parsed, segments: string[]): Node | null {
    for (let depth = segments.length; depth >= 0; depth--) {
        const node = doc.getIn(segments.slice(0, depth), true);
        if (isScalar(node) || isCollection(node)) return node;
    }
    return doc.contents;
}

/** The offset a path is put at: the key `name` of the map it reaches, or the value it reaches. */
function offsetOfPath(doc: Document.Parsed, at: string[], name?: string): number {
    const parent = nodeAt(doc, at);
    if (name !== undefined && isMap(parent)) {
        const pair = parent.items.find((item) => isPair(item) && String(item.key) === name);
        const key = pair?.key as Node | undefined;
        if (key?.range) return key.range[0];
    }
    return parent?.range?.[0] ?? 0;
}

/** The offset an error is put at: the key it names, or the value its path reaches. */
function offsetOf(doc: Document.Parsed, error: ErrorObject): number {
    const at = segmentsOf(error.instancePath);
    const name =
        error.keyword === 'additionalProperties'
            ? (error.params as { additionalProperty: string }).additionalProperty
            : error.propertyName;
    return offsetOfPath(doc, at, name);
}

/**
 * The findings of one document against its schema. A document that does not parse gives none here:
 * the source that read the file already said so. A document whose schema ajv cannot compile gives
 * one, against the file, naming the schema, since no key of it can be checked.
 */
export function checkDocument(
    doc: SchemaDoc,
    schemaTexts: Record<string, string>,
    checker: Checker,
    catalog: TextCatalog
): Finding[] {
    const text = Object.hasOwn(schemaTexts, doc.name) ? schemaTexts[doc.name] : undefined;
    const validate = text === undefined ? undefined : checker.validator(text);
    if (text === undefined) return [];
    if (validate === undefined) {
        return [
            {
                file: doc.file,
                key: '',
                message: findingText(catalog, 'findings.schema.not_compiled', doc.name)
            }
        ];
    }
    const lines = new LineCounter();
    const parsed = parseDocument(doc.text, { lineCounter: lines });
    if (parsed.errors.length > 0) return [];
    if (validate(parsed.toJS())) return [];
    const found: Finding[] = [];
    for (const error of surfaced(validate.errors ?? [])) {
        const said = worded(error, catalog);
        if (said === null) continue;
        found.push({
            file: doc.file,
            key: said.key,
            message: said.message,
            line: lines.linePos(offsetOf(parsed, error)).line
        });
    }
    return found;
}
