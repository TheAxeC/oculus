// Layer 3, view test. The right-click menu of rendered Markdown and of the Document view's frame,
// built by views/shared/prose/prose-menu.ts: Copy over a selection, Copy Image over any image, and
// Open Image over an image the hub serves, whose root and path its address names.
//
// The words are a stand-in `t` that answers each key as `@key`.
//
// What this does NOT cover: the menu opened in the prose or the frame, the clipboard written and
// the file view opened, which need a DOM and are seen at the look.

import { describe, expect, it } from 'vitest';
import { hubFileOf, proseMenu } from '../../../../src/lib/views/shared/prose/prose-menu.ts';

const words = (key: string, ...args: (string | number)[]): string =>
    args.length === 0 ? `@${key}` : `@${key}(${args.join(',')})`;

const ORIGIN = 'http://127.0.0.1:8790';

describe('the prose menu', () => {
    // Revert: drop the Copy group from proseMenu.
    it('audits that offers Copy over a selection', () => {
        expect(
            proseMenu({ selection: true, image: null, origin: ORIGIN }, words).map((i) => i.label)
        ).toEqual(['@ui.prose_copy']);
    });

    // Revert: offer Open Image only when hubFileOf answers null.
    it('audits that offers Copy Image and Open Image over an image the hub serves', () => {
        const image = `${ORIGIN}/api/file/hub/notes/a%20b.png?v=3`;
        expect(
            proseMenu({ selection: false, image, origin: ORIGIN }, words).map((i) => i.label)
        ).toEqual(['@ui.prose_copy_image', '@ui.prose_open_image']);
    });

    // Revert: offer Open Image over every image in proseMenu.
    it('audits that offers Copy Image alone over an image from elsewhere', () => {
        const image = 'https://example.org/a.png';
        expect(
            proseMenu({ selection: false, image, origin: ORIGIN }, words).map((i) => i.label)
        ).toEqual(['@ui.prose_copy_image']);
    });

    // Revert: offer Copy in proseMenu whatever `selection` says.
    it('audits that offers nothing with neither', () => {
        expect(proseMenu({ selection: false, image: null, origin: ORIGIN }, words)).toEqual([]);
    });
});

describe('the file an image address names', () => {
    // Revert: drop decodeURIComponent from hubFileOf.
    it('audits that reads the root and the path of an api/file address, decoded', () => {
        expect(hubFileOf(`${ORIGIN}/api/file/hub/notes/a%20b.png?v=3`, ORIGIN)).toEqual({
            root: 'hub',
            path: 'notes/a b.png'
        });
        expect(hubFileOf('/api/file/my%20root/x.png', ORIGIN)).toEqual({
            root: 'my root',
            path: 'x.png'
        });
    });

    // Revert: drop the `url.origin !== origin` test from hubFileOf.
    it('audits that reads nothing of an address on another origin or outside api/file', () => {
        expect(hubFileOf('https://example.org/api/file/hub/a.png', ORIGIN)).toBeNull();
        expect(hubFileOf(`${ORIGIN}/api/docs/a.png`, ORIGIN)).toBeNull();
        expect(hubFileOf(`${ORIGIN}/api/file/hub/`, ORIGIN)).toBeNull();
    });
});
