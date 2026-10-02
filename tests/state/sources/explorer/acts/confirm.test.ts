// Layer 2, client state test. The setting behind the delete question: `confirmDelete` reads
// `files.confirm_delete` (true until it says false) and `rememberAnswer` writes false into
// behavior.yml only for a yes with the "Do not ask me again" box ticked.
//
// What this does NOT cover: the box drawn by views/sources/files/Questions.svelte and the page
// handing the box's state on, which need a browser.

import { describe, expect, it, vi } from 'vitest';
import {
    confirmDelete,
    rememberAnswer
} from '../../../../../src/lib/state/sources/explorer/acts/confirm.ts';

describe('confirmDelete', () => {
    // Revert: return false for a map without the key.
    it('is true until the configuration says false', () => {
        expect(confirmDelete({})).toBe(true);
        expect(confirmDelete({ files: {} })).toBe(true);
        expect(confirmDelete({ files: { confirm_delete: true } })).toBe(true);
        expect(confirmDelete({ files: { confirm_delete: false } })).toBe(false);
    });
});

describe('rememberAnswer', () => {
    // Revert: write on any answer.
    it('writes false to behavior.yml for a yes with the box ticked', () => {
        const write = vi.fn().mockResolvedValue({ ok: true });

        expect(rememberAnswer(write, true, true)).toBe(true);
        expect(write).toHaveBeenCalledExactlyOnceWith(
            'behavior.yml',
            'files.confirm_delete',
            false
        );
    });

    // Revert: write when the answer is no.
    it('writes nothing for a no, or for a yes with the box clear', () => {
        const write = vi.fn();

        expect(rememberAnswer(write, false, true)).toBe(false);
        expect(rememberAnswer(write, true, false)).toBe(false);
        expect(rememberAnswer(write, false, false)).toBe(false);
        expect(write).not.toHaveBeenCalled();
    });
});
