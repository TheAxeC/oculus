// Layer 2, state test. The one start-and-show path of a shell (state/shared/stores/shell.ts):
// a shell started in the folder asked for and shown under the label, or the refusal handed back
// with nothing shown. That the Repositories store's `shellIn` and the Files row menu both take this
// path is asserted in their own tests (tests/state/sources/repositories/repositories.test.ts and
// tests/views/sources/files/files-menu.test.ts).

import { describe, expect, it } from 'vitest';
import { openShell } from '../../../../src/lib/state/shared/stores/shell.ts';

/** Fakes of the terminals store that record each call, a start refused with `refusal`. */
function terminals(refusal = '') {
    const calls: string[] = [];
    const answer = { ok: refusal === '', id: refusal === '' ? 'term-1' : '', error: refusal };
    return {
        calls,
        store: {
            startTerminal: (kind: 'shell', cwd: string) => {
                calls.push(`start:${kind},${cwd}`);
                return Promise.resolve(answer);
            },
            showTerminal: (id: string, label?: string) => {
                calls.push(`show:${id},${label ?? ''}`);
            }
        }
    };
}

describe('a shell in a folder', () => {
    // Revert: return answer.error from openShell whether or not the start was refused.
    it('starts a shell in the folder and shows it under the label', async () => {
        const { calls, store } = terminals();
        expect(await openShell(store, '/tmp/r/notes', 'notes')).toBeNull();
        expect(calls).toEqual(['start:shell,/tmp/r/notes', 'show:term-1,notes']);
    });

    // Revert: show the terminal in openShell before looking at answer.ok.
    it('hands a refusal back and shows nothing', async () => {
        const { calls, store } = terminals('no tmux');
        expect(await openShell(store, '/tmp/r', 'r')).toBe('no tmux');
        expect(calls).toEqual(['start:shell,/tmp/r']);
    });
});
