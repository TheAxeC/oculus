// Layer 3, primitive test. The one macOS test of ui/controls/editor/kit/load.ts (`onMac`), which
// the editor's key rules and the terminal grid's find and link modifier both read: it answers from
// the browser's user agent, and answers no where there is no navigator, since the unit suite
// renders the terminal grid on the server, whose instance script reads it; the page itself renders
// no component on the server.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { onMac } from '../../../../src/lib/ui/controls/editor/kit/load.ts';

afterEach(() => vi.unstubAllGlobals());

describe('whether the page runs on macOS', () => {
    it('is read from the user agent', () => {
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)' });
        expect(onMac()).toBe(true);
        vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' });
        expect(onMac()).toBe(false);
    });

    it('is no on the server, where there is no navigator', () => {
        vi.stubGlobal('navigator', undefined);
        expect(onMac()).toBe(false);
    });
});
