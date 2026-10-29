// Layer 2, client state, pure. The form the Debug view edits one configuration of
// `.oculus/launch.yml` in: its name, program, folder and command to run first, and for a debugger
// of an app each attribute its `configurationAttributes` gives for the configuration's request,
// with the control its schema type takes: a text or a number as a typed line, a toggle and a word
// of an `enum` as a pick, a list as a typed line of parts split by commas, and a map of words as
// `key=value` parts. An attribute of another type, a value of a list or map that holds more than
// words, and a list or map one of whose parts its line would not read back as (a part that holds
// the separator `,` or space at either end, an empty list part, a map key that holds `=`) is kept
// as the file has it and never sent, since the answer trims each part and drops an empty one. The
// answers make the changes the server makes to the entry in its place: a field answered otherwise
// than it was filled is set, and a line left empty takes the key out.

import type { DebugConfiguration } from '../../../../data/model/index.ts';
import type { ActingDebugger } from '../../../../data/helpers/files/apps/tools/debuggers.ts';

/** The configuration the form is made from, as the form's view reads it. */
export type { DebugConfiguration };

/** One field of the form: its key, its control, its words and what it holds to begin with. */
export type LaunchField = {
    key: string;
    kind: 'text' | 'number' | 'toggle' | 'choice' | 'list' | 'map';
    help: string;
    value: string;
    choices?: string[];
    required?: boolean;
};

/** The form of one configuration: its fields. */
export type LaunchForm = { fields: LaunchField[] };

/** The separator of a list's parts and of a map's entries. */
export const PARTS = ',';

/** Whether a word reads back from a part of a line: no separator, no space at either end. */
function asPart(one: unknown): one is string {
    return typeof one === 'string' && one.trim() === one && !one.includes(PARTS);
}

/** A list of words the form draws as parts: each reads back as a part, and none is empty. */
function partsList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((one) => asPart(one) && one !== '');
}

/**
 * A map of words the form draws as `key=value` parts: each key and each value reads back as a
 * part, and no key holds `=`.
 */
function partsMap(value: unknown): value is Record<string, string> {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value) &&
        Object.entries(value).every(
            ([key, one]) => asPart(key) && !key.includes('=') && asPart(one)
        )
    );
}

/** The properties a debugger's schema gives for a request, or none. */
function propertiesOf(one: ActingDebugger | undefined, request: string): Record<string, unknown> {
    if (one === undefined) return {};
    const attributes =
        request === 'attach'
            ? one.debugger.configurationAttributes.attach
            : one.debugger.configurationAttributes.launch;
    const properties = attributes.properties;
    return typeof properties === 'object' && properties !== null
        ? (properties as Record<string, unknown>)
        : {};
}

/** A text of a property's schema, or the empty text. */
function textOf(schema: Record<string, unknown>, key: string): string {
    const value = schema[key];
    return typeof value === 'string' ? value : '';
}

/** The field of one attribute, or null when its type has no control here or its value no text. */
function attributeField(
    key: string,
    schema: Record<string, unknown>,
    held: unknown
): LaunchField | null {
    const help = textOf(schema, 'description');
    const options = Array.isArray(schema.enum)
        ? schema.enum.filter((one) => typeof one === 'string')
        : [];
    if (options.length > 0 && (held === undefined || typeof held === 'string')) {
        return { key, kind: 'choice', help, value: held ?? '', choices: options };
    }
    const type = schema.type;
    if (type === 'string' && (held === undefined || typeof held === 'string')) {
        return { key, kind: 'text', help, value: held ?? '' };
    }
    if (
        (type === 'number' || type === 'integer') &&
        (held === undefined || typeof held === 'number')
    ) {
        return { key, kind: 'number', help, value: held === undefined ? '' : String(held) };
    }
    if (type === 'boolean' && (held === undefined || typeof held === 'boolean')) {
        return { key, kind: 'toggle', help, value: held === undefined ? '' : String(held) };
    }
    if (type === 'array' && (held === undefined || partsList(held))) {
        return { key, kind: 'list', help, value: (held ?? []).join(PARTS) };
    }
    if (type === 'object' && (held === undefined || partsMap(held))) {
        const pairs = Object.entries(held ?? {});
        return {
            key,
            kind: 'map',
            help,
            value: pairs.map(([name, word]) => `${name}=${word}`).join(PARTS)
        };
    }
    return null;
}

/** The form of a configuration, with the attributes of its debugger when it is an app's. */
export function launchForm(
    configuration: DebugConfiguration,
    one: ActingDebugger | undefined
): LaunchForm {
    const fields: LaunchField[] = [
        { key: 'name', kind: 'text', help: '', value: configuration.name, required: true },
        { key: 'program', kind: 'text', help: '', value: configuration.program },
        { key: 'cwd', kind: 'text', help: '', value: configuration.cwd },
        { key: 'before', kind: 'text', help: '', value: configuration.before ?? '' }
    ];
    const properties = propertiesOf(one, configuration.request);
    for (const [key, raw] of Object.entries(properties)) {
        if (fields.some((field) => field.key === key)) continue;
        const schema =
            typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
        const field = attributeField(key, schema, configuration.args[key]);
        if (field !== null) fields.push(field);
    }
    return { fields };
}

/** The value one answer makes, or undefined when it takes the key out. */
function answerValue(field: LaunchField, answer: string): unknown {
    const text = answer.trim();
    if (text === '') return undefined;
    if (field.kind === 'number') return Number.isFinite(Number(text)) ? Number(text) : text;
    if (field.kind === 'toggle') return text === 'true';
    if (field.kind === 'list')
        return text
            .split(PARTS)
            .map((one) => one.trim())
            .filter((one) => one !== '');
    if (field.kind === 'map') {
        const pairs = text
            .split(PARTS)
            .map((one) => one.trim())
            .filter((one) => one.includes('='));
        return Object.fromEntries(
            pairs.map((one) => [
                one.slice(0, one.indexOf('=')).trim(),
                one.slice(one.indexOf('=') + 1).trim()
            ])
        );
    }
    return answer;
}

/** The number a number field's answer does not read as, or null when every answer reads. */
export function wrongNumber(form: LaunchForm, answers: string[]): string | null {
    const at = form.fields.findIndex(
        (field, index) =>
            field.kind === 'number' &&
            (answers[index] ?? '').trim() !== '' &&
            !Number.isFinite(Number((answers[index] ?? '').trim()))
    );
    return at < 0 ? null : form.fields[at].key;
}

/**
 * The changes the answers make to the configuration: each field whose answer is not what the form
 * was filled with, set to the value it reads as, or null for a line left empty, which takes the
 * key out. A field answered as it was filled is no change, so the server leaves the file's key as
 * it is written; `type`, `request` and the values the form does not draw are never sent.
 */
export function launchChanges(form: LaunchForm, answers: string[]): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    form.fields.forEach((field, index) => {
        const answer = answers[index] ?? '';
        if (answer === field.value) return;
        changes[field.key] = answerValue(field, answer) ?? null;
    });
    return changes;
}
