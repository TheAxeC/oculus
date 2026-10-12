// Layer 3, shared view helper tests. Where a link between documents opens, read from the document
// that holds it: the Help view, a document of the engine or a document of the hub, in the space the
// linking document is read in, over hand-built answers with the engine folder at `tools/oculus` in
// the hub and with the engine outside the hub.

import { describe, expect, it } from 'vitest';
import { docLinkOf, openingOf } from '../../../../src/lib/views/shared/prose/doc-link.ts';

/** What an openingOf call reads of a document answer. */
type Doc = { engine: boolean; engineAt: string; engineHub: string; hub: string; manual: string };

/**
 * The answer of a document of the hub `hub`, the engine folder at `engineAt` in the same hub, or in
 * no hub when `engineAt` is empty.
 */
function hubDoc(engineAt: string, hub = 'hub'): Doc {
    const manual = engineAt === '' ? '' : `${engineAt}/HELP.md`;
    return { engine: false, engineAt, engineHub: engineAt === '' ? '' : hub, hub, manual };
}

/**
 * The answer of a document of the engine, the engine folder at `engineAt` in the hub `engineHub`.
 */
function engineDoc(engineAt: string, engineHub = 'hub'): Doc {
    return {
        engine: true,
        engineAt,
        engineHub: engineAt === '' ? '' : engineHub,
        hub: '',
        manual: 'HELP.md'
    };
}

const ROWS = [
    {
        row: 'a hub link that climbs out of the hub opens nothing',
        doc: hubDoc('tools/oculus'),
        from: 'docs/DATA-MAP.md',
        href: '../../x.md',
        opens: null
    },
    {
        row: 'a hub link that climbs out of the hub opens nothing with the engine outside it',
        doc: hubDoc(''),
        from: 'docs/DATA-MAP.md',
        href: '../../x.md',
        opens: null
    },
    {
        row: 'a hub link to another hub document opens it',
        doc: hubDoc('tools/oculus'),
        from: 'docs/DATA-MAP.md',
        href: 'RESEARCH-APPROACH.md',
        opens: { kind: 'hub', path: 'docs/RESEARCH-APPROACH.md', hub: 'hub' }
    },
    {
        row: 'a hub link to the manual opens the Help view',
        doc: hubDoc('tools/oculus'),
        from: 'docs/DATA-MAP.md',
        href: '../tools/oculus/HELP.md',
        opens: { kind: 'help' }
    },
    {
        row: 'a hub link into the engine folder opens the engine document',
        doc: hubDoc('tools/oculus'),
        from: 'docs/DATA-MAP.md',
        href: '../tools/oculus/docs/apps.md',
        opens: { kind: 'engine', path: 'docs/apps.md' }
    },
    {
        row: 'an engine link to the manual opens the Help view',
        doc: engineDoc('tools/oculus'),
        from: 'docs/apps.md',
        href: '../HELP.md',
        opens: { kind: 'help' }
    },
    {
        row: 'an engine link to an engine document opens it with the engine outside the hub',
        doc: engineDoc(''),
        from: 'HELP.md',
        href: 'docs/apps.md',
        opens: { kind: 'engine', path: 'docs/apps.md' }
    },
    {
        row: 'an engine link out of the engine opens a hub document at its place in the hub',
        doc: engineDoc('tools/oculus'),
        from: 'docs/apps.md',
        href: '../../../x.md',
        opens: { kind: 'hub', path: 'x.md', hub: 'hub' }
    },
    {
        row: 'a link between documents of a second hub opens a document of that hub',
        doc: hubDoc('', 'lab'),
        from: 'docs/DATA-MAP.md',
        href: 'RESEARCH-APPROACH.md',
        opens: { kind: 'hub', path: 'docs/RESEARCH-APPROACH.md', hub: 'lab' }
    },
    {
        row: 'an engine link out of the engine opens a document of the hub that holds the engine',
        doc: engineDoc('tools/oculus', 'lab'),
        from: 'docs/apps.md',
        href: '../../../x.md',
        opens: { kind: 'hub', path: 'x.md', hub: 'lab' }
    },
    {
        row: 'an engine link out of the engine and the hub opens nothing',
        doc: engineDoc('tools/oculus'),
        from: 'docs/apps.md',
        href: '../../../../x.md',
        opens: null
    },
    {
        row: 'an engine link out of the engine opens nothing with the engine outside the hub',
        doc: engineDoc(''),
        from: 'docs/apps.md',
        href: '../../x.md',
        opens: null
    },
    {
        row: 'an engine link into a dot folder opens nothing with the engine outside the hub',
        doc: engineDoc(''),
        from: 'HELP.md',
        href: '.scratch/x.md',
        opens: null
    }
];

describe('where a link between documents opens', () => {
    it.each(ROWS)('$row', ({ doc, from, href, opens }) => {
        const link = docLinkOf(href, from);
        expect(link).not.toBeNull();
        expect(link === null ? 'no link' : openingOf(link, doc)).toEqual(opens);
    });
});
