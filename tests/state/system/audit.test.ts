// The audit store: what the `audit` channel delivered, split into the findings the reader has not
// parked and the ones they have, and the open count the view's badge draws.
//
// Nothing here touches the network or the real hub: a case hands the client a message of its own.

import { beforeEach, describe, expect, it } from 'vitest';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import type { AuditFinding, AuditPayload } from '../../../src/lib/data/model/index.ts';
import { auditSearch, findingsOfKind } from '../../../src/lib/state/system/audit.ts';

let client: ClientState;
let receive: ClientState['entities']['receive'];

beforeEach(() => {
    client = createClientState();
    ({ receive } = client.entities);
});

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

function deliver(payload: AuditPayload, version = 1): void {
    receive({ channel: 'audit', version, payload });
}

describe('the audit store', () => {
    it('holds nothing before the first scan arrives', () => {
        expect(client.audit.findings()).toEqual([]);
        expect(client.audit.muted()).toEqual([]);
        expect(client.audit.open()).toEqual([]);
        expect(client.audit.parked()).toEqual([]);
        expect(client.audit.openCount()).toBe(0);
    });

    it('splits the findings by the mute list the payload carries', () => {
        const one = finding();
        const two = finding({ signature: 'aaaabbbbcccc', kind: 'data', message: 'a gap' });
        deliver({ findings: [one, two], muted: ['aaaabbbbcccc'] });

        expect(client.audit.findings()).toEqual([one, two]);
        expect(client.audit.muted()).toEqual(['aaaabbbbcccc']);
        expect(client.audit.open()).toEqual([one]);
        expect(client.audit.parked()).toEqual([two]);
        expect(client.audit.openCount()).toBe(1);
    });

    it('answers one section with the open findings of that kind', () => {
        const marker = finding();
        const gap = finding({ signature: 'aaaabbbbcccc', kind: 'data' });
        const parked = finding({ signature: 'ddddeeeeffff', kind: 'data' });
        deliver({ findings: [marker, gap, parked], muted: ['ddddeeeeffff'] });

        expect(client.audit.section('todo')).toEqual([marker]);
        expect(client.audit.section('data')).toEqual([gap]);
        expect(client.audit.section('conform')).toEqual([]);
    });

    it('takes the newest scan and drops one that arrives behind it', () => {
        deliver({ findings: [finding()], muted: [] }, 2);
        deliver({ findings: [], muted: [] }, 1);
        expect(client.audit.openCount()).toBe(1);

        deliver({ findings: [], muted: [] }, 3);
        expect(client.audit.openCount()).toBe(0);
    });

    it('is what the view badge counts, and draws nothing at zero', () => {
        expect(client.railBadges.auditBadge()).toBe('');
        deliver({ findings: [finding(), finding({ signature: 'aaaabbbbcccc' })], muted: [] });
        expect(client.railBadges.auditBadge()).toBe('2');
        deliver({ findings: [finding()], muted: ['0123456789ab'] }, 2);
        expect(client.railBadges.auditBadge()).toBe('');
    });

    it('belongs to one client, so a scan delivered to one is not in the other', () => {
        const other = createClientState();
        deliver({ findings: [finding()], muted: [] });
        expect(client.audit.openCount()).toBe(1);
        expect(other.audit.openCount()).toBe(0);
    });
});

describe('the findings a search keeps and a section holds', () => {
    const finding = (kind: string, scope: string, where: string, message: string) =>
        ({ kind, scope, where, message }) as unknown as Parameters<typeof auditSearch>[0][number];
    const findings = [
        finding('todo', 'alpha', 'README.md', 'A TODO is left'),
        finding('data', 'beta', 'project.yml', 'the dataset is unknown')
    ];

    it('are the ones whose scope, place or message holds the search, case aside', () => {
        expect(auditSearch(findings, 'readme').map((one) => one.scope)).toEqual(['alpha']);
        expect(auditSearch(findings, 'UNKNOWN').map((one) => one.scope)).toEqual(['beta']);
        expect(auditSearch(findings, '  ')).toBe(findings);
    });

    it('are the ones of the section kind', () => {
        expect(findingsOfKind(findings, 'data').map((one) => one.scope)).toEqual(['beta']);
    });
});
