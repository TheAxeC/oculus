// Layer 1, data. The `editor:` block of config/behavior.yml: the size above which the source tab's
// editor opens a file as plaintext, without colour.
//
// Both readers of the block are here because the two sides must give the same answer. The server
// requires the key at start, so a missing or mistyped one stops it with the key named instead of
// reaching a page, and the editor reads the cap out of the merged configuration on every paint.
//
// The editor's read answers null for a configuration that carries no usable value, which is what
// the page holds until the config channel's first message lands; the editor paints plain over that,
// and the server's check at start is what makes a served run always carry a cap.

import { z } from 'zod';
import { fields } from './guards.ts';

/** The cap as written: a finite number above zero, in kilobytes. */
const paintLimitShape = z.number().positive();

/** The cap in bytes, and null for a configuration carrying no usable `editor.paint_limit_kb`. */
export function paintLimit(config: Record<string, unknown>): number | null {
    const kb = paintLimitShape.safeParse(fields(config.editor).paint_limit_kb);
    return kb.success ? kb.data * 1024 : null;
}

/**
 * The same cap, required: the server calls it at start, so a bad key is named there and nowhere
 * else.
 */
export function requirePaintLimit(config: Record<string, unknown>): number {
    const bytes = paintLimit(config);
    if (bytes === null) {
        throw new Error('config/behavior.yml: editor.paint_limit_kb must be a number above zero');
    }
    return bytes;
}
