// Layer 2, server. What the readers of the contribution points share: where in the key an issue
// lies, and the small set of operations a reader of a point needs of the reader around it.

import type { z } from 'zod';
import type { POINTS, PointName } from './shape.ts';

/** Where in the key an issue lies: `contributes.commands[1].command`. */
export function placeOf(point: string, path: PropertyKey[]): string {
    const tail = path.map((one) => (typeof one === 'number' ? `[${one}]` : `.${String(one)}`));
    return `contributes.${point}${tail.join('')}`;
}

/** What a reader of a contribution point is given of the reader of the whole key. */
export type PointHelpers = {
    /** The point's value read with its shape, or null after a refusal naming the first fault. */
    parse<K extends PointName>(point: K, value: unknown): z.infer<(typeof POINTS)[K]> | null;
    /** Refuse the app with a sentence of `findings.apps`. */
    refuse(key: string, ...args: (string | number)[]): void;
    /** Leave the entry out and keep the app, with a sentence of `findings.apps`. */
    note(key: string, ...args: (string | number)[]): void;
    /** A file the app holds, by a suffix; the path as given, and a refusal when it is none. */
    file(path: string, place: string, suffix: RegExp): string;
    /** Whether the app holds this file. */
    has(path: string): boolean;
    /** An id of the app's own, declared once. */
    declare(id: string, place: string): void;
    /** The app's name. */
    name: string;
};
