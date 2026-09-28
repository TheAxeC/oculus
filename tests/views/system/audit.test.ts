// Layer 4, view test. The Audit view: the six sections with a count each, a card per finding, the
// muted section at the end, and the search that filters the cards.
//
// The scan is handed to the client as a message of its own, so nothing here reads the real hub.
// What this does NOT cover: pressing mute, which posts a write.

import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { beforeEach, describe, expect, it } from 'vitest';
import Audit, { registration } from '../../../src/lib/views/system/audit/Audit.svelte';
import type { ViewRegistration } from '../../../src/lib/state/workbench/navigation/registry.ts';
import {
    engineDir,
    glyphCatalog,
    loadConfig,
    textCatalog
} from '../../../src/lib/data/sources/config.ts';
import { setCatalog, setGlyphs } from '../../../src/lib/state/shared/words/text.ts';
import type { Instance } from '../../../src/lib/state/workbench/layout/index.ts';
import type { AuditFinding } from '../../../src/lib/data/model/index.ts';
import { clientContext, createClientState, type ClientState } from '../../fixtures/client.ts';

let client: ClientState;

beforeEach(() => {
    client = createClientState();
});

const config = loadConfig(engineDir()).config;
const catalog = textCatalog(config);
setCatalog(catalog);
setGlyphs(glyphCatalog(config));

const instance: Instance = { id: 'audit-one', view: 'audit', state: {} };

const source = readFileSync('src/lib/views/system/audit/Audit.svelte', 'utf8');

function finding(over: Partial<AuditFinding> = {}): AuditFinding {
    return {
        scope: 'projects/active/alpha',
        where: 'README.md',
        kind: 'todo',
        message: 'one open marker',
        signature: '0123456789ab',
        ...over
    };
}

/** The view over one scan, with the pane state a case wants. */
function drawn(
    findings: AuditFinding[],
    muted: string[] = [],
    state: Record<string, unknown> = {}
): string {
    client.entities.receive({ channel: 'audit', version: 1, payload: { findings, muted } });
    client.ui.setInstanceState(instance.id, state);
    return render(Audit, { context: clientContext(client), props: { instance } }).body;
}

/** The section ids the body drew, in order. */
function sections(body: string): string[] {
    return [...body.matchAll(/data-section="([^"]+)"/g)].map((one) => one[1]);
}

/** The card ids the body drew, in order. */
function cards(body: string): string[] {
    return [...body.matchAll(/data-card="([^"]+)"/g)].map((one) => one[1]);
}

/** The module's own registration, under the type every view module exports. */
const registered = registration as ViewRegistration;

describe('the Audit registration', () => {
    it('follows the configuration in the System group and carries the open count', () => {
        expect(registered).toMatchObject({
            id: 'audit',
            label: 'views.audit',
            glyph: 'views.audit_glyph',
            group: 'info',
            order: 2
        });
        expect(typeof registered.badge).toBe('function');
    });
});

describe('the sections', () => {
    const six = [
        finding({ kind: 'todo', signature: 'aaaaaaaaaaa1' }),
        finding({ kind: 'data', signature: 'aaaaaaaaaaa2', message: 'missing `results`' }),
        finding({ kind: 'conform', signature: 'aaaaaaaaaaa3', message: 'missing README' }),
        finding({ kind: 'manifest', signature: 'aaaaaaaaaaa6', message: 'contradictory chips' }),
        finding({ kind: 'readability', signature: 'aaaaaaaaaaa4', message: '400 chars' }),
        finding({ kind: 'publink', signature: 'aaaaaaaaaaa5', message: 'not on the website' })
    ];

    it('draws the six in the order the scan reports them', () => {
        expect(sections(drawn(six))).toEqual([
            'todo',
            'data',
            'conform',
            'manifest',
            'readability',
            'publink'
        ]);
    });

    it('names each with the words of the catalog', () => {
        const body = drawn(six);
        for (const key of [
            'audit.sec_todo',
            'audit.sec_data',
            'audit.sec_conform',
            'audit.sec_manifest',
            'audit.sec_readability',
            'audit.sec_publink'
        ]) {
            expect(body).toContain(catalog[key]);
        }
    });

    it('draws no section for a kind the scan reported nothing of', () => {
        expect(sections(drawn([finding()]))).toEqual(['todo']);
    });

    it('counts the findings of each section', () => {
        const body = drawn([
            finding({ signature: 'aaaaaaaaaaa1' }),
            finding({ signature: 'aaaaaaaaaaa2' }),
            finding({ kind: 'data', signature: 'aaaaaaaaaaa3' })
        ]);
        expect([...body.matchAll(/class="count[^"]*">(\d+)</g)].map((one) => one[1])).toEqual([
            '2',
            '1'
        ]);
    });
});

describe('the cards', () => {
    it('draws one per finding, keyed by its signature, with the place and the message', () => {
        const body = drawn([finding()]);
        expect(cards(body)).toEqual(['0123456789ab']);
        expect(body).toContain('projects/active/alpha');
        expect(body).toContain('README.md');
        expect(body).toContain('one open marker');
    });

    it('draws a backticked word of the message as code, with no backtick left', () => {
        const body = drawn([finding({ message: 'missing `results`' })]);
        expect(body).toMatch(/<code[^>]*>results<\/code>/);
        // CodeText draws the field between backticks as code, so the marks themselves are dropped.
        expect(body).not.toContain('`results`');
    });

    it('carries the mute control on an open card', () => {
        expect(drawn([finding()])).toContain(catalog['audit.mute']);
    });
});

describe('the muted section', () => {
    it('holds the parked findings and keeps them out of their own section', () => {
        const body = drawn(
            [finding({ signature: 'aaaaaaaaaaa1' }), finding({ signature: 'aaaaaaaaaaa2' })],
            ['aaaaaaaaaaa2']
        );
        expect(sections(body)).toEqual(['todo', 'muted']);
        expect(cards(body)).toEqual(['aaaaaaaaaaa1']);
        expect(body).toContain(catalog['audit.muted']);
    });

    it('draws the parked cards with the un-mute control once it is opened', () => {
        const body = drawn([finding()], ['0123456789ab'], { showMuted: true });
        expect(cards(body)).toEqual(['0123456789ab']);
        expect(body).toContain(catalog['audit.unmute']);
    });

    it('is not drawn at all when nothing is parked', () => {
        // nothing is muted, so the parked section is not drawn at all
        expect(sections(drawn([finding()]))).not.toContain('muted');
    });
});

describe('the search', () => {
    const three = [
        finding({ signature: 'aaaaaaaaaaa1', scope: 'projects/active/alpha' }),
        finding({ signature: 'aaaaaaaaaaa2', scope: 'projects/active/beta' }),
        finding({ signature: 'aaaaaaaaaaa3', scope: 'projects/ideas/gamma', message: 'a gap' })
    ];

    it('keeps the cards whose scope, place or message holds the words', () => {
        expect(cards(drawn(three, [], { search: 'beta' }))).toEqual(['aaaaaaaaaaa2']);
        expect(cards(drawn(three, [], { search: 'a gap' }))).toEqual(['aaaaaaaaaaa3']);
        expect(cards(drawn(three, [], { search: 'ALPHA' }))).toEqual(['aaaaaaaaaaa1']);
    });

    it('says nothing matches when the search leaves no card', () => {
        const body = drawn(three, [], { search: 'nothing like it' });
        expect(cards(body)).toEqual([]);
        expect(body).toContain(catalog['audit.none_match']);
    });

    it('draws every card again when the search is empty', () => {
        expect(cards(drawn(three, [], { search: '' }))).toHaveLength(3);
    });
});

describe('an empty scan', () => {
    it('says everything is clear, and points at Findings for the rest', () => {
        const body = drawn([]);
        expect(body).toContain(catalog['audit.empty']);
        expect(body).toContain(catalog['audit.findings_note']);
    });

    it('carries a control that opens the Findings view beside that note', () => {
        expect(drawn([])).toContain(catalog['audit.open_findings']);
        expect(source).toContain("openView('findings')");
    });
});

describe('the view as it is written', () => {
    it('draws a card with the primitive and filters with the search primitive', () => {
        expect(source).toContain("import Card from '$lib/ui/frame/Card.svelte'");
        expect(source).toContain("import Search from '$lib/ui/controls/Search.svelte'");
        expect(source).not.toMatch(/<input\b/);
        expect(source).not.toMatch(/<button\b/);
    });

    it('posts the mute through the writes store rather than its own fetch', () => {
        expect(source).toContain('writes: { muteFinding }');
        // the mute goes through the writes store, so the view holds no request of its own
        expect(source).not.toContain('fetch(');
    });

    it('draws a sentence of its own for a refusal, never the endpoint word', () => {
        expect(source).toContain(
            "import { auditSearch, findingsOfKind, muteMessage } from '$lib/state/system/audit'"
        );
        expect(source).toContain('failed = muteMessage(answer);');
        // the refusal is worded from the catalog, so the endpoint's own word is not read
        expect(source).not.toContain('answer.error');
    });
});
