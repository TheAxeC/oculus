// Layer 2, client state tests. The "This machine" section of the Settings view over the shipped
// catalog of `local.yml`: each key is listed with whether the primary hub's file sets it (by name)
// and the default in force where it does not; a workspace with no primary shows every default and
// says so, the user's row `self` among them writing nothing and saying why; the line that opens the
// file targets the primary's `.oculus/local.yml` through the primary's folder and nothing else.
//
// What this does NOT cover: how the section draws these lines (seen at the look), and the server's
// answer (tests/routes/hubs/machine-answer.test.ts).

import { describe, expect, it } from 'vitest';
import { openTarget } from '../../../../src/lib/state/system/config/config-files.ts';
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import type { ConfigRow, LocalRow } from '../../../../src/lib/state/system/config/rows.ts';
import { shipped } from './fixture.ts';

const DEFAULTS = { port: '8790', hpc_host: 'the cluster host', claude_bin: 'claude' };

/** The group and rows of the section for the machine state given. */
function machineGroup(machine: Parameters<typeof settingsGroups>[5]) {
    const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], machine);
    const group = groups.find((one) => one.id === 'machine');
    if (group === undefined) throw new Error('the machine group is missing');
    const rows = group.sections.flatMap((section) => section.rows) as (LocalRow | ConfigRow)[];
    return { group, rows, byKey: (key: string) => rows.find((row) => row.key === key) };
}

describe('the "This machine" section', () => {
    it('reads "set in <primary>" for the keys the primary sets and the default for the others', () => {
        const { byKey, group } = machineGroup({
            primary: 'lab',
            set: ['port', 'claude_bin'],
            defaults: DEFAULTS,
            values: {},
            hubs: {},
            portRefused: null
        });
        expect(byKey('port')).toMatchObject({ setIn: 'lab', fallback: '8790' });
        expect(byKey('claude_bin')).toMatchObject({ setIn: 'lab', fallback: 'claude' });
        expect(byKey('hpc_host')).toMatchObject({ setIn: null, fallback: 'the cluster host' });
        expect(group.about).toBe('');
    });

    it('lists every key of the catalog, whatever the file sets', () => {
        const { rows } = machineGroup({
            primary: 'lab',
            set: [],
            defaults: {},
            values: {},
            hubs: {},
            portRefused: null
        });
        expect(rows.map((row) => row.key)).toEqual(Object.keys(shipped['local.yml']));
    });

    it('shows every default and says there is no primary when the workspace has none', () => {
        const { rows, group, byKey } = machineGroup({
            primary: null,
            set: ['port'],
            defaults: DEFAULTS,
            values: {},
            hubs: {},
            portRefused: null
        });
        const local = rows.filter((row): row is LocalRow => row.kind === 'local');
        expect(local.every((row) => row.setIn === null)).toBe(true);
        expect(local.find((row) => row.key === 'port')?.fallback).toBe('8790');
        expect(byKey('self')).toMatchObject({
            own: false,
            blocked: { key: 'workbench.settings_no_primary' }
        });
        expect(group.about).not.toBe('');
    });

    it("opens the primary's .oculus/local.yml through the primary's folder, and nothing with no primary", () => {
        const { group } = machineGroup({
            primary: 'lab',
            set: [],
            defaults: {},
            values: {},
            hubs: {},
            portRefused: null
        });
        const [line] = group.lines;
        expect(line.file).toBe('.oculus/local.yml');
        const engine = { root: 'oculus', path: 'config' };
        const { root, path } = line.opens;
        expect(openTarget(root, path, { primary: 'lab', engine })).toEqual({
            root: 'lab',
            path: '.oculus/local.yml'
        });
        expect(openTarget(root, path, { primary: null, engine })).toBeNull();
    });
});
