// Layer 2, client state tests. The Port row of the Settings view's "This machine" section when the
// server could not move to the port the primary hub's `local.yml` names: the port mover
// (server/root/process/context/port.ts) holds the refused move with its reason and tells the pages,
// the answer of GET /api/fs (server/root/process/context/machine-values.ts) gives the port the
// server listens on as the value in force, and the row (state/system/config/rows.ts) shows that
// port and says why, in the sentence the server logs. A move that is made again clears it.
//
// It does not cover the row as the view draws it, which the look does.

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { localDefaults, type LocalConfig } from '../../../../src/lib/data/sources/config.ts';
import { createPortMover } from '../../../../src/lib/server/root/process/context/port.ts';
import { machineValues } from '../../../../src/lib/server/root/process/context/machine-values.ts';
import { localRows } from '../../../../src/lib/state/system/config/rows.ts';
import { said } from '../../../../src/lib/views/system/workbench/settings/said.ts';
import { installRealText } from '../../../views/shared/real-text.ts';
import { shipped } from './fixture.ts';

beforeAll(installRealText);

afterEach(() => {
    vi.restoreAllMocks();
});

const REASON = 'the port is in use';

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
        const rows = localRows(shipped['local.yml'], {
            primary: 'lab',
            set: ['port'],
            defaults,
            values,
            hubs,
            portRefused: mover.refused()
        });
        const port = rows.find((row) => row.key === 'port');
        expect(port?.lines).toEqual(['8798']);
        const sentence = port?.refused === null || port === undefined ? '' : said(port.refused);
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
        const rows = localRows(shipped['local.yml'], {
            primary: 'lab',
            set: ['port'],
            defaults: { port: '8790' },
            values: { port: '8798' },
            hubs: {},
            portRefused: null
        });
        expect(rows.find((row) => row.key === 'port')?.refused).toBeNull();
    });
});
