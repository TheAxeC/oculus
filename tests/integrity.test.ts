// The one test that reads the real hub, read only. It opens files for reading and writes nothing,
// which is the exception the standing spec grants; every other test uses synthetic fixtures in a
// temporary directory.
//
// It is the gate DESIGN.md names: the model validates against the real hub with zero findings. A
// finding it reports is reported, never repaired here: the fix belongs in the hub's YAML or in the
// check, and this file is neither. When the hub path does not exist the whole file skips and says
// why on stderr, so a machine without the hub gets a stated skip rather than a silent pass.

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HUB_CONFIG_TODAY, buildPortfolio } from '../src/lib/data/index.ts';
import { engineDir, loadLocal } from '../src/lib/data/sources/config.ts';

const hub = loadLocal(engineDir()).hub;
const present = existsSync(hub);
if (!present) {
    console.warn(`integrity: skipped, the hub ${hub} does not exist on this machine`);
}

/** What the hub holds on 2026-09-10, one row per kind of entity. */
const COUNTS: [keyof ReturnType<typeof build>['entities'], number][] = [
    ['projects', 91],
    ['venues', 70],
    ['datasets', 49],
    ['programs', 9],
    ['domains', 12],
    ['funding', 11],
    ['collections', 7]
];

function build() {
    return buildPortfolio(hub, HUB_CONFIG_TODAY);
}

describe.skipIf(!present)('the real hub', () => {
    const snapshot = present ? build() : null;

    it('validates with no findings', () => {
        expect(snapshot?.findings).toEqual([]);
    });

    for (const [kind, count] of COUNTS) {
        it(`holds ${count} ${kind}`, () => {
            expect(Object.keys(snapshot?.entities[kind] ?? {}).length).toBe(count);
        });
    }

    it('survives JSON.stringify and JSON.parse unchanged', () => {
        expect(JSON.parse(JSON.stringify(snapshot))).toStrictEqual(snapshot);
    });
});
