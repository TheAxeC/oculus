// Layer 2, client state tests. The Port row of the Settings view's This machine scope of the
// primary when the server could not move to the port the primary hub's `local.yml` names: the
// port mover (server/root/process/context/port.ts) holds the refused move with its reason and
// tells the pages, the answer of GET /api/fs (server/root/process/context/machine-values.ts)
// gives the port the server listens on as the value in force, and the row
// (state/system/config/rows.ts `localRows`) says under its control that the server stays on that
// port and why, in the sentence the server logs. A move that is made again clears it.
//
// It does not cover the row as the view draws it, which the look does.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { localDefaults, type LocalConfig } from '../../../../src/lib/data/sources/config.ts';
import { createPortMover } from '../../../../src/lib/server/root/process/context/port.ts';
import { machineValues } from '../../../../src/lib/server/root/process/context/machine-values.ts';
import { localRows, type LocalScope } from '../../../../src/lib/state/system/config/rows.ts';
import { said } from '../../../../src/lib/views/system/workbench/settings/said.ts';
import { installRealText } from '../../../views/shared/real-text.ts';
import { shipped } from './fixture.ts';

beforeAll(installRealText);

afterEach(() => {
    vi.restoreAllMocks();
});

const REASON = 'the port is in use';

/** The Port row of the primary's This machine scope, over a file that sets `port: 8790`. */
function portRow(machine: LocalScope['machine']) {
    const file = { present: true, digest: 'd', values: { port: 8790 }, unparsed: null };
    const rows = localRows(shipped['local.yml'], { hub: 'lab', primary: true, file, machine });
    return rows.find((row) => row.key === 'port');
}

describe('the Port row of a server whose move was refused', () => {
    it('shows the port the server listens on and the refusal', async () => {
        const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const local: LocalConfig = { ...localDefaults(), port: 8798 };
        const told = vi.fn();
        const mover = createPortMover({
            local,
            portMove: () => Promise.resolve(REASON),
            isClosed: () => false,
            listeningOn: () => undefined,
            refusalChanged: told
        });
        mover.want(8790);
        await vi.waitFor(() => expect(mover.refused()).toEqual({ port: 8790, reason: REASON }));
        expect(told).toHaveBeenCalledTimes(1);

        const read: LocalConfig = { ...localDefaults(), port: 8790 };
        const defaults = { port: '8790' };
        const { values, hubs } = machineValues(read, local.port, ['port'], defaults, {}, 'set');
        expect(values.port).toBe('8798');
        const port = portRow({
            primary: 'lab',
            set: ['port'],
            defaults,
            values,
            hubs,
            portRefused: mover.refused()
        });
        expect(port?.value).toBe(8790);
        const sentence = port?.note === undefined ? '' : said(port.note);
        const log = String(logged.mock.calls[0]?.[0] ?? '');
        expect(log).toBe(
            `local.yml: port 8790 cannot be used (${REASON}); the server stays on 8798`
        );
        expect(sentence.startsWith(log)).toBe(true);

        mover.want(8798);
        expect(mover.refused()).toBeNull();
        expect(told).toHaveBeenCalledTimes(2);
    });

    it('says nothing when no move was refused', () => {
        const port = portRow({
            primary: 'lab',
            set: ['port'],
            defaults: { port: '8790' },
            values: { port: '8798' },
            hubs: {},
            portRefused: null
        });
        expect(port?.note).toBeUndefined();
    });
});
