// Layer 3, primitive test. The strip a pane draws between its header and its body, and the
// overflow opener of the header toolbar, rendered to HTML on the server. A server render runs no
// layout, so the toolbar is told how many controls are clipped instead of measuring them.

import { describe, expect, it } from 'vitest';
import { createRawSnippet } from 'svelte';
import { render } from 'svelte/server';
import Pane from '../../../src/lib/ui/frame/Pane.svelte';
import Toolbar from '../../../src/lib/ui/frame/toolbar/Toolbar.svelte';
import { setCatalog, setGlyphs, setIcons } from '../../../src/lib/state/shared/words/text.ts';
import {
    engineDir,
    glyphCatalog,
    iconSet,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { clientContext, createClientState } from '../../fixtures/client.ts';

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
setGlyphs(glyphCatalog(config));
setIcons(iconSet(config));
const context = clientContext(createClientState());

const words = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

describe('the strip under a pane header', () => {
    it('draws no strip for a pane with no toolbar and no bar', () => {
        expect(render(Pane, { context, props: { title: 'Gallery' } }).body).not.toContain(
            'viewbar'
        );
    });

    it('draws the strip, and no header toolbar, for a pane with a bar and no toolbar', () => {
        const { body } = render(Pane, {
            context,
            props: { title: 'Gallery', bar: words('filters') }
        });
        expect(body).toContain('viewbar');
        expect(body).toContain('filters');
        expect(body).not.toContain('class="tools');
    });

    it('draws the bar between the header and the body', () => {
        const { body } = render(Pane, {
            context,
            props: { title: 'Gallery', bar: words('filters'), children: words('content') }
        });
        expect(body.indexOf('</header>')).toBeLessThan(body.indexOf('viewbar'));
        expect(body.indexOf('viewbar')).toBeLessThan(body.indexOf('data-scroll'));
    });
});

describe('the overflow opener of a toolbar', () => {
    it('draws the opener only when told some control is clipped', () => {
        const held = { label: 'Controls', overflow: true, children: words('a') };
        const none = render(Toolbar, { context, props: held }).body;
        const some = render(Toolbar, { context, props: { ...held, shown: 1 } }).body;
        expect(none).not.toContain('data-glyph="more"');
        expect(some).toContain('data-glyph="more"');
    });

    it('draws no opener for a toolbar that is not asked to overflow', () => {
        const body = render(Toolbar, {
            context,
            props: { label: 'Controls', children: words('a'), shown: 1 }
        }).body;
        expect(body).not.toContain('data-glyph="more"');
    });
});
