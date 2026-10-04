// Layer 2, client-state test helper. The inputs and the runner of the instance-state tables: the
// readers of the state a view keeps per tab (`parse...State`, `...ViewOf`), each given the same
// kinds of input and compared with the answer written beside it.
//
// A reader is described by one state with every field right (`valid`), one wrong value per field
// (`wrong`) and named edge cases (`edge`, each a patch laid over `valid`). The inputs a reader
// meets are the shared ones (a list, null, undefined, a map holding an own `__proto__` key made by
// JSON.parse, ...), `valid`, `valid` with one field wrong at a time, every field wrong at once and
// the edge cases. `answers` holds what the reader answers for each of them, compared whole with
// `toStrictEqual`, with the keys of an answer checked in their order.

import { describe, expect, it } from 'vitest';

/** An edge patch value that removes the key from `valid` instead of setting it. */
export const ABSENT = Symbol('absent');

export type Reader = {
    name: string;
    read: (input: unknown) => unknown;
    valid: Record<string, unknown>;
    wrong: Record<string, unknown>;
    edge?: Record<string, Record<string, unknown>>;
    /** The answer to a list, null and undefined, unless `answers` names one. */
    notMap?: unknown;
    answers: Record<string, unknown>;
};

/** The inputs that are not a map. */
const NOT_MAP = ['empty list', 'null', 'undefined'];

/** What a reader answers for each input, `notMap` standing for the inputs that are not a map. */
export function answersOf(reader: Reader): Record<string, unknown> {
    const all: Record<string, unknown> = {};
    for (const label of Object.keys(inputsOf(reader))) {
        if (Object.hasOwn(reader.answers, label)) all[label] = reader.answers[label];
        else if (NOT_MAP.includes(label) && 'notMap' in reader) all[label] = reader.notMap;
    }
    return all;
}

function patched(
    base: Record<string, unknown>,
    patch: Record<string, unknown>
): Record<string, unknown> {
    const state = { ...base, ...patch };
    return Object.fromEntries(Object.entries(state).filter(([, value]) => value !== ABSENT));
}

/** Every input of a reader by its label, in the order the answers list them. */
export function inputsOf(reader: Reader): Record<string, unknown> {
    const inputs: Record<string, unknown> = {
        'empty list': [],
        null: null,
        undefined,
        'empty map': {},
        'own __proto__ key': JSON.parse(
            '{"__proto__":{"search":"p","adding":true},"search":"s","adding":true}'
        ) as unknown,
        'own __proto__ key alone': JSON.parse('{"__proto__":"x"}') as unknown,
        valid: { ...reader.valid }
    };
    for (const [field, value] of Object.entries(reader.wrong)) {
        inputs[`wrong ${field}`] = patched(reader.valid, { [field]: value });
    }
    inputs['all wrong'] = { ...reader.wrong };
    for (const [label, patch] of Object.entries(reader.edge ?? {})) {
        inputs[label] = patched(reader.valid, patch);
    }
    return inputs;
}

function isPlain(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** One describe block per reader: the answer to every input, and a new object for each object. */
export function checkReaders(readers: Reader[]): void {
    for (const reader of readers) {
        describe(reader.name, () => {
            const labels = Object.keys(inputsOf(reader));
            const answers = answersOf(reader);
            const objects = labels.filter((label) => {
                const answer = answers[label];
                return typeof answer === 'object' && answer !== null;
            });
            it.each(labels)('answers %s', (label) => {
                const answer = reader.read(inputsOf(reader)[label]);
                const expected = answers[label];
                expect(answer).toStrictEqual(expected);
                if (isPlain(expected)) {
                    expect(Object.keys(answer as object)).toStrictEqual(Object.keys(expected));
                }
            });
            it.each(objects)('answers an object of its own for %s', (label) => {
                const input = inputsOf(reader)[label];
                const first = reader.read(input);
                expect(first).not.toBe(input);
                expect(reader.read(input)).not.toBe(first);
            });
        });
    }
}
