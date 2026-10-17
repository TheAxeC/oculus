// Layer 2, client state tests. The "This machine" section of the Settings view over the shipped
// catalog of `local.yml`: each key is listed with whether the primary hub's file sets it (by name)
// and the default in force where it does not; a workspace with no primary shows every default and
// says so; the line that opens the file targets the primary's `.oculus/local.yml` through the
// primary's folder and nothing else.
//
// What this does NOT cover: how the section draws these lines (seen at the look), and the server's
// answer (tests/routes/hubs/machine-answer.test.ts).

import { describe, expect, it } from 'vitest';
import { NO_TEXT } from '../../../../src/lib/state/sources/fs-transport.ts';
import { openTarget } from '../../../../src/lib/state/system/config/config-files.ts';
import { settingsGroups } from '../../../../src/lib/state/system/config/groups.ts';
import type { LocalRow } from '../../../../src/lib/state/system/config/rows.ts';
import { shipped } from './fixture.ts';

const DEFAULTS = { port: '8790', hpc_host: 'the cluster host', claude_bin: 'claude' };

/** The group and rows of the section for the machine state given. */
function machineGroup(machine: Parameters<typeof settingsGroups>[6]) {
    const groups = settingsGroups(shipped, () => NO_TEXT, [], undefined, undefined, [], machine);
    const group = groups.find((one) => one.id === 'machine');
    if (group === undefined) throw new Error('the machine group is missing');
    const rows = group.sections.flatMap((section) => section.rows) as LocalRow[];
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
        const { rows, group } = machineGroup({
            primary: null,
            set: ['port'],
            defaults: DEFAULTS,
            values: {},
            hubs: {},
            portRefused: null
        });
        expect(rows.every((row) => row.setIn === null)).toBe(true);
        expect(rows.find((row) => row.key === 'port')?.fallback).toBe('8790');
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
        expect(openTarget(line.root, line.file, { primary: 'lab', engine })).toEqual({
            root: 'lab',
            path: '.oculus/local.yml'
        });
        expect(openTarget(line.root, line.file, { primary: null, engine })).toBeNull();
    });
});
