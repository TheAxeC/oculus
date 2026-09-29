// Layer 3, primitive tests. The tooltip wrapper rendered on the server: its words kept in place,
// which control it describes, where it sits in the tab order, and the one tooltip group it is drawn
// under, which the page's layout holds and without which bits-ui refuses it. The bubble itself is
// drawn on the body through bits-ui's Portal, which a server render leaves empty, so its delay,
// its placement, its arrow and one bubble closing another are seen on the page.

import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Tooltip from '../../../src/lib/ui/menu/Tooltip.svelte';
import { describedBy, describedControl } from '../../../src/lib/ui/menu/tooltip-rules.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';
import { TIP_KEY, createTipIds } from '../../../src/lib/ui/menu/tip-ids.ts';
import LaidOutTooltip from './LaidOutTooltip.svelte';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

describe('Tooltip', () => {
    /** The control a tooltip wraps. Every use of it wraps exactly one. */
    const control = createRawSnippet(() => ({ render: () => '<button type="button">Go</button>' }));

    /** A wrapper round one button, which is every way it is used. */
    function tip(props: Record<string, unknown>): string {
        return render(Tooltip, {
            context: clientContext(client),
            props: { text: 'Put it back', children: control, ...props }
        }).body;
    }

    /**
     * An element as the description code uses it: what it holds, and the attributes it was given.
     */
    function element(child: Element | null = null): {
        attributes: Record<string, string>;
        querySelector: (selectors: string) => Element | null;
        setAttribute: (name: string, value: string) => void;
        removeAttribute: (name: string) => void;
    } {
        const attributes: Record<string, string> = {};
        return {
            attributes,
            querySelector: () => child,
            setAttribute: (name, value) => {
                attributes[name] = value;
            },
            removeAttribute: (name) => {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- a Map here would change the shape every reader of this record depends on
                delete attributes[name];
            }
        };
    }

    // Red when the words stop being kept in place under the page's tooltip id, which is what the
    // control's description names, or when the wrapper carries a description of its own.
    it('keeps its words hidden in place under its tooltip id, with no description on the wrapper', () => {
        const body = tip({});
        const words = /<span id="(tip-\d+)"[^>]*hidden[^>]*>Put it back<\/span>/.exec(body);
        expect(words).not.toBe(null);
        // The description is put on the control on mount, so the markup carries none of its own,
        // and the bubble is drawn on the body, which a server render leaves empty.
        expect(body).not.toContain('aria-describedby');
        expect(body).not.toContain('role="tooltip"');
    });

    // Red when the empty string draws the tooltip machinery round its control.
    it('draws a plain wrapper and no bubble for the empty string', () => {
        const body = tip({ text: '' });
        expect(body).toContain('<button');
        expect(body).not.toContain('role="tooltip"');
        expect(body).not.toContain('data-tooltip-trigger');
    });

    // Red when words stop making the wrapper the bubble's trigger, or the described id is lost.
    it('makes the wrapper the trigger of a bubble for words, and describes the control by the bubble id', () => {
        const body = tip({});
        expect(body).toContain('data-tooltip-trigger');
        const button = element();
        const box = element(button as unknown as Element);
        expect(describedControl(box, false)).toBe(button);
        expect(describedBy('tip-1', 'Put it back', false)).toBe('tip-1');
    });

    // An audit of the markup the wrapper keeps. Red when a presentational wrapper loses its role
    // or describes its control.
    it('draws a presentational wrapper that describes nothing', () => {
        expect(tip({ presentational: true })).toContain('role="presentation"');
        expect(describedBy('tip-1', 'Put it back', true)).toBe('');
    });

    it('describes the control the wrapper holds, and not the wrapper', () => {
        const button = element();
        const box = element(button as unknown as Element);
        expect(describedControl(box, false)).toBe(button);
        expect(describedControl(box, true)).toBe(button);
    });

    it('describes nothing where the words repeat the control name or there are none', () => {
        expect(describedBy('tip-1', 'Put it back', false)).toBe('tip-1');
        expect(describedBy('tip-1', '', false)).toBe('');
        expect(describedBy('tip-1', 'Put it back', true)).toBe('');
    });

    it('describes a focusable wrapper itself when it holds no control', () => {
        const box = element();
        expect(describedControl(box, true)).toBe(box);
        expect(describedControl(box, false)).toBe(null);
    });

    it('describes nothing when it was given no words', () => {
        const body = tip({ text: '' });
        expect(body).not.toContain('aria-describedby');
        expect(body).not.toContain('role="tooltip"');
        expect(body).toContain('<button');
    });

    it('is presentational where the control it wraps is owned by its parent', () => {
        const body = tip({ presentational: true });
        expect(body).toContain('role="presentation"');
        expect(body).not.toContain('aria-describedby');
        expect(body).toContain('data-tooltip-trigger');
    });

    it('puts only a focusable wrapper in the tab order', () => {
        expect(tip({ focusable: true })).toContain('tabindex="0"');
        expect(tip({})).not.toContain('tabindex=');
    });

    // Red when Tooltip.svelte draws a provider of its own again: bits-ui then draws it alone, and
    // each bubble has a provider of its own that closes nothing when another opens.
    it('is refused by bits-ui when drawn outside the one tooltip group', () => {
        expect(
            () =>
                render(Tooltip, {
                    context: new Map([[TIP_KEY, createTipIds()]]),
                    props: { text: 'Put it back', children: control }
                }).body
        ).toThrow(/Tooltip\.Provider/);
    });

    // Red when the page's layout stops wrapping what it draws in the tooltip group: the tooltip
    // under it is then refused.
    it('is drawn under the page layout, which holds the one group', () => {
        const body = render(LaidOutTooltip, {
            context: new Map([[TIP_KEY, createTipIds()]])
        }).body;
        expect(body).toContain('data-tooltip-trigger');
        expect(body).toContain('>Put it back</span>');
    });

    // There is no DOM in this suite, so the listener is read off the source rather than fired: an
    // overlay taking focus while the pointer rests on a control is a browser-suite check.
    it('puts an open bubble away when focus lands outside its own wrapper', () => {
        const source = readFileSync('src/lib/ui/menu/Tooltip.svelte', 'utf8');
        expect(source).toContain("document.addEventListener('focusin', elsewhere)");
        expect(source).toContain("document.removeEventListener('focusin', elsewhere)");
        expect(source).toContain('if (target instanceof Node && box.contains(target)) return;');
    });
});
