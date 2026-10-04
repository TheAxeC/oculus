// Layer 2, client-state tests. The comment box of one file section
// (views/sources/repositories/diff/comment-draft.svelte.ts), in Svelte's client runtime since it
// registers effects: where the box is and what it keeps when it closes or moves, what a send does
// for each way it can end, the box closing when its side stops being offered, the line saying where
// a comment went clearing after NOTICE_MS, and a send that ends after its box went handing nothing
// back. Every dependency of a send is a fake, so no terminal or clipboard is reached.
//
// It does not cover the markup that draws the box
// (tests/views/sources/repositories/diff/diff-pane.test.ts) or the box inside Monaco's overlay,
// which the look does.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog, t } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    NOTICE_MS,
    type DiffSide
} from '../../../../../src/lib/state/sources/repositories/review-comment.ts';
import { CommentDraft } from '../../../../../src/lib/views/sources/repositories/diff/comment-draft.svelte.ts';
import { rooted } from './rooted.svelte.ts';

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
    it('opens after a line, moves to another with its text, and clears the last failure', () => {
        const { box, stop } = make();
        box.open('modified', 3);
        box.write('keep me');
        box.failure = 'old';
        box.open('original', 7);
        expect(box.at).toEqual({ side: 'original', line: 7 });
        expect(box.text).toBe('keep me');
        expect(box.failure).toBe('');
        stop();
    });

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

    it('forgets the last failure when the text changes', () => {
        const { box, stop } = make();
        box.failure = 'a failure';
        box.write('x');
        expect(box.failure).toBe('');
        stop();
    });

    // Revert: leave the effect over `allowed` out of the constructor.
    it('closes, keeping the text, when its side stops being offered', () => {
        const { box, state, stop } = make();
        box.open('original', 2);
        box.write('keep me');
        flushSync();
        expect(box.at).not.toBeNull();
        state.offered = false;
        box.open('original', 2);
        box.write('keep me');
        flushSync();
        expect(box.at).toBeNull();
        expect(box.text).toBe('keep me');
        stop();
    });
});

describe('how often the box was asked to open', () => {
    // Red when a move to another line of the same side does not raise the count.
    it('rises on each open, on a move along one side as on a move to the other side', () => {
        const { box, stop } = make();
        expect(box.opened).toBe(0);
        box.open('modified', 3);
        expect(box.opened).toBe(1);
        box.open('modified', 9);
        expect(box.opened).toBe(2);
        box.open('original', 9);
        expect(box.opened).toBe(3);
        box.close();
        expect(box.opened).toBe(3);
        stop();
    });
});

describe('a send', () => {
    it('types the prompt into the terminal, says where it went and clears the box', async () => {
        const { box, typed, stop } = make();
        box.open('modified', 3);
        box.write('  rename this  ');
        await box.send();
        expect(typed).toEqual(['a.ts:3: rename this']);
        expect(box.notice).toBe(t('sessions.comment_sent', 'The live one'));
        expect(box.at).toBeNull();
        expect(box.text).toBe('');
        expect(box.sending).toBe(false);
        stop();
    });

    it('names the old path on the original side', async () => {
        const { box, typed, stop } = make();
        box.open('original', 4);
        box.write('why');
        await box.send();
        expect(typed).toEqual(['old.ts:4 (before the change): why']);
        stop();
    });

    it('copies the prompt when the session has no terminal, and says so', async () => {
        const { box, typed, copied, stop } = make({ terminal: false });
        box.open('modified', 3);
        box.write('fix');
        await box.send();
        expect(typed).toEqual([]);
        expect(copied).toEqual(['a.ts:3: fix']);
        expect(box.notice).toBe(t('sessions.comment_copied', 'The live one'));
        stop();
    });

    it('keeps the box and the text, and says what the terminal said, when it failed', async () => {
        const { box, stop } = make({
            answer: Promise.resolve({ ok: false, id: 't-1', error: 'gone' })
        });
        box.open('modified', 3);
        box.write('fix');
        await box.send();
        expect(box.failure).toBe('gone');
        expect(box.at).not.toBeNull();
        expect(box.text).toBe('fix');
        expect(box.notice).toBe('');
        stop();
    });

    it('keeps the box and says the clipboard refused when there is no terminal and no clipboard', async () => {
        const { box, stop } = make({ terminal: false, copy: false });
        box.open('modified', 3);
        box.write('fix');
        await box.send();
        expect(box.failure).toBe(t('sessions.comment_clipboard'));
        expect(box.at).not.toBeNull();
        stop();
    });

    it('sends nothing for a blank text, and refuses a control character with its sentence', async () => {
        const { box, typed, stop } = make();
        box.open('modified', 3);
        box.write('   ');
        await box.send();
        expect(typed).toEqual([]);
        expect(box.failure).toBe('');
        box.write('bell\u0007');
        await box.send();
        expect(typed).toEqual([]);
        expect(box.failure).toBe(t('sessions.comment_control'));
        stop();
    });

    it('does nothing while the box is closed', async () => {
        const { box, typed, stop } = make();
        box.write('fix');
        await box.send();
        expect(typed).toEqual([]);
        stop();
    });

    it('sends once while a send is in flight', async () => {
        let answer: (value: Answer) => void = () => undefined;
        const { box, typed, stop } = make({
            answer: new Promise<Answer>((resolve) => (answer = resolve))
        });
        box.open('modified', 3);
        box.write('fix');
        const first = box.send();
        expect(box.sending).toBe(true);
        await box.send();
        expect(box.sending).toBe(true);
        expect(typed).toHaveLength(1);
        answer(OK);
        await first;
        expect(box.sending).toBe(false);
        stop();
    });

    it('hands nothing back when the box was closed before the terminal answered', async () => {
        let answer: (value: Answer) => void = () => undefined;
        const { box, stop } = make({
            answer: new Promise<Answer>((resolve) => (answer = resolve))
        });
        box.open('modified', 3);
        box.write('fix');
        const sent = box.send();
        box.close();
        answer(OK);
        await sent;
        expect(box.notice).toBe('');
        expect(box.text).toBe('fix');
        expect(box.sending).toBe(false);
        stop();
    });

    it('hands nothing back when the section went before the terminal answered', async () => {
        let answer: (value: Answer) => void = () => undefined;
        const { box, stop } = make({
            answer: new Promise<Answer>((resolve) => (answer = resolve))
        });
        box.open('modified', 3);
        box.write('fix');
        const sent = box.send();
        stop();
        answer(OK);
        await sent;
        expect(box.notice).toBe('');
        expect(box.text).toBe('fix');
    });
});

describe('the line saying where a comment went', () => {
    it('stays for NOTICE_MS and then goes', async () => {
        const { box, stop } = make();
        box.open('modified', 3);
        box.write('fix');
        await box.send();
        flushSync();
        vi.advanceTimersByTime(NOTICE_MS - 1);
        expect(box.notice).not.toBe('');
        vi.advanceTimersByTime(1);
        expect(box.notice).toBe('');
        stop();
    });
});
