// Layer 1, data source tests. A key of the machine's `local.yml` whose value is wrong counts as
// unset (data/sources/config/local.ts, `readLocalText`, whose `set` leaves it out), with its
// problem still reported, so the port of a server started with `--default-port`
// (server/root/process/start/port.ts, `readMachineWithDefault`) is that default when the primary
// hub's file holds a port that is not a number, as it is when the file holds none.
//
// It does not cover the server moving to that port, which the look does.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { readMachineWithDefault } from '../../../../../src/lib/server/root/process/start/port.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { plantHub } from '../../../../fixtures/hubs/workspace.ts';

/** The read of a primary hub whose `local.yml` holds `body`, by a server started on 8794. */
function readOver(body: string) {
    const hub = plantHub(scratchDir('oculus-wrong-port-'));
    writeFileSync(join(hub, '.oculus', 'local.yml'), body);
    return readMachineWithDefault(8794)([{ name: 'lab', dir: hub }], 'lab', false);
}

describe('a port that is not a number', () => {
    it('is the default the server was started with, and its problem is kept', () => {
        const read = readOver('port: x\n');
        expect(read.config.port).toBe(8794);
        expect(read.set).not.toContain('port');
        expect(read.problems.map((one) => one.problem.key)).toContain('port');
    });

    it('leaves a port that reads in force', () => {
        const read = readOver('port: 8811\n');
        expect(read.config.port).toBe(8811);
        expect(read.set).toContain('port');
    });
});
