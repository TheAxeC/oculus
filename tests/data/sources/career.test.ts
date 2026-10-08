// Layer 1, data tests. sources/career.ts and the career half of normalise, over a
// synthetic hub written under mkdtemp. Nothing here touches the real hub.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { CAREER_FILE } from '../../../src/lib/data/helpers/hub-names.ts';
import { readCareer } from '../../../src/lib/data/sources/career.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { career } from '../../../src/lib/data/snapshot/normalise-career.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

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
    const dir = scratchDir('oculus-career-');
    if (body !== null) {
        const full = join(dir, 'registries/career.yml');
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(dirname(full), { recursive: true });
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
});

describe('normalising it', () => {
    let held: ReturnType<typeof career> = null;
    test.beforeAll(() => {
        held = career(readCareer(hub(CAREER), CAREER_FILE, CATALOG).career);
    });

    it('reads the title, the milestone and the situation strip', () => {
        expect(held?.title).toBe('Career strategy');
        expect(held?.situation).toEqual([
            { label: 'PhD', value: 'May 2023, KU Leuven' },
            { label: 'Now', value: 'Postdoc, U Twente' }
        ]);
    });
});
