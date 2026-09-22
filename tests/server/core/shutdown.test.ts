// What a stop signal does, driven through a recording target. No real signal is sent and no process
// exits: the handler the module registered is called by hand, which is the whole point of the
// target being passed in.

import { describe, expect, it } from 'vitest';
import { SIGNALS, onShutdown } from '../../../src/lib/server/core/shutdown.ts';
import { noop } from '../../fixtures/doubles.ts';

type Recorder = {
    handlers: Map<string, () => void>;
    exits: number[];
};

function target(): {
    target: { on(signal: string, handler: () => void): void; exit(code: number): void };
    record: Recorder;
} {
    const record: Recorder = { handlers: new Map(), exits: [] };
    return {
        record,
        target: {
            on: (signal, handler) => void record.handlers.set(signal, handler),
            exit: (code) => void record.exits.push(code)
        }
    };
}

describe('onShutdown', () => {
    it('takes both stop signals', () => {
        const held = target();
        onShutdown(held.target, noop);
        expect([...held.record.handlers.keys()].sort()).toEqual([...SIGNALS].sort());
    });

    it('closes once for two signals and exits when the close calls back', () => {
        const held = target();
        let closes = 0;
        let finish: () => void = noop;
        onShutdown(held.target, (done) => {
            closes += 1;
            finish = done;
        });

        held.record.handlers.get('SIGINT')?.();
        expect(closes).toBe(1);
        expect(held.record.exits).toEqual([]);

        // A second signal while the close is running exits at once, and closes nothing twice.
        held.record.handlers.get('SIGTERM')?.();
        expect(closes).toBe(1);
        expect(held.record.exits).toEqual([0]);

        finish();
        expect(held.record.exits).toEqual([0, 0]);
    });

    it('exits even when the close throws', () => {
        const held = target();
        onShutdown(held.target, () => {
            throw new Error('a watcher refused to close');
        });
        held.record.handlers.get('SIGINT')?.();
        expect(held.record.exits).toEqual([0]);
    });
});
