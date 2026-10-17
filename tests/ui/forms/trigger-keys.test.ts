// Layer 3, primitive tests. The key handler of a select trigger drawn by FieldSelect.svelte
// (ui/forms/choice/select/trigger-keys.ts), which GlyphSelect and HueSelect draw: a key pressed
// with Cmd, Ctrl or Alt held never reaches bits-ui's type-ahead and is not prevented, so the
// workbench's keys still see it; a key with Shift alone or nothing held does reach it.
//
// It does not cover bits-ui's type-ahead itself or the workbench answering Cmd+S, which the look
// does.

import { describe, expect, it } from 'vitest';
import { triggerKeys } from '../../../src/lib/ui/forms/choice/select/trigger-keys.ts';

/** A key press on the trigger, with the modifiers named held. */
function press(
    key: string,
    held: { meta?: boolean; ctrl?: boolean; alt?: boolean; shift?: boolean }
) {
    return {
        key,
        metaKey: held.meta === true,
        ctrlKey: held.ctrl === true,
        altKey: held.alt === true,
        shiftKey: held.shift === true,
        defaultPrevented: false
    };
}

describe('a key pressed on a closed select trigger', () => {
    it.each([
        { row: 'Cmd+S', event: press('s', { meta: true }), handed: false },
        { row: 'Cmd+C', event: press('c', { meta: true }), handed: false },
        { row: 'Cmd+A', event: press('a', { meta: true }), handed: false },
        { row: 'Cmd+Shift+P', event: press('P', { meta: true, shift: true }), handed: false },
        { row: 'Ctrl+S', event: press('s', { ctrl: true }), handed: false },
        { row: 'Alt+S', event: press('s', { alt: true }), handed: false },
        { row: 'the letter s', event: press('s', {}), handed: true },
        { row: 'Shift+S', event: press('S', { shift: true }), handed: true },
        { row: 'Down', event: press('ArrowDown', {}), handed: true }
    ])('$row is handed to the type-ahead: $handed', ({ event, handed }) => {
        const seen: string[] = [];
        triggerKeys((one: typeof event) => seen.push(one.key))(event);
        expect({ handed: seen.length === 1, prevented: event.defaultPrevented }).toEqual({
            handed,
            prevented: false
        });
    });
});
