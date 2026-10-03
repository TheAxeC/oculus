// Layer 2, client state. One value of a list or family as one line of YAML flow text, and one line
// of text back as a value. An editor shows a field's value this way (`220`, `Max 20x`,
// `[.sh, .bash]`) and reads what was typed with `yaml`'s parser on Save, so a number stays a
// number, a list a list, and a string that would read back as another type is shown quoted.

import { parseDocument, stringify } from 'yaml';

/** What a line of flow text reads as: its value, or that it is not YAML. */
export type Flow = { ok: true; value: unknown } | { ok: false };

/**
 * How the text is written: flow collections on one line, never folded, strings in double quotes.
 */
const STYLE = {
    collectionStyle: 'flow',
    flowCollectionPadding: false,
    lineWidth: 0,
    defaultStringType: 'PLAIN',
    defaultKeyType: 'PLAIN'
} as const;

/** The null words YAML reads as null; any other text that reads as null is kept as typed. */
const NULL_WORDS = /^(?:null|Null|NULL|~)$/;

/**
 * A value as one line of flow YAML. A string that holds a line break is written double-quoted, the
 * one style that keeps it on one line.
 */
export function flowText(value: unknown): string {
    if (typeof value === 'string' && /[\n\r]/.test(value)) return JSON.stringify(value);
    return stringify(value, STYLE).trimEnd();
}

/**
 * The value a line of text is. Empty text is `undefined`, `null` and `~` are null, and text that is
 * neither but that YAML reads as null (a bare colour such as `#123456`, which it reads as a
 * comment) is the string typed. Text that does not parse, an alias to nothing included, is not a
 * value.
 */
export function readFlow(input: string): Flow {
    const text = input.trim();
    if (text === '') return { ok: true, value: undefined };
    const doc = parseDocument(text, { uniqueKeys: true });
    if (doc.errors.length > 0) return { ok: false };
    let value: unknown;
    try {
        value = doc.toJS();
    } catch {
        // an alias to an anchor the text does not hold
        return { ok: false };
    }
    if (value === null && !NULL_WORDS.test(text)) return { ok: true, value: text };
    return { ok: true, value };
}
