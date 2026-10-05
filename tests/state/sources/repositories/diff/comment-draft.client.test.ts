// Layer 2, client-state tests. The comment box of one file section
// (views/sources/repositories/diff/comment-draft.svelte.ts), in Svelte's client runtime since it
// registers effects: where the box is and what it keeps when it closes. Every dependency of a send
// is a fake, so no terminal or clipboard is reached.
//
// It does not cover the markup that draws the box or the box inside Monaco's overlay, which the
// look does.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { type DiffSide } from '../../../../../src/lib/state/sources/repositories/review-comment.ts';
import { CommentDraft } from '../../../../../src/lib/views/sources/repositories/diff/comment-draft.svelte.ts';
import { rooted } from '../../../../ui/frame/rooted.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

type Answer = { ok: boolean; id: string; error: string };

const OK: Answer = { ok: true, id: 't-1', error: '' };

/** A box over fakes: what it typed into a terminal, copied, and whether its side is offered. */
function make(over: { terminal?: boolean; copy?: boolean; answer?: Promise<Answer> } = {}) {
    const typed: string[] = [];
    const copied: string[] = [];
    const state = { offered: true };
    const made = rooted(
        () =>
            new CommentDraft({
                file: () => ({ oldPath: 'old.ts', newPath: 'a.ts' }),
                staged: () => false,
                who: () => 'The live one',
                allowed: (_side: DiffSide) => state.offered,
                deps: () => ({
                    terminal: () => (over.terminal === false ? null : { id: 't-1' }),
                    steer: (_id: string, text: string) => {
                        typed.push(text);
                        return over.answer ?? Promise.resolve(OK);
                    },
                    copy:
                        over.copy === false
                            ? null
                            : (text: string) => {
                                  copied.push(text);
                                  return Promise.resolve();
                              }
                })
            })
    );
    flushSync();
    return { box: made.value, typed, copied, state, stop: made.stop };
}

describe('where the box is and what it keeps', () => {
    it('closes keeping the text, and drops the text on Cancel', () => {
        const { box, stop } = make();
        box.open('modified', 3);
        box.write('keep me');
        box.close();
        expect(box.at).toBeNull();
        expect(box.text).toBe('keep me');
        box.open('modified', 3);
        box.drop();
        expect(box.at).toBeNull();
        expect(box.text).toBe('');
        stop();
    });
});
