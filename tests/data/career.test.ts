// sources/career.ts and the career half of normalise and validate, over a synthetic hub written
// under mkdtemp. Nothing here touches the real hub.

import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAREER_FILE, readCareer } from '../../src/lib/data/sources/career.ts';
import { engineDir, loadConfig, textCatalog } from '../../src/lib/data/sources/config.ts';
import { career } from '../../src/lib/data/normalise.ts';
import { validate } from '../../src/lib/data/validate.ts';
import { NO_FEEDS } from '../entities-fixture.ts';
import type { RawPortfolio, ValidationRules } from '../../src/lib/data/model.ts';

/** The catalog the findings are worded from: the one oculus ships, read as the server reads it. */
const CATALOG = textCatalog(loadConfig(engineDir()).config);

const CAREER = `title: Career strategy
milestone: "FWO Senior - 2 shots left (Nov 2026 and Nov 2027)."
situation:
  PhD: "May 2023, KU Leuven"
  Now: "Postdoc, U Twente"
order:
  - { task: "Veni pre-proposal", when: "~1 Sep" }
  - { task: "ENW-XS", when: "15 Sep", note: "optional" }
  - "a plain string task"
order_note: "the order is a priority order"
hosts:
  - { name: "Naesens", inst: "KU Leuven", tag: "transplant", status: "warm", proposal: "Strong", backing: "High", note: "[proposal: Strong | backing: High] Federated outcome prediction." }
  - { name: "Vermeesch", status: "candidate", proposal: "Strong" }
  - { name: "Nobody", status: "mulled" }
host_criteria:
  - "Clinic-embedded"
not_hosts:
  - { who: "Peeters", why: "former advisor" }
eligibility:
  rule: ["PhD 3-6 yr before 1 Oct of start", ">= 2 yr postdoc"]
  shots: ["Nov 2026", "Nov 2027"]
  caveat: "a rushed try risks the second"
dropped:
  - { what: "MSCA-PF 2026" }
  - { what: "NWO Vidi", why: "not yet eligible" }
`;

function hub(body: string | null): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-career-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    if (body !== null) {
        const full = join(dir, 'CAREER.yml');
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        writeFileSync(full, body);
    }
    return dir;
}

describe('reading the career file', () => {
    it('parses it as the map it is, with no key renamed', () => {
        const { career: raw, findings } = readCareer(hub(CAREER), CAREER_FILE, CATALOG);
        expect(findings).toEqual([]);
        expect(Object.keys(raw ?? {})).toContain('host_criteria');
    });

    it('answers null with no finding when the hub holds no career file', () => {
        const { career: raw, findings } = readCareer(hub(null), CAREER_FILE, CATALOG);
        expect(raw).toBeNull();
        expect(findings).toEqual([]);
    });

    it('reports a file that does not parse', () => {
        const { career: raw, findings } = readCareer(
            hub('title: [unclosed\n'),
            CAREER_FILE,
            CATALOG
        );
        expect(raw).toBeNull();
        expect(findings).toHaveLength(1);
        expect(findings[0].message.startsWith('does not parse')).toBe(true);
    });

    it('reports a file that is not a map of keys', () => {
        const { findings } = readCareer(hub('- a list\n'), CAREER_FILE, CATALOG);
        expect(findings.map((one) => one.message)).toEqual(['is not a map of keys']);
    });
});

describe('normalising it', () => {
    const raw = readCareer(hub(CAREER), CAREER_FILE, CATALOG).career;
    const held = career(raw);

    it('reads the title, the milestone and the situation strip', () => {
        expect(held?.title).toBe('Career strategy');
        expect(held?.situation).toEqual([
            { label: 'PhD', value: 'May 2023, KU Leuven' },
            { label: 'Now', value: 'Postdoc, U Twente' }
        ]);
    });

    it('keeps every host key that is not the host itself as one of its scores', () => {
        expect(held?.hosts[0].scores).toEqual({ proposal: 'Strong', backing: 'High' });
        expect(held?.hosts[0].tag).toBe('transplant');
    });

    it('strips the bracketed score prefix the chips already show from a host note', () => {
        expect(held?.hosts[0].note).toBe('Federated outcome prediction.');
    });

    it('tolerates the plain-string form of an order row', () => {
        expect(held?.order.at(-1)).toEqual({ task: 'a plain string task' });
        expect(held?.orderNote).toBe('the order is a priority order');
    });

    it('reads the eligibility rules, the shots and the caveat', () => {
        expect(held?.eligibility?.shots).toEqual(['Nov 2026', 'Nov 2027']);
        expect(held?.eligibility?.rule).toHaveLength(2);
        expect(held?.eligibility?.caveat).toBe('a rushed try risks the second');
    });

    it('reads the not-hosts and the dropped rows with their reasons', () => {
        expect(held?.notHosts).toEqual([{ who: 'Peeters', why: 'former advisor' }]);
        expect(held?.dropped).toEqual([
            { what: 'MSCA-PF 2026' },
            { what: 'NWO Vidi', why: 'not yet eligible' }
        ]);
    });

    it('answers null for a hub with no career file', () => {
        expect(career(null)).toBeNull();
    });
});

describe('validating a host status', () => {
    function portfolio(over: Partial<RawPortfolio> = {}): RawPortfolio {
        return {
            manifests: [],
            registries: {
                venues: { entries: [], meta: {} },
                datasets: { entries: [], meta: {} },
                pillars: { entries: [], meta: {} },
                domains: { entries: [], meta: {} },
                funding: { entries: [], meta: {} },
                people: { entries: [], meta: {} },
                organisations: { entries: [], meta: {} }
            },
            collections: {},
            feeds: NO_FEEDS,
            career: readCareer(hub(CAREER), CAREER_FILE, CATALOG).career,
            docs: {},
            present: {},
            findings: [],
            ...over
        };
    }

    const rules: ValidationRules = {
        schema: null,
        vocab: {
            types: [],
            statuses: [],
            hostStatuses: ['awaiting', 'warm', 'candidate', 'drafted', 'dropped']
        },
        careerFile: '/hub/CAREER.yml',
        text: CATALOG
    };

    it('reports the one host whose status is outside the vocabulary', () => {
        expect(validate(portfolio(), rules).map((one) => `${one.key}: ${one.message}`)).toEqual([
            'hosts[2]: host status "mulled" is not one of the host status vocabulary'
        ]);
    });

    it('names the career file in the finding', () => {
        expect(validate(portfolio(), rules)[0].file).toBe('/hub/CAREER.yml');
    });

    it('leaves host statuses unchecked when the config holds no such vocabulary', () => {
        const bare: ValidationRules = {
            schema: null,
            vocab: { types: [], statuses: [] },
            text: CATALOG
        };
        expect(validate(portfolio(), bare)).toEqual([]);
    });

    it('reports nothing when the hub holds no career file', () => {
        expect(validate(portfolio({ career: null }), rules)).toEqual([]);
    });
});
