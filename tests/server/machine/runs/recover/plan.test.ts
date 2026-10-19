// Layer 4, server test. The Recover plan (G112): one table, a row per state a file of the plan is
// stated in against the target folder, then the rows a check writes and the rows a Fetch takes.
// The check rows are made by `verifyRows` hashing real files under the temporary directory, and on
// the cluster by `checksFromLines` reading the lines the check job appends; a checksum that does
// not match leaves the file different, and Fetch takes only the missing, partial and different
// files, resuming a partial one.

import { utimesSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import type { RecoverFile, RecoverFileState } from '../../../../../src/lib/data/model/index.ts';
import { diskOf } from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import {
    fetchItems,
    planOf,
    unpackList,
    verifyList,
    type CheckRow,
    type OnDisk
} from '../../../../../src/lib/server/machine/runs/recover/plan.ts';
import {
    checksFromLines,
    readChecks,
    verifyRows
} from '../../../../../src/lib/server/machine/runs/recover/verify.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';

const SUM = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

/** A listed file of 100 bytes with a sha256, changed by the row. */
function listed(extra: Partial<RecoverFile> = {}): RecoverFile {
    return {
        name: 'a.dat',
        size: 100,
        checksum: { kind: 'sha256', value: SUM },
        url: 'https://example.org/a.dat',
        source: 0,
        ...extra
    };
}

/** A check row of a.dat at 100 bytes and the time 1000, with a checksum. */
function checked(value: string, extra: Partial<CheckRow> = {}): CheckRow {
    return { name: 'a.dat', size: 100, mtime: 1000, checksum: { kind: 'sha256', value }, ...extra };
}

type StateRow = {
    name: string;
    file: RecoverFile;
    disk?: OnDisk;
    check?: CheckRow;
    state: RecoverFileState;
};

const AT_SIZE: OnDisk = { size: 100, mtime: 1000 };

const STATES: StateRow[] = [
    { name: 'missing: no file on the disk', file: listed(), state: 'missing' },
    {
        name: 'partial: smaller than the source states',
        file: listed(),
        disk: { size: 40, mtime: 1000 },
        state: 'partial'
    },
    {
        name: 'different: larger than the source states',
        file: listed(),
        disk: { size: 140, mtime: 1000 },
        state: 'different'
    },
    {
        name: 'present: at its size with no check row yet',
        file: listed(),
        disk: AT_SIZE,
        state: 'present'
    },
    {
        name: 'present: a check row whose time no longer matches is stale',
        file: listed(),
        disk: { size: 100, mtime: 2000 },
        check: checked(SUM),
        state: 'present'
    },
    {
        name: 'present: a check row whose size no longer matches is stale',
        file: listed({ size: null }),
        disk: { size: 90, mtime: 1000 },
        check: checked(SUM),
        state: 'present'
    },
    {
        name: "verified: a fresh check row with the source's checksum, in either case",
        file: listed({ checksum: { kind: 'sha256', value: SUM.toUpperCase() } }),
        disk: AT_SIZE,
        check: checked(SUM),
        state: 'verified'
    },
    {
        name: 'different: a fresh check row with another checksum',
        file: listed(),
        disk: AT_SIZE,
        check: checked(OTHER),
        state: 'different'
    },
    {
        name: "verified: a fresh check row with the source's md5",
        file: listed({ checksum: { kind: 'md5', value: 'e'.repeat(32) } }),
        disk: AT_SIZE,
        check: { ...checked(SUM), checksum: { kind: 'md5', value: 'e'.repeat(32) } },
        state: 'verified'
    },
    {
        name: 'different: a check row of another kind of checksum than the source states',
        file: listed({ checksum: { kind: 'md5', value: 'c'.repeat(32) } }),
        disk: AT_SIZE,
        check: checked(SUM),
        state: 'different'
    },
    {
        name: 'present: a file the source states no checksum for, once at its size (an archive zip)',
        file: listed({ checksum: null, name: 'set.zip' }),
        disk: AT_SIZE,
        state: 'present'
    },
    {
        name: 'present: a file of no stated size and no checksum, once on the disk',
        file: listed({ checksum: null, size: null }),
        disk: { size: 7, mtime: 1000 },
        state: 'present'
    }
];

/** The sha256 of a text. */
function sha256(text: string): string {
    return createHash('sha256').update(text).digest('hex');
}

/** The md5 of a text. */
function md5(text: string): string {
    return createHash('md5').update(text).digest('hex');
}

describe('the Recover plan', () => {
    it.each(STATES)('$name', (row) => {
        const disk = new Map(row.disk === undefined ? [] : [[row.file.name, row.disk]]);
        const checks = row.check === undefined ? [] : [{ ...row.check, name: row.file.name }];
        expect(planOf([row.file], disk, checks, null).rows.map((one) => one.state)).toEqual([
            row.state
        ]);
    });

    it('checks the files on this Mac, a row per file, a mismatch leaving the file different', async () => {
        const folder = scratchDir('oculus-recover-plan-');
        const checks = join(scratchDir('oculus-recover-checks-'), 'set.checks.json');
        writeFileSync(join(folder, 'good.dat'), 'good bytes');
        writeFileSync(join(folder, 'bad.dat'), 'bad bytes!');
        writeFileSync(join(folder, 'summed.h5'), 'md5 bytes!');
        utimesSync(join(folder, 'good.dat'), 1700000000, 1700000000);
        const files = [
            listed({
                name: 'good.dat',
                size: 10,
                checksum: { kind: 'sha256', value: sha256('good bytes') }
            }),
            listed({
                name: 'bad.dat',
                size: 10,
                checksum: { kind: 'sha256', value: sha256('other') }
            }),
            listed({
                name: 'summed.h5',
                size: 10,
                checksum: { kind: 'md5', value: md5('md5 bytes!') }
            })
        ];
        const disk = diskOf(
            folder,
            files.map((one) => one.name)
        );
        const before = planOf(files, disk, readChecks(checks), null);
        expect(before.rows.map((one) => one.state)).toEqual(['present', 'present', 'present']);
        const heard: [string, boolean][] = [];
        await verifyRows(folder, verifyList(before.rows), checks, {
            bytes: () => undefined,
            checked: (name, matched) => heard.push([name, matched])
        });
        expect(heard).toEqual([
            ['good.dat', true],
            ['bad.dat', false],
            ['summed.h5', true]
        ]);
        const after = planOf(
            files,
            diskOf(
                folder,
                files.map((one) => one.name)
            ),
            readChecks(checks),
            null
        );
        expect(after.rows.map((one) => one.state)).toEqual(['verified', 'different', 'verified']);
        writeFileSync(join(folder, 'good.dat'), 'good bytes');
        utimesSync(join(folder, 'good.dat'), 1700000500, 1700000500);
        const touched = planOf(
            files,
            diskOf(
                folder,
                files.map((one) => one.name)
            ),
            readChecks(checks),
            null
        );
        expect(touched.rows[0].state).toBe('present');
    });

    it("reads the cluster check job's lines, the last line of a name holding", () => {
        const rows = checksFromLines(
            [
                `100 1000 sha256 ${OTHER} a.dat`,
                'not a check line',
                `100 1000 sha256 ${SUM} a.dat`,
                `5 1000 md5 ${'d'.repeat(32)} sub dir/b c.dat`
            ].join('\n')
        );
        expect(rows).toEqual([
            checked(SUM),
            {
                name: 'sub dir/b c.dat',
                size: 5,
                mtime: 1000,
                checksum: { kind: 'md5', value: 'd'.repeat(32) }
            }
        ]);
        expect(planOf([listed()], new Map([['a.dat', AT_SIZE]]), rows, null).rows[0].state).toBe(
            'verified'
        );
    });

    it('takes the missing, partial and different files to a Fetch, resuming the partial one', () => {
        const files = [
            listed({ name: 'missing.dat' }),
            listed({ name: 'partial.dat' }),
            listed({ name: 'different.dat' }),
            listed({ name: 'present.dat' }),
            listed({ name: 'verified.dat' }),
            listed({ name: 'archive.zip', checksum: null, unpack: { strip: 1 } })
        ];
        const disk = new Map<string, OnDisk>([
            ['partial.dat', { size: 30, mtime: 1000 }],
            ['different.dat', { size: 100, mtime: 1000 }],
            ['present.dat', AT_SIZE],
            ['verified.dat', AT_SIZE],
            ['archive.zip', AT_SIZE]
        ]);
        const plan = planOf(
            files,
            disk,
            [checked(OTHER, { name: 'different.dat' }), checked(SUM, { name: 'verified.dat' })],
            250
        );
        expect(plan.rows.map((one) => [one.name, one.state, one.have])).toEqual([
            ['missing.dat', 'missing', 0],
            ['partial.dat', 'partial', 30],
            ['different.dat', 'different', 100],
            ['present.dat', 'present', 100],
            ['verified.dat', 'verified', 100],
            ['archive.zip', 'present', 100]
        ]);
        expect(plan.totals).toEqual({ files: 6, bytes: 600, missing: 270, unsized: 0, free: 250 });
        expect(fetchItems(plan.rows).map((one) => [one.row.name, one.resume])).toEqual([
            ['missing.dat', false],
            ['partial.dat', true],
            ['different.dat', false]
        ]);
        expect(fetchItems(plan.rows, 'partial.dat').map((one) => one.row.name)).toEqual([
            'partial.dat'
        ]);
        expect(fetchItems(plan.rows, 'present.dat')).toEqual([]);
        expect(verifyList(plan.rows).map((one) => one.name)).toEqual([
            'different.dat',
            'present.dat',
            'verified.dat'
        ]);
        expect(unpackList(plan.rows).map((one) => one.name)).toEqual(['archive.zip']);
    });
});
