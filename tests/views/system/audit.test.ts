// Layer 4, view test. The Audit view: the six sections with a count each, a list row per finding,
// the muted section at the end, and the search that filters the rows.
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

/** The ids of the list rows the body drew, in order. */
function rows(body: string): string[] {
    return [...body.matchAll(/<li[^>]*data-card="([^"]+)"/g)].map((one) => one[1]);
}

/** The markup of one row, from its opening tag to the next row or the end of its list. */
function rowOf(body: string, signature: string): string {
    const from = body.indexOf(`data-card="${signature}"`);
    const to = body.indexOf('</li>', from);
    return body.slice(from, to);
}

/** The module's own registration, under the type every view module exports. */
const registered = registration as ViewRegistration;

describe('the Audit registration', () => {
    it('follows the configuration in the System group and carries the open count', () => {
        expect(registered).toMatchObject({
            id: 'audit',
            label: 'views.audit',
            glyph: 'views.audit_glyph',
            group: 'views',
            order: 6
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

describe('the rows', () => {
    it('draws one list row per finding, keyed by its signature, in the sections in the scan order', () => {
        const body = drawn([
            finding({ signature: 'aaaaaaaaaaa1' }),
            finding({ signature: 'aaaaaaaaaaa2' }),
            finding({ kind: 'data', signature: 'aaaaaaaaaaa3' })
        ]);
        expect(sections(body)).toEqual(['todo', 'data']);
        expect(rows(body)).toEqual(['aaaaaaaaaaa1', 'aaaaaaaaaaa2', 'aaaaaaaaaaa3']);
        expect([...body.matchAll(/class="count[^"]*">(\d+)</g)].map((one) => one[1])).toEqual([
            '2',
            '1'
        ]);
        expect(body).not.toMatch(/<article/);
        expect([...body.matchAll(/<ul/g)]).toHaveLength(2);
    });

    it('draws the scope, the message, the place and the mute control in one row', () => {
        const body = drawn([finding()]);
        expect(rows(body)).toEqual(['0123456789ab']);
        const row = rowOf(body, '0123456789ab');
        const order = [
            'projects/active/alpha',
            'one open marker',
            'README.md',
            catalog['audit.mute']
        ];
        const at = order.map((words) => row.indexOf(words));
        expect(at.every((place) => place >= 0)).toBe(true);
        expect(at).toEqual([...at].sort((one, two) => one - two));
        expect(body).not.toMatch(/<h4/);
    });

    it('draws a backticked word of the message as code, with no backtick left', () => {
        const body = drawn([finding({ message: 'missing `results`' })]);
        expect(body).toMatch(/<code[^>]*>results<\/code>/);
        // CodeText draws the field between backticks as code, so the marks themselves are dropped.
        expect(body).not.toContain('`results`');
    });

    it('draws a message holding markup and an unmatched backtick as text, with no element', () => {
        const body = drawn([finding({ message: '<b>x</b> and a stray `tick' })]);
        const row = rowOf(body, '0123456789ab');
        expect(row).toContain('&lt;b>x&lt;/b>');
        // the message is text, so its angle brackets are escaped and no bold element is made
        expect(row).not.toContain('<b>');
        // an unmatched backtick opens no span, so the stray word is not wrapped as code
        expect(row).not.toContain('<code');
    });

    it('carries the mute control on an open row', () => {
        const row = rowOf(drawn([finding()]), '0123456789ab');
        expect(row).toContain(`aria-label="${catalog['audit.mute']}"`);
        // the finding is open, so the control offered parks it and the one that restores it is
        // left out
        expect(row).not.toContain(`aria-label="${catalog['audit.unmute']}"`);
    });

    it('draws a row with an empty scope or an empty place with the control and no empty element', () => {
        const body = drawn([finding({ scope: '', where: '' })]);
        const row = rowOf(body, '0123456789ab');
        expect(row).toContain(catalog['audit.mute']);
        expect(row).toContain('one open marker');
        // the scope is empty, so the row draws no element that would leave a blank gap
        expect(row).not.toContain('class="scope');
        // the place is empty too, so no element is drawn for it either
        expect(row).not.toContain('class="where');
    });

    it('draws two findings carrying one signature as two rows', () => {
        const body = drawn([finding(), finding({ scope: 'projects/active/beta' })]);
        expect(rows(body)).toEqual(['0123456789ab', '0123456789ab']);
    });
});

describe('the muted section', () => {
    it('holds the parked findings and keeps them out of their own section', () => {
        const body = drawn(
            [finding({ signature: 'aaaaaaaaaaa1' }), finding({ signature: 'aaaaaaaaaaa2' })],
            ['aaaaaaaaaaa2']
        );
        expect(sections(body)).toEqual(['todo', 'muted']);
        expect(rows(body)).toEqual(['aaaaaaaaaaa1']);
        expect(body).toContain(catalog['audit.muted']);
    });

    it('draws the parked rows with the un-mute control once it is opened', () => {
        const body = drawn([finding()], ['0123456789ab'], { showMuted: true });
        expect(rows(body)).toEqual(['0123456789ab']);
        const row = rowOf(body, '0123456789ab');
        expect(row).toContain(`aria-label="${catalog['audit.unmute']}"`);
        // the finding is parked, so the control offered is the one that restores it
        expect(row).not.toContain(`aria-label="${catalog['audit.mute']}"`);
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

    it('keeps the rows whose scope, place or message holds the words', () => {
        expect(rows(drawn(three, [], { search: 'beta' }))).toEqual(['aaaaaaaaaaa2']);
        expect(rows(drawn(three, [], { search: 'a gap' }))).toEqual(['aaaaaaaaaaa3']);
        expect(rows(drawn(three, [], { search: 'ALPHA' }))).toEqual(['aaaaaaaaaaa1']);
    });

    it('says nothing matches when the search leaves no row', () => {
        const body = drawn(three, [], { search: 'nothing like it' });
        expect(rows(body)).toEqual([]);
        expect(body).toContain(catalog['audit.none_match']);
    });

    it('draws every row again when the search is empty', () => {
        expect(rows(drawn(three, [], { search: '' }))).toHaveLength(3);
    });

    it('keeps the muted section, with its count, when only a parked finding matches', () => {
        const body = drawn(three, ['aaaaaaaaaaa1', 'aaaaaaaaaaa2'], { search: 'beta' });
        expect(rows(body)).toEqual([]);
        expect(sections(body)).toEqual(['muted']);
        expect([...body.matchAll(/class="count[^"]*">(\d+)</g)].map((one) => one[1])).toEqual([
            '1'
        ]);
        // a parked finding matched, so the search found something and gives no empty answer
        expect(body).not.toContain(catalog['audit.none_match']);
    });
});

describe('the pane state the view reads', () => {
    const open = finding({ signature: 'aaaaaaaaaaa1', message: 'x open' });
    const plain = finding({ signature: 'aaaaaaaaaaa2', message: 'plain' });
    const parked = finding({ signature: 'aaaaaaaaaaa3', message: 'x parked' });
    const all = [open, plain, parked];

    /** The value of the search box the body drew. */
    function boxed(body: string): string | undefined {
        return /<input[^>]*\svalue="([^"]*)"/.exec(body)?.[1];
    }

    it('reads a search that is no text as empty and a muted flag that is not true as closed', () => {
        const body = drawn(all, ['aaaaaaaaaaa3'], { search: 3, showMuted: 'yes' });
        expect(rows(body)).toEqual(['aaaaaaaaaaa1', 'aaaaaaaaaaa2']);
        expect(sections(body)).toContain('muted');
        expect(boxed(body)).toBe('');
    });

    it('reads a text search and a true muted flag as given', () => {
        const body = drawn(all, ['aaaaaaaaaaa3'], { search: 'x', showMuted: true });
        expect(rows(body)).toEqual(['aaaaaaaaaaa1', 'aaaaaaaaaaa3']);
        expect(boxed(body)).toBe('x');
    });

    it('reads a state that is no map as an empty one', () => {
        for (const state of [null, [], 'x', 3]) {
            const body = drawn(all, ['aaaaaaaaaaa3'], state as unknown as Record<string, unknown>);
            expect(rows(body)).toEqual(['aaaaaaaaaaa1', 'aaaaaaaaaaa2']);
        }
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
    it('audits that the mute control is disabled while a write is out and sends no second one', () => {
        expect(source).toContain('disabled={busy}');
        expect(source).toContain('if (busy) return;');
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
