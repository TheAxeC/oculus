// Layer 2, server. The writes of `deck-edit`: one dispatch over the acts on a deck's files.
//
// `new`, `duplicate`, `delete` and `image` act on an open deck (deck-files.ts); `create` and
// `outline` make a deck (deck-new.ts). A writer that throws is told as `unwritable`, as the other
// writers of the engine's own files are, and what an act changed is left to its records: each file
// it changed is one, filed under one key, and deck-undo.ts takes them back together.

import type { DeckEditWrite } from '../../bodies.ts';
import type { WriteTarget } from '../../../writes.ts';
import type { FilesDeps } from '../../file-undo.ts';
import { createDeck, outlineDeck } from './deck-new.ts';
import { duplicate, image, newSlide, openDeck, remove, type ActOutcome } from './deck-files.ts';

/** Run one act of a `deck-edit` body. */
export async function writeDeckEdit(
    into: WriteTarget,
    body: DeckEditWrite,
    deps: FilesDeps
): Promise<ActOutcome> {
    try {
        if (body.act === 'create') return createDeck(into, body);
        if (body.act === 'outline') return outlineDeck(into, body);
        const open = openDeck(into, body.root, body.path);
        if ('changed' in open || 'error' in open) return open;
        if (body.act === 'new') return newSlide(open, body.after);
        if (body.act === 'image') return image(open, body);
        if (body.act === 'duplicate') return duplicate(open, body.slide, body.base);
        return await remove(open, body.slide, body.base, deps);
    } catch {
        return { error: 'unwritable' };
    }
}
