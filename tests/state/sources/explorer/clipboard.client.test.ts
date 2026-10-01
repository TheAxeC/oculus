// Layer 4, test. The explorer store's clipboard and compare selection read from an effect, in
// Svelte's client runtime (tests/ui/frame/client-runtime.ts): what reads them is run again when
// they change, so a row on the clipboard as Cut is drawn faded and a folder's menu offers Paste as
// soon as a Cut or a Copy is picked, and both go back when a paste empties the clipboard.
//
// It does not cover the markup that reads them (tests/views/sources/files/), or a paste's post,
// which is ops.test.ts.

import { flushSync } from 'svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { createClientState } from '../../../../src/lib/state/client/context.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { watch } from './watch.svelte.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

beforeEach(() => vi.stubGlobal('window', {}));
afterEach(() => vi.unstubAllGlobals());

describe('a read of the clipboard from an effect', () => {
    it('runs again on a Cut and on a Copy, with the clipboard each holds', () => {
        const explorer = createClientState().explorer;
        const watched = watch(() => explorer.clipboard()?.mode ?? 'none');
        flushSync();
        explorer.cut([{ root: 'hub', path: 'a.md' }]);
        flushSync();
        explorer.copy([{ root: 'hub', path: 'b.md' }]);
        flushSync();
        watched.stop();
        expect(watched.seen).toEqual(['none', 'cut', 'copy']);
    });

    it('runs again when a file is selected for compare and when it is given up', () => {
        const explorer = createClientState().explorer;
        const watched = watch(() => explorer.compareFile()?.path ?? 'none');
        flushSync();
        explorer.selectForCompare({ root: 'hub', path: 'a.md' });
        flushSync();
        explorer.selectForCompare(null);
        flushSync();
        watched.stop();
        expect(watched.seen).toEqual(['none', 'a.md', 'none']);
    });
});
