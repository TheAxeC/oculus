// Layer 2, client-state tests. The text of the Terminal text size box of the "This browser" rows:
// it is read by the decimal rule a config number row is read by, so the same texts are refused with
// the same message, and an empty box gives the size back to the config.
//
// What this does NOT cover: the box that holds the text and the press of Enter or a blur that
// applies it (tests/views/system/workbench/settings.test.ts draws it; the events are for the look).

import { describe, expect, it } from 'vitest';
import { terminalSizeOf } from '../../../../src/lib/state/system/config/browser.ts';
import { message } from '../../../../src/lib/state/system/config/messages.ts';
import './fixture.ts';

describe('the terminal text size box', () => {
    it('takes a decimal, trimmed, as the size', () => {
        expect(terminalSizeOf('  12.5 ')).toEqual({ set: true, value: 12.5 });
    });

    it('gives the size back to the config for an empty box', () => {
        expect(terminalSizeOf('   ')).toEqual({ set: true, value: null });
    });

    it('refuses what is not a decimal with the message a number row gives', () => {
        expect(terminalSizeOf('0x10')).toEqual({ set: false, said: message('notNumber') });
    });
});
