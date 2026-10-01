// Layer 3, primitive test. The toggle form of ui/controls/Chip.svelte rendered to HTML on the
// server: what it tells a reader about its state, the fill a pressed chip takes, the tooltip it
// carries, and the filled form without a tone.

import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Chip from '../../../src/lib/ui/controls/Chip.svelte';
import { noop } from '../../fixtures/doubles.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const context = clientContext(createClientState());

describe('a chip the reader presses', () => {
    it('says it is pressed when it is', () => {
        const { body } = render(Chip, {
            context,
            props: { label: 'active', tone: 'green', onclick: noop, pressed: true }
        });
        expect(body).toContain('aria-pressed="true"');
    });

    it('says it is not pressed when it is not', () => {
        const { body } = render(Chip, {
            context,
            props: { label: 'active', tone: 'green', onclick: noop, pressed: false }
        });
        expect(body).toContain('aria-pressed="false"');
    });

    it('is drawn filled while it is pressed, without being asked to be filled', () => {
        const { body } = render(Chip, {
            context,
            props: { label: 'active', tone: 'green', onclick: noop, pressed: true }
        });
        expect(body).toMatch(/class="chip pressable[^"]*\bfilled\b/);
    });

    it('is drawn outlined while it is not pressed', () => {
        const { body } = render(Chip, {
            context,
            props: { label: 'active', tone: 'green', onclick: noop, pressed: false }
        });
        // an unpressed toggle keeps the outline; only a pressed or a filled chip takes the fill
        expect(body).not.toMatch(/class="chip pressable[^"]*\bfilled\b/);
    });

    it('carries the tooltip it is given', () => {
        const { body } = render(Chip, {
            context,
            props: {
                label: 'declined 2',
                onclick: noop,
                pressed: false,
                title: 'Show declined (2)'
            }
        });
        expect(body).toContain('Show declined (2)');
    });

    it('stays outlined when it is filled and has no tone', () => {
        const { body } = render(Chip, { context, props: { label: 'active', filled: true } });
        expect(body).toMatch(/class="chip[^"]*\bfilled\b/);
        expect(body).not.toMatch(/class="chip[^"]*\btoned\b/);
    });
});
