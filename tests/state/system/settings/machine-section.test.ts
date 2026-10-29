// Layer 2, client state tests. The This machine scope of the Settings view over the shipped catalog
// of `local.yml` (state/system/config/rows.ts `localRows`, scopes/rows.ts `scopeGroups`): for the
// primary every key of the file is a row with a control, holding the file's own value and the
// default the server sent; for another hub only the keys whose rows every hub's file joins, kept
// under that hub, `port` not among them; a `downloads` row's secret stands as set, never as its
// value; while the file is not answered, or when it does not parse, every row says so with the
// line and writes nothing; no other scope draws a key of `local.yml`.
//
// What this does NOT cover: how the scope draws these rows (seen at the look), and the server's
// answer (tests/routes/hubs/settings-secrets.test.ts, tests/routes/hubs/machine-answer.test.ts).

import { describe, expect, it } from 'vitest';
import { JOINED_LOCAL_KEYS } from '../../../../src/lib/data/helpers/hub-names.ts';
import { LOCAL_KEYS } from '../../../../src/lib/data/sources/config/local.ts';
import type { LocalFile } from '../../../../src/lib/data/shapes/config-save.ts';
import { draftOf } from '../../../../src/lib/state/system/config/editors/draft.ts';
import { settingsGroups, type Row } from '../../../../src/lib/state/system/config/groups.ts';
import {
    writtenWhole,
    type ConfigRow,
    type LocalScope
} from '../../../../src/lib/state/system/config/rows.ts';
import { scopeGroups } from '../../../../src/lib/state/system/config/scopes/rows.ts';
import type { Scope, ScopeGround } from '../../../../src/lib/state/system/config/scopes/scope.ts';
import { shipped } from './fixture.ts';

const DEFAULTS = { port: '8790', rite_dap_bin: 'rite_dap', claude_bin: 'claude' };

/** What the server sent of the machine's files. */
const MACHINE: LocalScope['machine'] = {
    primary: 'hub',
    set: [],
    defaults: DEFAULTS,
    values: {},
    hubs: {},
    portRefused: null
};

/** A `local.yml` the server answered, with these values. */
function answered(values: Record<string, unknown>, unparsed: number | null = null): LocalFile {
    return { present: true, digest: 'd', values: unparsed === null ? values : null, unparsed };
}

/** The rows of This machine for one hub's file. */
function machineRows(of: Omit<LocalScope, 'machine'>): ConfigRow[] {
    const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], {
        ...of,
        machine: MACHINE
    });
    const group = groups.find((one) => one.id === 'machine');
    if (group === undefined) throw new Error('the machine group is missing');
    return group.sections
        .flatMap((section) => section.rows)
        .filter((row): row is ConfigRow => row.kind === 'config');
}

/** The key of `local.yml` a row is of: `literature` for the row of `literature.mailto`. */
const topKey = (row: ConfigRow): string => row.key.split('.')[0];

/** The ground of a workspace of the hubs `hub`, the primary, and `lab`. */
const GROUND: ScopeGround = {
    folders: [
        { key: 'hub', dir: '/w/hub', hub: true },
        { key: 'lab', dir: '/w/lab', hub: true }
    ],
    primary: 'hub',
    workspaceFile: '.oculus/workspaces/w.yml'
};

/** The keys of `local.yml` rows a scope draws over groups that hold the primary's file. */
function drawnIn(scope: Scope): string[] {
    const groups = settingsGroups(shipped, {}, { workspace: null }, undefined, [], {
        hub: 'hub',
        primary: true,
        file: answered({}),
        machine: MACHINE
    });
    const file = { name: 'f', present: true, blocked: null, digest: 'd' };
    return scopeGroups(groups, scope, GROUND, file)
        .flatMap((group) => group.sections.flatMap((section) => section.rows))
        .filter((row: Row): row is ConfigRow => row.kind === 'config' && row.file === 'local.yml')
        .map(topKey);
}

describe('the This machine scope', () => {
    it("draws every key of local.yml for the primary, with a control, the file's value and the default", () => {
        const rows = machineRows({ hub: 'hub', primary: true, file: answered({ port: 8798 }) });
        expect(rows.map(topKey).sort()).toEqual([...LOCAL_KEYS].sort());
        const port = rows.find((row) => row.key === 'port');
        expect([port?.value, port?.default, port?.own, port?.blocked]).toEqual([
            8798,
            8790,
            true,
            undefined
        ]);
        const claude = rows.find((row) => row.key === 'claude_bin');
        expect([claude?.value, claude?.default, claude?.state]).toEqual([
            undefined,
            'claude',
            'missing'
        ]);
        const undrawn = rows.filter((row) => writtenWhole(row.control) && draftOf(row) === null);
        expect(undrawn.map((row) => row.key)).toEqual([]);
    });

    it('draws only the joined keys for a hub other than the primary, kept under that hub', () => {
        const rows = machineRows({ hub: 'lab', primary: false, file: answered({}) });
        expect(rows.map((row) => row.key).sort()).toEqual([...JOINED_LOCAL_KEYS].sort());
        expect(rows.every((row) => row.slot === 'lab' && row.hub === 'lab')).toBe(true);
    });

    it('holds a downloads secret as set, never as its value', () => {
        const downloads = [{ service: 'ieee', user: 'me', secret: true }];
        const rows = machineRows({ hub: 'hub', primary: true, file: answered({ downloads }) });
        expect(rows.find((row) => row.key === 'downloads')?.value).toEqual(downloads);
    });

    it.each([
        {
            name: 'is not answered yet',
            file: undefined,
            said: 'workbench.settings_loading',
            args: ['hub/.oculus/local.yml']
        },
        {
            name: 'does not parse',
            file: answered({}, 4),
            said: 'workbench.settings_unparsed_at',
            args: ['hub/.oculus/local.yml', 4]
        }
    ])('says why every row writes nothing while the file $name', ({ file, said, args }) => {
        const rows = machineRows({ hub: 'hub', primary: true, file });
        expect(rows.every((row) => row.blocked?.key === said)).toBe(true);
        expect(rows[0].blocked?.args).toEqual(args);
    });

    it("is the only scope that draws a key of local.yml, and port only in the primary's", () => {
        expect(drawnIn({ kind: 'local', hub: 'hub' }).sort()).toEqual([...LOCAL_KEYS].sort());
        for (const scope of [
            { kind: 'workspace' },
            { kind: 'primary' },
            { kind: 'hub', hub: 'lab' }
        ] as Scope[]) {
            expect(drawnIn(scope)).toEqual([]);
        }
        expect(
            machineRows({ hub: 'lab', primary: false, file: answered({}) }).map((row) => row.key)
        ).not.toContain('port');
    });
});
