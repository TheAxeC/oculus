// Layer 4, view helper test. A press on a fragment link scrolls the heading it names to the top of
// the box that scrolls it, in the box's own pixels: a box drawn scaled by a transform measures its
// rectangles in screen pixels and scrolls in layout pixels, so the distance is divided by the
// scale.
//
// The suite has no DOM, so the box, the link and the heading are stubs holding only what jump.ts
// reads: a rectangle, a layout height, a scroll offset and the lookups it makes. The stubs replace
// the two names jump.ts reads from the page (`Element` and `getComputedStyle`) for each case only.
//
// What this does NOT cover: a real browser's rectangles under a real transform.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { jump } from '../../../../src/lib/views/shared/prose/jump.ts';

class Stub {
    parentElement: Stub | null = null;
    id = '';
    attributes: Record<string, string> = {};
    overflowY = 'visible';
    scrollTop = 0;
    scrollHeight = 0;
    clientHeight = 0;
    offsetHeight = 0;
    top = 0;
    height = 0;
    children: Stub[] = [];

    add(child: Stub): Stub {
        child.parentElement = this;
        this.children.push(child);
        return child;
    }

    getAttribute(name: string): string | null {
        return this.attributes[name] ?? null;
    }

    getBoundingClientRect(): { top: number; height: number } {
        return { top: this.top, height: this.height };
    }

    matches(selector: string): boolean {
        if (selector === 'a') return this.attributes.tag === 'a';
        return selector.replace(/^\[|\]$/g, '') in this.attributes;
    }

    closest(selector: string): Stub | null {
        if (this.matches(selector)) return this;
        return this.parentElement?.closest(selector) ?? null;
    }

    querySelectorAll(): Stub[] {
        return this.children.flatMap((child) => [child, ...child.querySelectorAll()]);
    }
}

beforeEach(() => {
    vi.stubGlobal('Element', Stub);
    vi.stubGlobal('getComputedStyle', (node: Stub) => ({ overflowY: node.overflowY }));
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/**
 * A view box holding a scroller that holds a heading 200 layout pixels below the scroller's top,
 * with the scroller drawn at the scale `scale` (its screen height is its layout height times it).
 */
function drawn(scale: number): { link: Stub; scroller: Stub } {
    const box = new Stub();
    box.attributes['data-instance'] = 'one';
    const scroller = box.add(new Stub());
    scroller.attributes['data-scroll'] = '';
    scroller.overflowY = 'auto';
    scroller.scrollHeight = 2000;
    scroller.clientHeight = 720;
    scroller.offsetHeight = 720;
    scroller.height = 720 * scale;
    scroller.top = 50;
    const heading = scroller.add(new Stub());
    heading.id = 'method';
    heading.top = 50 + 200 * scale;
    const link = box.add(new Stub());
    link.attributes.tag = 'a';
    link.attributes.href = '#method';
    return { link, scroller };
}

function press(link: Stub): void {
    jump({ target: link, preventDefault: () => undefined } as unknown as MouseEvent);
}

describe('jump', () => {
    it('audits that a heading scrolls to the top of an unscaled box by the distance it is down', () => {
        const { link, scroller } = drawn(1);
        press(link);
        expect(scroller.scrollTop).toBe(200);
    });

    it('audits that the distance is divided by the scale of the box it scrolls', () => {
        const { link, scroller } = drawn(0.5);
        press(link);
        expect(scroller.scrollTop).toBe(200);
    });

    it('audits that the scale is taken as 1 when the box has no layout height yet', () => {
        const { link, scroller } = drawn(0.5);
        scroller.offsetHeight = 0;
        press(link);
        expect(scroller.scrollTop).toBe(100);
    });
});
