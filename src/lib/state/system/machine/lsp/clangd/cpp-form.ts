// Layer 2, client state. The form of a configuration of a repository's `.oculus/cpp.yml`, which
// the compile database list opens: its fields are those `config/schemas/cpp-schema.yml` gives a
// configuration, read from GET /api/cpp with the entries the file holds, and its answers are made
// into what POST /api/cpp writes (server/machine/lsp/adapters/clangd/cpp-write.ts): a new
// configuration, or the changes to an entry of the file.
//
// A `text` field is a typed line and a `tags` field a list of parts split by commas; a field of
// another type, and a `tags` field whose list holds a part its line would not read back as (a part
// that is no text, is empty, holds the separator `,` or space at either end, since the answer trims
// each part, drops an empty one and reads every part as a text) is not drawn and its value is kept
// as the file holds it. A field left empty is taken out of the configuration. A key of the entry
// that the schema does not name is taken out, since the file's reader refuses it, so a Save mends
// that finding.

import { z } from 'zod';
import type { SchemaField } from '../../../../../data/model/index.ts';
import { readAs, readJson } from '../../../../../data/shapes/shapes.ts';
import { unreachableAnswer, unreadableAnswer } from '../../../../shared/answers/answers.ts';
import { postForRefusal } from '../../../../shared/answers/posted.ts';
import type { TokenSource } from '../../../../shared/stores/token-post.ts';

/** What separates the parts of a `tags` field. */
export const PARTS = ',';

/** One field of the form: its key, how it is asked, its schema words and what it holds now. */
export type CppField = {
    key: string;
    kind: 'text' | 'tags';
    label: string;
    help: string;
    required: boolean;
    value: string;
};

/** What the form is filled from: the fields of a configuration and the entries of the file. */
export type CppFile = { fields: SchemaField[]; entries: unknown[] };

/** The entry as a map of its keys, the empty map for an entry that is no map. */
function mapOf(entry: unknown): Record<string, unknown> {
    return typeof entry === 'object' && entry !== null && !Array.isArray(entry)
        ? (entry as Record<string, unknown>)
        : {};
}

/** What a scalar of the file reads as on a typed line. */
function lineOf(value: unknown): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
}

/**
 * Whether a `tags` value is drawn as parts: none, or a list of texts each of which reads back as a
 * part, not empty, with no `,` and no space at either end.
 */
function drawnTags(value: unknown): boolean {
    if (value === undefined) return true;
    return (
        Array.isArray(value) &&
        value.every(
            (one) =>
                typeof one === 'string' && one !== '' && one.trim() === one && !one.includes(PARTS)
        )
    );
}

/** The fields of the form for an entry of the file, or for a new configuration when it is null. */
export function cppFields(fields: readonly SchemaField[], entry: unknown): CppField[] {
    const held = mapOf(entry);
    return fields.flatMap((field): CppField[] => {
        if (field.type !== 'text' && field.type !== 'tags') return [];
        const value = held[field.field];
        if (field.type === 'tags' && !drawnTags(value)) return [];
        return [
            {
                key: field.field,
                kind: field.type,
                label: field.label ?? field.field,
                help: field.help ?? '',
                required: field.required === true,
                value:
                    field.type === 'tags'
                        ? (Array.isArray(value) ? value : []).map(lineOf).join(`${PARTS} `)
                        : lineOf(value)
            }
        ];
    });
}

/** The value an answer reads as, or null for an answer that leaves the field empty. */
function answerValue(field: CppField, answer: string): unknown {
    if (field.kind === 'text') return answer.trim() === '' ? null : answer.trim();
    const parts = answer
        .split(PARTS)
        .map((one) => one.trim())
        .filter((one) => one !== '');
    return parts.length === 0 ? null : parts;
}

/**
 * What the answers send. For a new configuration (`entry` null), the configuration: each field
 * answered with a value. For an entry of the file, its changes: each field answered otherwise than
 * it was filled, set to its value or taken out by a null, and each key the schema does not name
 * taken out; a field answered as it was filled is no change, so the file keeps it as it is written.
 */
export function cppChanges(
    fields: readonly SchemaField[],
    form: readonly CppField[],
    entry: unknown,
    answers: readonly string[]
): Record<string, unknown> {
    const changes: Record<string, unknown> = {};
    form.forEach((field, at) => {
        const answer = answers[at] ?? '';
        const value = answerValue(field, answer);
        if (entry === null) {
            if (value !== null) changes[field.key] = value;
        } else if (answer !== field.value) changes[field.key] = value;
    });
    if (entry === null) return changes;
    const named = new Set(fields.map((one) => one.field));
    for (const key of Object.keys(mapOf(entry))) if (!named.has(key)) changes[key] = null;
    return changes;
}

/** The name an entry is listed by, or null for an entry with no name. */
export function cppName(entry: unknown): string | null {
    const name = mapOf(entry).name;
    return typeof name === 'string' && name.trim() !== '' ? name : null;
}

const fileShape = z.object({
    fields: z.array(z.custom<SchemaField>((one) => typeof one === 'object' && one !== null)),
    entries: z.array(z.unknown())
});

const answerShape = z.object({ error: z.string().optional(), line: z.number().optional() });

/** The form of the repository's file, or the sentence of why it could not be read. */
export async function readCppFile(repo: string): Promise<CppFile | { error: string }> {
    try {
        const response = await fetch(`/api/cpp?repo=${encodeURIComponent(repo)}`);
        const raw = await readJson(response);
        if (!response.ok) {
            const refused = readAs(answerShape, raw);
            return { error: refused?.error ?? unreadableAnswer(response.status) };
        }
        return readAs(fileShape, raw) ?? { error: unreadableAnswer(response.status) };
    } catch {
        return { error: unreachableAnswer() };
    }
}

/**
 * Write one configuration: `changes` appended as a new one when `at` is null, else made to the
 * entry at `at`, or that entry taken out when `changes` is null. `was` is the entry as the form was
 * filled from it. Null when it was written, else the sentence of why not.
 */
export async function writeCppEntry(
    writes: TokenSource,
    repo: string,
    at: number | null,
    was: unknown,
    changes: Record<string, unknown> | null
): Promise<string | null> {
    const body = { repo, at, ...(at === null ? {} : { was }), changes };
    return postForRefusal('/api/cpp', body, writes);
}
